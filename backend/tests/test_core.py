import io
import pytest
from fastapi.testclient import TestClient
from fastapi import UploadFile, HTTPException
from backend.app.main import app
from backend.app.services.geo import geo_service, find_zone_for_point, haversine_distance_meters, RayCastingGeoService, IGeoService
from backend.app.services.priority import compute_priority_score
from backend.app.services.storage import storage_service, MAX_FILE_BYTES
from backend.app.api.v1.analytics import compute_wilson_interval
from backend.app.ml.text_classifier import classifier
from backend.app.db.session import SessionLocal
from backend.app.db.models import Zone, User, Issue

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "study_area" in data
    assert data["text_classifier"]["status"] == "ready"

def test_zone_point_in_polygon():
    db = SessionLocal()
    try:
        zones = db.query(Zone).all()
        # Point inside Koramangala (12.935, 77.625)
        matched_inside = find_zone_for_point(12.935, 77.625, zones)
        assert matched_inside is not None
        assert matched_inside.id == "zone-koramangala"

        # Point outside pilot bounds (e.g., Delhi: 28.6139, 77.2090)
        matched_outside = find_zone_for_point(28.6139, 77.2090, zones)
        assert matched_outside is None
    finally:
        db.close()

def test_geo_service_interface():
    from backend.app.services.geo import PostGISGeoService, oracle_geo_service
    assert isinstance(geo_service, IGeoService)
    assert isinstance(geo_service, (PostGISGeoService, RayCastingGeoService))
    assert isinstance(oracle_geo_service, RayCastingGeoService)
    # Haversine distance
    dist = geo_service.haversine_distance_meters(12.9352, 77.6245, 12.9360, 77.6245)
    assert 50 < dist < 150

def test_haversine_distance():
    dist = haversine_distance_meters(12.9352, 77.6245, 12.9360, 77.6245)
    assert 50 < dist < 150

def test_priority_score_calculation():
    score_info = compute_priority_score(
        severity=0.85,
        exposure=0.6,
        corroboration_count=5,
        recurrence_count=0,
        age_vs_sla=0.2
    )
    assert "total_score" in score_info
    assert 50.0 <= score_info["total_score"] <= 100.0
    assert score_info["weights"]["severity"] == 0.30
    assert score_info["weights"]["recurrence"] == 0.15

def test_priority_monotonicity():
    """Verify that increasing any input parameter never decreases the priority score."""
    base = compute_priority_score(severity=0.4, exposure=0.5, corroboration_count=2, recurrence_count=1, age_vs_sla=0.3)["total_score"]

    # Increasing severity
    more_sev = compute_priority_score(severity=0.8, exposure=0.5, corroboration_count=2, recurrence_count=1, age_vs_sla=0.3)["total_score"]
    assert more_sev >= base

    # Increasing exposure
    more_exp = compute_priority_score(severity=0.4, exposure=0.9, corroboration_count=2, recurrence_count=1, age_vs_sla=0.3)["total_score"]
    assert more_exp >= base

    # Increasing corroboration
    more_corrob = compute_priority_score(severity=0.4, exposure=0.5, corroboration_count=8, recurrence_count=1, age_vs_sla=0.3)["total_score"]
    assert more_corrob >= base

    # Increasing recurrence
    more_rec = compute_priority_score(severity=0.4, exposure=0.5, corroboration_count=2, recurrence_count=3, age_vs_sla=0.3)["total_score"]
    assert more_rec >= base

    # Increasing age vs sla
    more_age = compute_priority_score(severity=0.4, exposure=0.5, corroboration_count=2, recurrence_count=1, age_vs_sla=0.8)["total_score"]
    assert more_age >= base

def test_text_classifier_suggestion():
    cat, conf = classifier.predict("There is a massive dangerous crater on the road breaking car wheels")
    assert cat == "cat-pothole"
    assert conf >= 0.50

    cat2, conf2 = classifier.predict("Illegal garbage dump on the street corner attracting street dogs and foul smell")
    assert cat2 == "cat-garbage"
    assert conf2 >= 0.50

def test_auth_and_login_flow():
    test_email = "testcitizen_unit@demo.org"
    register_payload = {
        "email": test_email,
        "password": "securepassword123",
        "full_name": "Unit Tester"
    }
    reg_res = client.post("/api/v1/auth/register", json=register_payload)
    if reg_res.status_code != 400:
        assert reg_res.status_code == 201

    login_res = client.post("/api/v1/auth/login", json={"email": test_email, "password": "securepassword123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token

    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email
    assert me_res.json()["role"] == "citizen"

def test_auth_role_matrix():
    """Verify unauthenticated access returns 401, and unauthorized role transitions return 403."""
    # 1. Unauthenticated /me
    res_no_auth = client.get("/api/v1/auth/me")
    assert res_no_auth.status_code == 401

    # 2. Login as citizen
    res_citizen = client.post("/api/v1/auth/login", json={"email": "citizen.koramangala@demo.org", "password": "citizen123"})
    assert res_citizen.status_code == 200
    citizen_token = res_citizen.json()["access_token"]

    # 3. Citizen attempting to transition issue status should get 403 Forbidden
    db = SessionLocal()
    issue = db.query(Issue).first()
    db.close()
    if issue:
        patch_res = client.patch(
            f"/api/v1/issues/{issue.id}/status",
            json={"status": "in_progress", "reason": "Unauthorized attempt by citizen"},
            headers={"Authorization": f"Bearer {citizen_token}"}
        )
        assert patch_res.status_code == 403

    # 4. Officer attempting transition succeeds
    res_officer = client.post("/api/v1/auth/login", json={"email": "officer.koramangala@gba.civic.in", "password": "officer123"})
    assert res_officer.status_code == 200
    officer_token = res_officer.json()["access_token"]

    # Officer can access scoped routes
    if issue:
        # Check that officer header is authorized (even if transition status logic checks validity)
        status_check = client.patch(
            f"/api/v1/issues/{issue.id}/status",
            json={"status": issue.status},
            headers={"Authorization": f"Bearer {officer_token}"}
        )
        assert status_check.status_code != 403

def test_upload_validation_fake_image():
    """Verify that uploading a non-image (e.g. text/plain disguised as image) is rejected by Pillow."""
    import asyncio
    fake_file = UploadFile(
        filename="fake_pothole.jpg",
        file=io.BytesIO(b"<html><body>Not an image at all</body></html>")
    )
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(storage_service.process_and_save_image(fake_file))
    assert exc_info.value.status_code == 400
    assert "not a valid image format" in exc_info.value.detail

def test_upload_validation_oversize():
    """Verify that uploading file exceeding MAX_FILE_BYTES raises 413 Entity Too Large."""
    import asyncio
    oversize_bytes = b"0" * (MAX_FILE_BYTES + 1024)
    oversize_file = UploadFile(
        filename="huge_image.jpg",
        file=io.BytesIO(oversize_bytes)
    )
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(storage_service.process_and_save_image(oversize_file))
    assert exc_info.value.status_code == 413
    assert "exceeds maximum allowed size" in exc_info.value.detail

def test_wilson_interval_and_insufficient_data():
    """Verify Wilson interval arithmetic and insufficient data handling."""
    # Zero sample
    ci_zero = compute_wilson_interval(0, 0)
    assert ci_zero == [0.0, 0.0]

    # 10 out of 20 successes (50%)
    ci_half = compute_wilson_interval(10, 20)
    assert 25.0 <= ci_half[0] < 50.0
    assert 50.0 < ci_half[1] <= 75.0

    # Query /analytics/zone-metrics
    res = client.get("/api/v1/analytics/zone-metrics")
    assert res.status_code == 200
    metrics = res.json()
    assert len(metrics) > 0
    for m in metrics:
        assert "n" in m
        assert "insufficient_data" in m
        # If n < 20, must be flagged as insufficient_data
        if m["n"] < 20:
            assert m["insufficient_data"] is True
        # No composite rank or score allowed
        assert "rank" not in m or m.get("rank") is None
        assert "performance_score" not in m or m.get("performance_score") is None
        assert "zone_head_name" not in m
