import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.geo import find_zone_for_point, haversine_distance_meters
from backend.app.services.priority import compute_priority_score
from backend.app.ml.text_classifier import classifier
from backend.app.db.session import SessionLocal
from backend.app.db.models import Zone

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

def test_haversine_distance():
    # Distance between Koramangala Sony World (12.9352, 77.6245) and nearby point (~100m away)
    dist = haversine_distance_meters(12.9352, 77.6245, 12.9360, 77.6245)
    assert 50 < dist < 150

def test_priority_score_calculation():
    # High severity, 5 corroborating reports, recent SLA
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

def test_text_classifier_suggestion():
    # Clear pothole phrasing
    cat, conf = classifier.predict("There is a massive dangerous crater on the road breaking car wheels")
    assert cat == "cat-pothole"
    assert conf >= 0.50

    # Clear garbage phrasing
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
    # Register (or handle if already exists)
    reg_res = client.post("/api/v1/auth/register", json=register_payload)
    if reg_res.status_code == 400:
        # Already exists, proceed to login
        pass
    else:
        assert reg_res.status_code == 201

    login_res = client.post("/api/v1/auth/login", json={"email": test_email, "password": "securepassword123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token

    # Test authenticated /me
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email
