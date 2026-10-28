from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.db.session import get_db
from backend.app.db.models import Report, Issue, Category, Zone, User

router = APIRouter(prefix="/analytics", tags=["Analytics & Insights"])

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    total_reports = db.query(Report).count()
    total_issues = db.query(Issue).count()
    
    open_statuses = ["new", "acknowledged", "in_progress", "reopened"]
    open_issues = db.query(Issue).filter(Issue.status.in_(open_statuses)).count()
    resolved_verified = db.query(Issue).filter(Issue.status == "closed_verified").count()
    reopened_count = db.query(Issue).filter(Issue.reopen_count > 0).count()
    
    reopen_rate = round((reopened_count / max(1, total_issues)) * 100.0, 1)

    # Category breakdown
    cat_counts = db.query(
        Category.name,
        Category.icon,
        func.count(Issue.id)
    ).join(Issue, Issue.category_id == Category.id).group_by(Category.id).all()

    category_breakdown = [
        {"name": name, "icon": icon, "count": count}
        for name, icon, count in cat_counts
    ]

    # Zone breakdown
    zone_counts = db.query(
        Zone.name,
        func.count(Issue.id)
    ).join(Issue, Issue.zone_id == Zone.id).group_by(Zone.id).all()

    zone_breakdown = [
        {"zone": name, "count": count}
        for name, count in zone_counts
    ]

    return {
        "total_reports": total_reports,
        "total_issues": total_issues,
        "open_issues": open_issues,
        "resolved_verified": resolved_verified,
        "reopen_rate_percent": reopen_rate,
        "category_breakdown": category_breakdown,
        "zone_breakdown": zone_breakdown
    }

@router.get("/relative-performance")
def get_relative_zone_performance(db: Session = Depends(get_db)):
    zones = db.query(Zone).all()
    results = []

    for zone in zones:
        issues = db.query(Issue).filter(Issue.zone_id == zone.id).all()
        total_issues = len(issues)
        total_reports = db.query(Report).filter(Report.zone_id == zone.id).count()

        resolved_count = sum(1 for i in issues if i.status == "closed_verified")
        reopened_count = sum(1 for i in issues if i.reopen_count > 0)
        backlog_count = sum(1 for i in issues if i.status in ["new", "acknowledged", "in_progress", "reopened"])
        avg_priority = round(sum(i.priority_score for i in issues) / max(1, total_issues), 1)

        resolution_rate = round((resolved_count / max(1, total_issues)) * 100.0, 1)
        reopen_rate = round((reopened_count / max(1, total_issues)) * 100.0, 1)
        dedupe_ratio = round(total_reports / max(1, total_issues), 1)

        # Performance index: reward verified resolution, penalize citizen reopen dispute
        perf_score = round(max(10.0, min(99.0, 50.0 + (resolution_rate * 0.4) - (reopen_rate * 0.6))), 1)

        # Zone Head user
        zone_head = db.query(User).filter(User.zone_id == zone.id, User.role == "zone_head").first()

        results.append({
            "zone_id": zone.id,
            "zone_name": zone.name,
            "corporation": zone.corporation,
            "ward_number": zone.ward_number,
            "zone_head_name": zone_head.full_name if zone_head else "Unassigned",
            "zone_head_email": zone_head.email if zone_head else None,
            "total_reports": total_reports,
            "total_issues": total_issues,
            "dedupe_ratio": dedupe_ratio,
            "open_backlog": backlog_count,
            "resolved_verified": resolved_count,
            "reopened_count": reopened_count,
            "resolution_rate_pct": resolution_rate,
            "reopen_rate_pct": reopen_rate,
            "avg_priority": avg_priority,
            "performance_score": perf_score
        })

    # Sort and rank by performance score
    results.sort(key=lambda x: x["performance_score"], reverse=True)
    for idx, item in enumerate(results):
        item["rank"] = idx + 1

    return results

@router.get("/demo-personas")
def list_demo_personas(db: Session = Depends(get_db)):
    """Returns grouped list of seeded citizens, officers, and zone heads across all zones."""
    users = db.query(User).filter(User.is_active == True).all()
    personas = []
    for u in users:
        zone = db.query(Zone).filter(Zone.id == u.zone_id).first() if u.zone_id else None
        personas.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "zone_id": u.zone_id,
            "zone_name": zone.name if zone else "Citywide / Central",
            "corporation": zone.corporation if zone else "GBA Central",
            "department_id": u.department_id
        })
    return personas
