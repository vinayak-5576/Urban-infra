from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from backend.app.db.models import Issue, Category, Report
from backend.app.services.geo import haversine_distance_meters
from backend.app.services.priority import compute_priority_score
from backend.app.services.routing import determine_department_for_issue

def link_or_create_issue(
    db: Session,
    category: Category,
    zone_id: str,
    latitude: float,
    longitude: float,
    is_synthetic: bool = False
) -> Tuple[Issue, bool]:
    """
    Checks for open issues within spatial deduplication radius.
    Returns: (issue, is_newly_created)
    """
    radius_m = category.default_radius_m
    window_days = category.default_dedupe_window_days
    cutoff_time = datetime.now(timezone.utc) - timedelta(days=window_days)

    open_statuses = ["new", "acknowledged", "in_progress", "reopened"]
    candidate_issues = db.query(Issue).filter(
        Issue.category_id == category.id,
        Issue.zone_id == zone_id,
        Issue.status.in_(open_statuses),
        Issue.first_reported_at >= cutoff_time
    ).all()

    # Find closest issue within threshold
    closest_issue = None
    min_dist = float("inf")

    for candidate in candidate_issues:
        dist = haversine_distance_meters(latitude, longitude, candidate.latitude, candidate.longitude)
        if dist <= radius_m and dist < min_dist:
            min_dist = dist
            closest_issue = candidate

    if closest_issue:
        # Link to existing issue! Update corroboration and priority
        closest_issue.report_count += 1
        
        # Calculate updated priority
        breakdown = compute_priority_score(
            severity=closest_issue.severity_score,
            exposure=0.5,
            corroboration_count=closest_issue.report_count,
            recurrence_count=closest_issue.reopen_count,
            age_vs_sla=0.1
        )
        closest_issue.priority_score = breakdown["total_score"]
        closest_issue.priority_breakdown = breakdown
        db.commit()
        db.refresh(closest_issue)
        return closest_issue, False

    # Otherwise, create a new Issue
    dept_id = determine_department_for_issue(db, category.id, zone_id)
    now = datetime.now(timezone.utc)
    ack_due = now + timedelta(hours=category.sla_ack_hours)
    resolve_due = now + timedelta(hours=category.sla_resolve_hours)

    initial_breakdown = compute_priority_score(
        severity=category.severity_weight,
        exposure=0.5,
        corroboration_count=1,
        recurrence_count=0,
        age_vs_sla=0.0
    )

    new_issue = Issue(
        category_id=category.id,
        latitude=latitude,
        longitude=longitude,
        zone_id=zone_id,
        department_id=dept_id,
        status="new",
        severity_score=category.severity_weight,
        priority_score=initial_breakdown["total_score"],
        priority_breakdown=initial_breakdown,
        ack_due_at=ack_due,
        resolve_due_at=resolve_due,
        first_reported_at=now,
        report_count=1,
        is_synthetic=is_synthetic
    )
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return new_issue, True
