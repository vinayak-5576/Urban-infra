import math
from typing import List, Dict, Any, Optional, Tuple
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.db.session import get_db
from backend.app.db.models import Report, Issue, Category, Zone, User

router = APIRouter(prefix="/analytics", tags=["Analytics & Insights"])

def compute_wilson_interval(k: int, n: int) -> List[float]:
    """
    Computes Wilson score 95% confidence interval for a binomial proportion k/n.
    Returns [lower_bound, upper_bound] in percent [0.0, 100.0].
    """
    if n <= 0:
        return [0.0, 0.0]
    z = 1.95996  # 95% confidence z-value
    p = k / n
    denominator = 1.0 + (z**2) / n
    center = (p + (z**2) / (2.0 * n)) / denominator
    margin = (z / denominator) * math.sqrt((p * (1.0 - p) / n) + ((z**2) / (4.0 * (n**2))))
    lower = max(0.0, center - margin) * 100.0
    upper = min(1.0, center + margin) * 100.0
    return [round(lower, 1), round(upper, 1)]

def calculate_median(values: List[float]) -> Optional[float]:
    if not values:
        return None
    s = sorted(values)
    mid = len(s) // 2
    if len(s) % 2 == 1:
        return round(s[mid], 1)
    return round((s[mid - 1] + s[mid]) / 2.0, 1)

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
        "zone_breakdown": zone_breakdown,
        "is_demo": True
    }

@router.get("/zone-metrics")
@router.get("/relative-performance")
def get_zone_metrics(db: Session = Depends(get_db)):
    """
    Returns per-zone operational metrics with sample size (n), median acknowledgement/resolution times,
    SLA compliance with Wilson 95% confidence intervals, and citizen reopen rates.
    
    Explicitly enforces Stage 12 guidelines:
    - Flags 'insufficient_data = True' when n < 20 to suppress misleading comparisons.
    - NO composite score.
    - NO ranking of zones.
    - NO individual names of officers or zone heads.
    - Comparisons should be against a zone's own historical baseline.
    """
    zones = db.query(Zone).order_by(Zone.name.asc()).all()
    results = []

    for zone in zones:
        issues = db.query(Issue).filter(Issue.zone_id == zone.id).all()
        n = len(issues)
        total_reports = db.query(Report).filter(Report.zone_id == zone.id).count()

        # Acknowledgement and Resolution durations in hours
        ack_hours: List[float] = []
        resolve_hours: List[float] = []
        sla_compliant_count = 0

        for issue in issues:
            if issue.acknowledged_at and issue.first_reported_at:
                delta = (issue.acknowledged_at - issue.first_reported_at).total_seconds() / 3600.0
                if delta >= 0:
                    ack_hours.append(delta)

            if issue.resolved_at and issue.first_reported_at:
                delta = (issue.resolved_at - issue.first_reported_at).total_seconds() / 3600.0
                if delta >= 0:
                    resolve_hours.append(delta)
                    # Check if resolved within SLA due time
                    if issue.resolve_due_at and issue.resolved_at <= issue.resolve_due_at:
                        sla_compliant_count += 1
                    elif not issue.resolve_due_at and delta <= 72.0:
                        sla_compliant_count += 1

        resolved_count = sum(1 for i in issues if i.status in ["closed_verified", "resolved_pending_verification"])
        reopened_count = sum(1 for i in issues if i.reopen_count > 0)
        backlog_count = sum(1 for i in issues if i.status in ["new", "acknowledged", "in_progress", "reopened"])

        # Wilson interval for SLA compliance among resolved issues
        sample_for_sla = resolved_count if resolved_count > 0 else n
        sla_compliance_pct = round((sla_compliant_count / max(1, sample_for_sla)) * 100.0, 1)
        sla_wilson_ci = compute_wilson_interval(sla_compliant_count, sample_for_sla)

        reopen_rate = round((reopened_count / max(1, n)) * 100.0, 1)
        reopen_wilson_ci = compute_wilson_interval(reopened_count, n)
        dedupe_ratio = round(total_reports / max(1, n), 1)

        insufficient_data = n < 20

        results.append({
            "zone_id": zone.id,
            "zone_name": zone.name,
            "corporation": zone.corporation,
            "ward_label": "Pilot Sector (Demo)",
            "n": n,
            "insufficient_data": insufficient_data,
            "minimum_sample_threshold": 20,
            "total_reports": total_reports,
            "dedupe_corroboration_ratio": dedupe_ratio,
            "open_backlog": backlog_count,
            "median_ack_hours": calculate_median(ack_hours),
            "median_resolve_hours": calculate_median(resolve_hours),
            "sla_compliance_pct": sla_compliance_pct,
            "sla_wilson_interval_95": sla_wilson_ci,
            "reopened_count": reopened_count,
            "reopen_rate_pct": reopen_rate,
            "reopen_wilson_interval_95": reopen_wilson_ci,
            "is_demo": True
        })

    return results

@router.get("/demo-personas")
def list_demo_personas(db: Session = Depends(get_db)):
    """Returns list of seeded demo personas across pilot zones for testing."""
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
            "department_id": u.department_id,
            "is_demo": True
        })
    return personas
