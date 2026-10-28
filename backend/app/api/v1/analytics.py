from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.db.session import get_db
from backend.app.db.models import Report, Issue, Category, Zone

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
