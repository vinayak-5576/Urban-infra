import random
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import func
from geoalchemy2 import Geography
from alembic.migration import MigrationContext
from alembic.autogenerate import compare_metadata
from backend.app.db.session import SessionLocal, Base, engine
from backend.app.db.models import User, Zone, Department, ResponsibilityRule, Issue, Report
from backend.app.services.geo import geo_service, oracle_geo_service, PostGISGeoService, RayCastingGeoService

def test_schema_matches_models():
    """
    Requirement 4: Verify that on brand-new empty Postgres database alembic upgrade head
    creates every model column (including is_demo) and compare_metadata detects zero schema drift.
    """
    # 1. Verify model column definitions
    assert hasattr(User, "is_demo"), "User model missing is_demo"
    assert hasattr(Zone, "is_demo"), "Zone model missing is_demo"
    assert hasattr(Department, "is_demo"), "Department model missing is_demo"
    assert hasattr(ResponsibilityRule, "is_demo"), "ResponsibilityRule model missing is_demo"

    assert hasattr(Zone, "geom"), "Zone model missing geom"
    assert hasattr(Issue, "location"), "Issue model missing location"
    assert hasattr(Report, "location"), "Report model missing location"

    # Verify no ward_number exists on Zone
    assert not hasattr(Zone, "ward_number"), "Zone model must not contain ward_number"

    # 2. Compare database schema against SQLAlchemy models
    our_tables = set(Base.metadata.tables.keys())
    def include_object(obj, name, type_, ref, comp):
        if type_ == "table":
            return name in our_tables
        return True

    with engine.connect() as conn:
        mc = MigrationContext.configure(conn, opts={"include_object": include_object})
        diff = compare_metadata(mc, Base.metadata)
        assert diff == [], f"Schema drift detected between models and migrated DB: {diff}"

def test_postgis_oracle_agreement_200_points():
    """
    Requirement 7: For 200 random points in the pilot area, verify PostGIS zone lookup
    and distances agree with the pure-Python oracle (distance within 1 m tolerance).
    """
    db = SessionLocal()
    try:
        # Fixed random seed for repeatability
        rng = random.Random(42)

        # Pilot area bounds across Bengaluru pilot zones (12.90 to 13.03 lat, 77.56 to 77.76 lon)
        min_lat, max_lat = 12.9000, 13.0300
        min_lon, max_lon = 77.5600, 77.7600

        assert isinstance(geo_service, PostGISGeoService), "Active geo_service must be PostGISGeoService"
        assert isinstance(oracle_geo_service, RayCastingGeoService), "Oracle must be RayCastingGeoService"

        for i in range(200):
            lat = rng.uniform(min_lat, max_lat)
            lon = rng.uniform(min_lon, max_lon)

            # 1. Zone lookup comparison
            postgis_zone = geo_service.find_zone_for_point(lat, lon, db=db)
            oracle_zone = oracle_geo_service.find_zone_for_point(lat, lon, db=db)

            postgis_zone_id = postgis_zone.id if postgis_zone else None
            oracle_zone_id = oracle_zone.id if oracle_zone else None

            assert postgis_zone_id == oracle_zone_id, (
                f"Point ({lat}, {lon}) zone mismatch: PostGIS={postgis_zone_id}, Oracle={oracle_zone_id}"
            )

            # 2. Distance comparison within 1 m tolerance
            lat2 = rng.uniform(min_lat, max_lat)
            lon2 = rng.uniform(min_lon, max_lon)

            oracle_dist = oracle_geo_service.haversine_distance_meters(lat, lon, lat2, lon2)
            postgis_dist = geo_service.st_distance_meters(lat, lon, lat2, lon2, db=db, use_spheroid=False)

            diff = abs(oracle_dist - postgis_dist)
            assert diff <= 1.0, (
                f"Distance calculation mismatch at sample {i}: "
                f"Oracle={oracle_dist:.4f}m, PostGIS={postgis_dist:.4f}m, diff={diff:.4f}m > 1.0m"
            )
    finally:
        db.close()

def test_postgis_candidate_search_st_dwithin():
    """
    Requirement 5 & 6: Verify PostGIS ST_DWithin candidate search returns
    nearby issues within 25 m radius.
    """
    db = SessionLocal()
    try:
        # Existing seeded Koramangala pothole at (12.9352, 77.6245)
        cutoff_time = datetime.now(timezone.utc) - timedelta(days=7)
        open_statuses = ["new", "acknowledged", "in_progress", "reopened"]

        # Exact match / within 5m
        nearby = geo_service.find_candidate_issues(
            db=db,
            category_id="cat-pothole",
            zone_id="zone-koramangala",
            lat=12.93522,
            lon=77.62452,
            radius_m=25.0,
            cutoff_time=cutoff_time,
            open_statuses=open_statuses
        )
        assert len(nearby) >= 1
        assert any(iss.category_id == "cat-pothole" for iss in nearby)

        # Far away (> 50m) should return empty list
        far_away = geo_service.find_candidate_issues(
            db=db,
            category_id="cat-pothole",
            zone_id="zone-koramangala",
            lat=12.9400,
            lon=77.6300,
            radius_m=25.0,
            cutoff_time=cutoff_time,
            open_statuses=open_statuses
        )
        assert len(far_away) == 0
    finally:
        db.close()
