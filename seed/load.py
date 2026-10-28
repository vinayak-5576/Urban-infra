import os
import json
import random
from datetime import datetime, timedelta, timezone
from backend.app.core.security import hash_password
from backend.app.db.session import SessionLocal, engine, Base
from backend.app.db.models import (
    User, Zone, Department, Category, ResponsibilityRule, Issue, Report, Attachment
)
from backend.app.services.priority import compute_priority_score

SEED_DIR = os.path.dirname(os.path.abspath(__file__))

def load_json(filename: str):
    with open(os.path.join(SEED_DIR, filename), "r", encoding="utf-8") as f:
        return json.load(f)

def run_seed():
    print("Initializing Database Tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Departments
        print("Seeding Departments...")
        departments_data = load_json("departments_demo.json")
        for dept in departments_data:
            existing = db.query(Department).filter(Department.id == dept["id"]).first()
            if not existing:
                db.add(Department(**dept))
        db.commit()

        # 2. Seed Categories
        print("Seeding Categories...")
        categories_data = load_json("categories_demo.json")
        for cat in categories_data:
            existing = db.query(Category).filter(Category.id == cat["id"]).first()
            if not existing:
                db.add(Category(**cat))
        db.commit()

        # 3. Seed Zones from GeoJSON
        print("Seeding Pilot Zones...")
        zones_geojson = load_json("zones_demo.geojson")
        for feature in zones_geojson["features"]:
            props = feature["properties"]
            geom = feature["geometry"]
            existing = db.query(Zone).filter(Zone.id == props["id"]).first()
            if not existing:
                db.add(Zone(
                    id=props["id"],
                    name=props["name"],
                    corporation=props["corporation"],
                    ward_number=props["ward_number"],
                    geom_geojson=geom,
                    is_demo=props["is_demo"],
                    description=props["description"]
                ))
        db.commit()

        # 4. Seed Seed Users (Admin, Officer, Citizen)
        print("Seeding Demo Users...")
        default_users = [
            {
                "email": "citizen@demo.org",
                "password_hash": hash_password("citizen123"),
                "full_name": "Ramesh Kumar (Citizen)",
                "role": "citizen"
            },
            {
                "email": "officer@gba.civic.in",
                "password_hash": hash_password("officer123"),
                "full_name": "Suresh Gowda (AE Road Infra)",
                "role": "officer",
                "department_id": "dept-roads",
                "zone_id": "zone-koramangala"
            },
            {
                "email": "head@gba.civic.in",
                "password_hash": hash_password("head123"),
                "full_name": "Dr. Ananya Rao (Zone Head)",
                "role": "zone_head",
                "zone_id": "zone-koramangala"
            },
            {
                "email": "admin@gba.civic.in",
                "password_hash": hash_password("admin123"),
                "full_name": "System Administrator",
                "role": "admin"
            }
        ]
        for u in default_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                db.add(User(**u))
        db.commit()

        citizen_user = db.query(User).filter(User.email == "citizen@demo.org").first()

        # 5. Seed Seeded Issues & Reports
        print("Seeding Demonstrative Issues & Linked Reports across Bengaluru Pilot Zones...")
        existing_issues = db.query(Issue).count()
        if existing_issues == 0:
            sample_incidents = [
                {
                    "title": "Deep dangerous pothole near Sony World Signal",
                    "category_id": "cat-pothole",
                    "zone_id": "zone-koramangala",
                    "lat": 12.9352,
                    "lon": 77.6245,
                    "dept_id": "dept-roads",
                    "status": "in_progress",
                    "severity": 0.85,
                    "reports": [
                        "Massive crater near Sony World junction. Two-wheelers swerving dangerously into bus lane.",
                        "Same huge pothole still unrepaired outside 80ft road bakery.",
                        "Nearly fell off bike here last night! Please fill urgently."
                    ]
                },
                {
                    "title": "Overflowing garbage blackspot on 100 Feet Road",
                    "category_id": "cat-garbage",
                    "zone_id": "zone-indiranagar",
                    "lat": 12.9715,
                    "lon": 77.6412,
                    "dept_id": "dept-swm",
                    "status": "acknowledged",
                    "severity": 0.70,
                    "reports": [
                        "Open garbage dumping on pavement corner near Metro pillar 42. Bad odour.",
                        "Street dogs scattering bags across road. Civic collection missed for 3 days."
                    ]
                },
                {
                    "title": "Severe waterlogging & flooded storm drain on 27th Main",
                    "category_id": "cat-drainage",
                    "zone_id": "zone-hsr",
                    "lat": 12.9125,
                    "lon": 77.6480,
                    "dept_id": "dept-drainage",
                    "status": "new",
                    "severity": 0.90,
                    "reports": [
                        "Stormwater drain choked with silt. Entire road submerged under 1 foot of dirty water.",
                        "Water entering ground-floor parking areas. Immediate desilting needed."
                    ]
                },
                {
                    "title": "Dark stretch due to 4 non-functioning LED streetlights",
                    "category_id": "cat-streetlight",
                    "zone_id": "zone-koramangala",
                    "lat": 12.9320,
                    "lon": 77.6310,
                    "dept_id": "dept-electrical",
                    "status": "resolved_pending_verification",
                    "severity": 0.50,
                    "reports": [
                        "Four streetlights in 5th Block dead. Completely pitch dark for pedestrians."
                    ]
                },
                {
                    "title": "Unbarricaded deep excavation pit left open",
                    "category_id": "cat-excavation",
                    "zone_id": "zone-indiranagar",
                    "lat": 12.9780,
                    "lon": 77.6440,
                    "dept_id": "dept-roads",
                    "status": "new",
                    "severity": 0.80,
                    "reports": [
                        "Utility excavation dug 4 days ago. No warning sign, no barricade, dangerous at night."
                    ]
                }
            ]

            now = datetime.now(timezone.utc)
            for item in sample_incidents:
                report_count = len(item["reports"])
                priority_info = compute_priority_score(
                    severity=item["severity"],
                    exposure=0.6,
                    corroboration_count=report_count,
                    recurrence_count=0,
                    age_vs_sla=0.25
                )

                issue = Issue(
                    category_id=item["category_id"],
                    latitude=item["lat"],
                    longitude=item["lon"],
                    zone_id=item["zone_id"],
                    department_id=item["dept_id"],
                    status=item["status"],
                    severity_score=item["severity"],
                    priority_score=priority_info["total_score"],
                    priority_breakdown=priority_info,
                    ack_due_at=now + timedelta(hours=12),
                    resolve_due_at=now + timedelta(hours=48),
                    first_reported_at=now - timedelta(hours=random.randint(6, 48)),
                    report_count=report_count,
                    is_synthetic=True
                )
                db.add(issue)
                db.commit()
                db.refresh(issue)

                # Attach linked reports
                for text in item["reports"]:
                    rep = Report(
                        reporter_id=citizen_user.id,
                        issue_id=issue.id,
                        description=text,
                        category_user_id=item["category_id"],
                        category_pred_id=item["category_id"],
                        pred_confidence=0.92,
                        latitude=item["lat"] + random.uniform(-0.0001, 0.0001),
                        longitude=item["lon"] + random.uniform(-0.0001, 0.0001),
                        zone_id=item["zone_id"],
                        status="linked",
                        is_synthetic=True,
                        created_at=now - timedelta(hours=random.randint(2, 36))
                    )
                    db.add(rep)
                db.commit()

        print("Seeding Completed Successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
