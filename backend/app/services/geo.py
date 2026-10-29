import math
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from geoalchemy2 import Geography, Geometry

class IGeoService(ABC):
    """Abstract interface for all spatial, geodetic, and proximity operations."""

    @abstractmethod
    def haversine_distance_meters(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates great-circle distance between two GPS coordinates in meters."""
        pass

    @abstractmethod
    def point_in_polygon(self, px: float, py: float, polygon_coords: List[List[float]]) -> bool:
        """
        Determines whether point (px=lon, py=lat) is inside polygon coordinates.
        polygon_coords: [[lon1, lat1], [lon2, lat2], ...]
        """
        pass

    @abstractmethod
    def find_zone_for_point(
        self,
        lat: float,
        lon: float,
        zones: Optional[List[Any]] = None,
        db: Optional[Session] = None
    ) -> Optional[Any]:
        """Resolves which zone contains the given lat/lon point."""
        pass

    @abstractmethod
    def find_candidate_issues(
        self,
        db: Session,
        category_id: str,
        zone_id: str,
        lat: float,
        lon: float,
        radius_m: float,
        cutoff_time: datetime,
        open_statuses: List[str]
    ) -> List[Any]:
        """Searches for open issues matching category and within radius_m spatial buffer."""
        pass


class RayCastingGeoService(IGeoService):
    """
    Pure Python GeoService reference oracle using Ray-Casting algorithm.
    Used for local evaluation and as the authoritative test oracle.
    """

    def haversine_distance_meters(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371000.0  # Earth's radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def point_in_polygon(self, px: float, py: float, polygon_coords: List[List[float]]) -> bool:
        inside = False
        n = len(polygon_coords)
        if n < 3:
            return False

        j = n - 1
        for i in range(n):
            xi, yi = polygon_coords[i][0], polygon_coords[i][1]
            xj, yj = polygon_coords[j][0], polygon_coords[j][1]

            intersect = ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / (yj - yi + 1e-12) + xi)
            if intersect:
                inside = not inside
            j = i

        return inside

    def find_zone_for_point(
        self,
        lat: float,
        lon: float,
        zones: Optional[List[Any]] = None,
        db: Optional[Session] = None
    ) -> Optional[Any]:
        if zones is None and db is not None:
            from backend.app.db.models import Zone
            zones = db.query(Zone).all()

        if not zones:
            return None

        for zone in zones:
            try:
                geom = zone.geom_geojson
                if not geom:
                    continue
                geom_type = geom.get("type")
                coords = geom.get("coordinates", [])

                if geom_type == "Polygon":
                    if self.point_in_polygon(lon, lat, coords[0]):
                        return zone
                elif geom_type == "MultiPolygon":
                    for poly in coords:
                        if self.point_in_polygon(lon, lat, poly[0]):
                            return zone
            except Exception:
                continue
        return None

    def find_candidate_issues(
        self,
        db: Session,
        category_id: str,
        zone_id: str,
        lat: float,
        lon: float,
        radius_m: float,
        cutoff_time: datetime,
        open_statuses: List[str]
    ) -> List[Any]:
        from backend.app.db.models import Issue
        candidates = db.query(Issue).filter(
            Issue.category_id == category_id,
            Issue.zone_id == zone_id,
            Issue.status.in_(open_statuses),
            Issue.first_reported_at >= cutoff_time
        ).all()

        return [
            c for c in candidates
            if self.haversine_distance_meters(lat, lon, c.latitude, c.longitude) <= radius_m
        ]


class PostGISGeoService(IGeoService):
    """
    Production PostGIS GeoService executing spatial operations via PostgreSQL + PostGIS (ST_Contains, ST_DWithin).
    Maintains RayCastingGeoService as an internal oracle for fallback when needed.
    """

    def __init__(self, oracle: Optional[RayCastingGeoService] = None):
        self.oracle = oracle or RayCastingGeoService()

    def haversine_distance_meters(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        return self.oracle.haversine_distance_meters(lat1, lon1, lat2, lon2)

    def st_distance_meters(self, lat1: float, lon1: float, lat2: float, lon2: float, db: Session, use_spheroid: bool = False) -> float:
        p1 = func.ST_SetSRID(func.ST_MakePoint(lon1, lat1), 4326).cast(Geography)
        p2 = func.ST_SetSRID(func.ST_MakePoint(lon2, lat2), 4326).cast(Geography)
        return float(db.query(func.ST_Distance(p1, p2, use_spheroid)).scalar())

    def point_in_polygon(self, px: float, py: float, polygon_coords: List[List[float]]) -> bool:
        return self.oracle.point_in_polygon(px, py, polygon_coords)

    def find_zone_for_point(
        self,
        lat: float,
        lon: float,
        zones: Optional[List[Any]] = None,
        db: Optional[Session] = None
    ) -> Optional[Any]:
        if db is not None:
            try:
                from backend.app.db.models import Zone
                point_geom = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
                zone = db.query(Zone).filter(func.ST_Contains(Zone.geom, point_geom)).first()
                if zone:
                    return zone
            except Exception:
                pass  # Fall back to oracle
        return self.oracle.find_zone_for_point(lat, lon, zones, db)

    def find_candidate_issues(
        self,
        db: Session,
        category_id: str,
        zone_id: str,
        lat: float,
        lon: float,
        radius_m: float,
        cutoff_time: datetime,
        open_statuses: List[str]
    ) -> List[Any]:
        try:
            from backend.app.db.models import Issue
            point_geog = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326).cast(Geography)
            return db.query(Issue).filter(
                Issue.category_id == category_id,
                Issue.zone_id == zone_id,
                Issue.status.in_(open_statuses),
                Issue.first_reported_at >= cutoff_time,
                func.ST_DWithin(Issue.location, point_geog, radius_m)
            ).all()
        except Exception:
            # Fall back to oracle query
            return self.oracle.find_candidate_issues(
                db, category_id, zone_id, lat, lon, radius_m, cutoff_time, open_statuses
            )


# Oracle instance (RayCastingGeoService)
oracle_geo_service = RayCastingGeoService()

# Primary active GeoService (PostGISGeoService backed by oracle)
geo_service: IGeoService = PostGISGeoService(oracle=oracle_geo_service)

# Backward-compatible function wrappers
def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    return geo_service.haversine_distance_meters(lat1, lon1, lat2, lon2)

def point_in_polygon_ray_casting(px: float, py: float, polygon_coords: List[List[float]]) -> bool:
    return geo_service.point_in_polygon(px, py, polygon_coords)

def find_zone_for_point(lat: float, lon: float, zones: Optional[List[Any]] = None, db: Optional[Session] = None) -> Optional[Any]:
    return geo_service.find_zone_for_point(lat, lon, zones=zones, db=db)
