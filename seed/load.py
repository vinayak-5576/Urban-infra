import os
import json
import random
from datetime import datetime, timedelta, timezone
from backend.app.core.security import hash_password
from backend.app.db.session import SessionLocal, engine, Base
from backend.app.db.models import (
    User, Zone, Department, Category, ResponsibilityRule, Issue, Report, Attachment, Feedback
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
            else:
                # Update SLA properties
                for k, v in cat.items():
                    setattr(existing, k, v)
        db.commit()

        # 3. Seed Zones from GeoJSON
        print("Seeding Pilot Zones (6 Bengaluru zones)...")
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
            else:
                existing.geom_geojson = geom
                existing.name = props["name"]
                existing.corporation = props["corporation"]
        db.commit()

        # 4. Seed Personas: Citizens, Officers, and Zone Heads for EACH zone
        print("Seeding Zone-Scoped Demo Personas...")
        password_hash_common = hash_password("citizen123")
        password_hash_officer = hash_password("officer123")
        password_hash_head = hash_password("head123")
        password_hash_admin = hash_password("admin123")

        personas = [
            # Koramangala
            {"email": "citizen.koramangala@demo.org", "password_hash": password_hash_common, "full_name": "Ramesh Kumar (Koramangala 4th Blk)", "role": "citizen", "zone_id": "zone-koramangala"},
            {"email": "officer.koramangala@gba.civic.in", "password_hash": password_hash_officer, "full_name": "Suresh Gowda (AE Road Infra)", "role": "officer", "zone_id": "zone-koramangala", "department_id": "dept-roads"},
            {"email": "head.koramangala@gba.civic.in", "password_hash": password_hash_head, "full_name": "Dr. Ananya Rao (Joint Commissioner)", "role": "zone_head", "zone_id": "zone-koramangala"},

            # Indiranagar
            {"email": "citizen.indiranagar@demo.org", "password_hash": password_hash_common, "full_name": "Priya Sharma (100ft Rd RWA)", "role": "citizen", "zone_id": "zone-indiranagar"},
            {"email": "officer.indiranagar@gba.civic.in", "password_hash": password_hash_officer, "full_name": "Manjunath B (Sanitary Inspector)", "role": "officer", "zone_id": "zone-indiranagar", "department_id": "dept-swm"},
            {"email": "head.indiranagar@gba.civic.in", "password_hash": password_hash_head, "full_name": "Vikram Hegde (Joint Commissioner)", "role": "zone_head", "zone_id": "zone-indiranagar"},

            # HSR Layout
            {"email": "citizen.hsr@demo.org", "password_hash": password_hash_common, "full_name": "Karthik Reddy (HSR Sector 2)", "role": "citizen", "zone_id": "zone-hsr"},
            {"email": "officer.hsr@gba.civic.in", "password_hash": password_hash_officer, "full_name": "Arun Patil (Stormwater Drain AE)", "role": "officer", "zone_id": "zone-hsr", "department_id": "dept-drainage"},
            {"email": "head.hsr@gba.civic.in", "password_hash": password_hash_head, "full_name": "Meera Sen (Joint Commissioner)", "role": "zone_head", "zone_id": "zone-hsr"},

            # Whitefield
            {"email": "citizen.whitefield@demo.org", "password_hash": password_hash_common, "full_name": "Deepa Nair (Whitefield Rising / ITPL)", "role": "citizen", "zone_id": "zone-whitefield"},
            {"email": "officer.whitefield@gba.civic.in", "password_hash": password_hash_officer, "full_name": "Raghavendra K (Utility & Road AE)", "role": "officer", "zone_id": "zone-whitefield", "department_id": "dept-roads"},
            {"email": "head.whitefield@gba.civic.in", "password_hash": password_hash_head, "full_name": "Rajesh Deshmukh (Joint Commissioner)", "role": "zone_head", "zone_id": "zone-whitefield"},

            # Jayanagar
            {"email": "citizen.jayanagar@demo.org", "password_hash": password_hash_common, "full_name": "Vijay Shankar (Jayanagar 4th Block)", "role": "citizen", "zone_id": "zone-jayanagar"},
            {"email": "officer.jayanagar@gba.civic.in", "password_hash": password_hash_officer, "full_name": "Chethan Prasad (Footpaths & Traffic AE)", "role": "officer", "zone_id": "zone-jayanagar", "department_id": "dept-traffic"},
            {"email": "head.jayanagar@gba.civic.in", "password_hash": password_hash_head, "full_name": "Shobha Narayanan (Joint Commissioner)", "role": "zone_head", "zone_id": "zone-jayanagar"},

            # Malleshwaram
            {"email": "citizen.malleshwaram@demo.org", "password_hash": password_hash_common, "full_name": "Anand Murthy (Margosa Rd Traders)", "role": "citizen", "zone_id": "zone-malleshwaram"},
            {"email": "officer.malleshwaram@gba.civic.in", "password_hash": password_hash_officer, "full_name": "Prakash K (Streetlighting AE)", "role": "officer", "zone_id": "zone-malleshwaram", "department_id": "dept-electrical"},
            {"email": "head.malleshwaram@gba.civic.in", "password_hash": password_hash_head, "full_name": "Girish Kulkarni (Joint Commissioner)", "role": "zone_head", "zone_id": "zone-malleshwaram"},

            # General aliases
            {"email": "citizen@demo.org", "password_hash": password_hash_common, "full_name": "Ramesh Kumar (Citizen)", "role": "citizen", "zone_id": "zone-koramangala"},
            {"email": "officer@gba.civic.in", "password_hash": password_hash_officer, "full_name": "Suresh Gowda (AE Road Infra)", "role": "officer", "zone_id": "zone-koramangala", "department_id": "dept-roads"},
            {"email": "head@gba.civic.in", "password_hash": password_hash_head, "full_name": "Dr. Ananya Rao (Zone Head)", "role": "zone_head", "zone_id": "zone-koramangala"},
            {"email": "admin@gba.civic.in", "password_hash": password_hash_admin, "full_name": "System Administrator", "role": "admin"}
        ]

        for p in personas:
            p["is_demo"] = True
            existing = db.query(User).filter(User.email == p["email"]).first()
            if not existing:
                db.add(User(**p))
            else:
                existing.full_name = p["full_name"]
                existing.zone_id = p.get("zone_id")
                existing.department_id = p.get("department_id")
                existing.role = p["role"]
                existing.is_demo = True
        db.commit()

        # 5. Seed Comprehensive Incidents Across ALL 6 Zones
        print("Clearing and Seeding Comprehensive Ground Issues across all 6 Bengaluru zones...")
        # Clean existing demo issues and reports to ensure fresh coherent performance metrics
        db.query(Feedback).delete()
        db.query(Attachment).delete()
        db.query(Report).delete()
        db.query(Issue).delete()
        db.commit()

        all_citizens = {
            "zone-koramangala": db.query(User).filter(User.email == "citizen.koramangala@demo.org").first(),
            "zone-indiranagar": db.query(User).filter(User.email == "citizen.indiranagar@demo.org").first(),
            "zone-hsr": db.query(User).filter(User.email == "citizen.hsr@demo.org").first(),
            "zone-whitefield": db.query(User).filter(User.email == "citizen.whitefield@demo.org").first(),
            "zone-jayanagar": db.query(User).filter(User.email == "citizen.jayanagar@demo.org").first(),
            "zone-malleshwaram": db.query(User).filter(User.email == "citizen.malleshwaram@demo.org").first()
        }

        # Multi-zone realistic scenarios with varying performance
        scenarios = [
            # 1. Koramangala (High priority pothole with multiple reports)
            {
                "zone_id": "zone-koramangala",
                "category_id": "cat-pothole",
                "lat": 12.9352, "lon": 77.6245,
                "dept_id": "dept-roads",
                "status": "in_progress",
                "severity": 0.85,
                "exposure": 0.8,
                "reopen_count": 0,
                "reports": [
                    "Massive crater near Sony World junction. Two-wheelers swerving dangerously into bus lane.",
                    "Same huge pothole still unrepaired outside 80ft road bakery.",
                    "Nearly fell off bike here last night! Deep asphalt damage."
                ]
            },
            # 2. Koramangala (Streetlights resolved & awaiting verification)
            {
                "zone_id": "zone-koramangala",
                "category_id": "cat-streetlight",
                "lat": 12.9320, "lon": 77.6310,
                "dept_id": "dept-electrical",
                "status": "resolved_pending_verification",
                "severity": 0.50,
                "exposure": 0.5,
                "reopen_count": 0,
                "reports": [
                    "Four streetlights in 5th Block dead. Completely pitch dark for pedestrians after 7pm.",
                    "Dark stretch near park gate, women feeling unsafe walking."
                ]
            },
            # 3. Indiranagar (Garbage dump - Disputed & Reopened!)
            {
                "zone_id": "zone-indiranagar",
                "category_id": "cat-garbage",
                "lat": 12.9715, "lon": 77.6412,
                "dept_id": "dept-swm",
                "status": "reopened",
                "severity": 0.70,
                "exposure": 0.7,
                "reopen_count": 1,
                "reports": [
                    "Open garbage dumping on pavement corner near Metro pillar 42. Bad odour.",
                    "Street dogs scattering bags across road. Civic collection missed for 3 days."
                ]
            },
            # 4. Indiranagar (Unbarricaded excavation)
            {
                "zone_id": "zone-indiranagar",
                "category_id": "cat-excavation",
                "lat": 12.9780, "lon": 77.6440,
                "dept_id": "dept-roads",
                "status": "acknowledged",
                "severity": 0.80,
                "exposure": 0.6,
                "reopen_count": 0,
                "reports": [
                    "Utility trench dug on 100ft road. No warning board or barricades placed."
                ]
            },
            # 5. Indiranagar (Footpath fixed & citizen verified!)
            {
                "zone_id": "zone-indiranagar",
                "category_id": "cat-footpath",
                "lat": 12.9740, "lon": 77.6380,
                "dept_id": "dept-traffic",
                "status": "closed_verified",
                "severity": 0.55,
                "exposure": 0.6,
                "reopen_count": 0,
                "reports": [
                    "Broken paving slabs outside CMH hospital. Elderly patients tripping.",
                    "Slabs replaced and leveled properly by BBMP road crew."
                ]
            },
            # 6. HSR Layout (Flooded drain - Top priority)
            {
                "zone_id": "zone-hsr",
                "category_id": "cat-drainage",
                "lat": 12.9125, "lon": 77.6480,
                "dept_id": "dept-drainage",
                "status": "new",
                "severity": 0.95,
                "exposure": 0.9,
                "reopen_count": 0,
                "reports": [
                    "Stormwater drain choked with silt on 27th Main. Entire road submerged under 1 foot dirty water.",
                    "Rainwater entering ground-floor apartment basement car parking.",
                    "Drain overflowing onto road during yesterday's evening cloudburst."
                ]
            },
            # 7. HSR Layout (Broken footpath slabs - in progress)
            {
                "zone_id": "zone-hsr",
                "category_id": "cat-footpath",
                "lat": 12.9180, "lon": 77.6530,
                "dept_id": "dept-traffic",
                "status": "in_progress",
                "severity": 0.50,
                "exposure": 0.5,
                "reopen_count": 0,
                "reports": [
                    "Missing storm drain slab on walkway near Sector 1 BDA complex."
                ]
            },
            # 8. Whitefield (Heavy excavation crater on ITPL road)
            {
                "zone_id": "zone-whitefield",
                "category_id": "cat-excavation",
                "lat": 12.9840, "lon": 77.7410,
                "dept_id": "dept-roads",
                "status": "acknowledged",
                "severity": 0.85,
                "exposure": 0.9,
                "reopen_count": 0,
                "reports": [
                    "Huge cable trench dug across ITPL main road causing massive 2-hour traffic jam.",
                    "Road half barricaded but unfinished for 5 days near Hope Farm circle."
                ]
            },
            # 9. Whitefield (Pothole - resolved & verified by Whitefield citizen)
            {
                "zone_id": "zone-whitefield",
                "category_id": "cat-pothole",
                "lat": 12.9750, "lon": 77.7320,
                "dept_id": "dept-roads",
                "status": "closed_verified",
                "severity": 0.75,
                "exposure": 0.8,
                "reopen_count": 0,
                "reports": [
                    "Asphalt peeled off near Varthur Kodi junction.",
                    "Re-tarred and leveled cleanly by zonal contractor."
                ]
            },
            # 10. Jayanagar (Heritage tree branch blocking street & footpath)
            {
                "zone_id": "zone-jayanagar",
                "category_id": "cat-footpath",
                "lat": 12.9280, "lon": 77.5840,
                "dept_id": "dept-traffic",
                "status": "in_progress",
                "severity": 0.60,
                "exposure": 0.7,
                "reopen_count": 0,
                "reports": [
                    "Large banyan tree branch fallen over pedestrian path near 4th Block complex.",
                    "Senior citizens forced to walk into heavy vehicular traffic."
                ]
            },
            # 11. Jayanagar (Streetlights - 100% verified closure)
            {
                "zone_id": "zone-jayanagar",
                "category_id": "cat-streetlight",
                "lat": 12.9320, "lon": 77.5910,
                "dept_id": "dept-electrical",
                "status": "closed_verified",
                "severity": 0.45,
                "exposure": 0.5,
                "reopen_count": 0,
                "reports": [
                    "Two LED street poles dead near Ashoka Pillar circle.",
                    "Bulbs replaced within 24 hours, well illuminated now."
                ]
            },
            # 12. Malleshwaram (Garbage dumping near market - In Progress)
            {
                "zone_id": "zone-malleshwaram",
                "category_id": "cat-garbage",
                "lat": 13.0040, "lon": 77.5680,
                "dept_id": "dept-swm",
                "status": "in_progress",
                "severity": 0.75,
                "exposure": 0.8,
                "reopen_count": 0,
                "reports": [
                    "Vegetable and plastic waste dumped near 8th Cross market intersection.",
                    "Flies and foul stench affecting pedestrian shoppers and shopkeepers."
                ]
            },
            # 13. Malleshwaram (Drain overflow - Closed & Verified)
            {
                "zone_id": "zone-malleshwaram",
                "category_id": "cat-drainage",
                "lat": 13.0110, "lon": 77.5720,
                "dept_id": "dept-drainage",
                "status": "closed_verified",
                "severity": 0.80,
                "exposure": 0.7,
                "reopen_count": 0,
                "reports": [
                    "Sewage drain pipe leaking onto Margosa Road pavement.",
                    "BWSSB team desilted line and replaced broken cover."
                ]
            }
        ]

        now = datetime.now(timezone.utc)

        for sc in scenarios:
            rep_count = len(sc["reports"])
            priority_info = compute_priority_score(
                severity=sc["severity"],
                exposure=sc.get("exposure", 0.5),
                corroboration_count=rep_count,
                recurrence_count=sc.get("reopen_count", 0),
                age_vs_sla=0.3
            )

            ack_time = now - timedelta(hours=random.randint(12, 36)) if sc["status"] != "new" else None
            res_time = now - timedelta(hours=random.randint(2, 10)) if "resolved" in sc["status"] or "closed" in sc["status"] else None
            closed_time = res_time if sc["status"] == "closed_verified" else None

            issue = Issue(
                category_id=sc["category_id"],
                latitude=sc["lat"],
                longitude=sc["lon"],
                zone_id=sc["zone_id"],
                department_id=sc["dept_id"],
                status=sc["status"],
                severity_score=sc["severity"],
                priority_score=priority_info["total_score"],
                priority_breakdown=priority_info,
                ack_due_at=now + timedelta(hours=12),
                resolve_due_at=now + timedelta(hours=48),
                first_reported_at=now - timedelta(hours=random.randint(24, 72)),
                acknowledged_at=ack_time,
                resolved_at=res_time,
                verified_at=closed_time,
                closed_at=closed_time,
                reopen_count=sc.get("reopen_count", 0),
                report_count=rep_count,
                is_synthetic=True
            )
            db.add(issue)
            db.commit()
            db.refresh(issue)

            # Assign to zone-specific citizen
            citizen = all_citizens.get(sc["zone_id"]) or all_citizens["zone-koramangala"]

            for text in sc["reports"]:
                rep = Report(
                    reporter_id=citizen.id,
                    issue_id=issue.id,
                    description=text,
                    category_user_id=sc["category_id"],
                    category_pred_id=sc["category_id"],
                    pred_confidence=0.91,
                    latitude=sc["lat"] + random.uniform(-0.00015, 0.00015),
                    longitude=sc["lon"] + random.uniform(-0.00015, 0.00015),
                    zone_id=sc["zone_id"],
                    status="linked",
                    is_synthetic=True,
                    created_at=now - timedelta(hours=random.randint(4, 48))
                )
                db.add(rep)

            # If closed_verified, add feedback row
            if sc["status"] == "closed_verified":
                fb = Feedback(
                    issue_id=issue.id,
                    reporter_id=citizen.id,
                    verdict="fixed",
                    rating=5,
                    comment="Verified repair on ground. Work done properly."
                )
                db.add(fb)
            elif sc["status"] == "reopened":
                fb = Feedback(
                    issue_id=issue.id,
                    reporter_id=citizen.id,
                    verdict="not_fixed",
                    rating=1,
                    comment="Disputed closure: defect was not resolved adequately."
                )
                db.add(fb)

            db.commit()

        print(f"Seeding Complete! Successfully loaded {len(scenarios)} issues across 6 pilot zones with dedicated personas.")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
