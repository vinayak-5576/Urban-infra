import math
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Tuple

class IGeoService(ABC):
    """Abstract interface for all spatial and geodetic operations."""

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
    def find_zone_for_point(self, lat: float, lon: float, zones: List[Any]) -> Optional[Any]:
        """Resolves which zone contains the given lat/lon point."""
        pass


class RayCastingGeoService(IGeoService):
    """
    Pure Python GeoService implementation using Ray-Casting algorithm.
    Requires no C++ DLLs or external GIS daemon, ensuring zero OS security policy lockouts.
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

    def find_zone_for_point(self, lat: float, lon: float, zones: List[Any]) -> Optional[Any]:
        for zone in zones:
            try:
                geom = zone.geom_geojson
                geom_type = geom.get("type")
                coords = geom.get("coordinates", [])

                if geom_type == "Polygon":
                    outer_ring = coords[0]
                    if self.point_in_polygon(lon, lat, outer_ring):
                        return zone
                elif geom_type == "MultiPolygon":
                    for poly in coords:
                        if self.point_in_polygon(lon, lat, poly[0]):
                            return zone
            except Exception:
                continue
        return None


# Default singleton instance
geo_service: IGeoService = RayCastingGeoService()

# Backward-compatible function wrappers
def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    return geo_service.haversine_distance_meters(lat1, lon1, lat2, lon2)

def point_in_polygon_ray_casting(px: float, py: float, polygon_coords: List[List[float]]) -> bool:
    return geo_service.point_in_polygon(px, py, polygon_coords)

def find_zone_for_point(lat: float, lon: float, zones: List[Any]) -> Optional[Any]:
    return geo_service.find_zone_for_point(lat, lon, zones)
