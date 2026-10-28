from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.deps import get_current_user, require_roles
from backend.app.db.session import get_db
from backend.app.db.models import User, Issue, Feedback, AuditLog
from backend.app.schemas.common import IssueOut, IssueStatusUpdate, FeedbackCreate

router = APIRouter(prefix="/issues", tags=["Issues & Lifecycle"])

@router.get("", response_model=List[IssueOut])
def list_issues(
    zone_id: Optional[str] = None,
    category_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Issue)
    if zone_id:
        query = query.filter(Issue.zone_id == zone_id)
    if category_id:
        query = query.filter(Issue.category_id == category_id)
    if status:
        query = query.filter(Issue.status == status)
    return query.order_by(Issue.priority_score.desc()).all()

@router.get("/{issue_id}", response_model=IssueOut)
def get_issue(issue_id: str, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")
    return issue

@router.patch("/{issue_id}/status", response_model=IssueOut)
def update_issue_status(
    issue_id: str,
    payload: IssueStatusUpdate,
    current_user: User = Depends(require_roles(["officer", "zone_head", "dept_head", "admin"])),
    db: Session = Depends(get_db)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    old_status = issue.status
    new_status = payload.status
    now = datetime.now(timezone.utc)

    # State transition validation
    allowed_transitions = {
        "new": ["acknowledged", "rejected"],
        "acknowledged": ["in_progress", "rejected"],
        "in_progress": ["resolved_pending_verification"],
        "resolved_pending_verification": ["closed_verified", "reopened", "closed_unverified"],
        "closed_unverified": ["reopened"],
        "reopened": ["acknowledged", "in_progress"],
        "rejected": []
    }

    if new_status not in allowed_transitions.get(old_status, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Illegal state transition from '{old_status}' to '{new_status}'."
        )

    issue.status = new_status
    if new_status == "acknowledged" and not issue.acknowledged_at:
        issue.acknowledged_at = now
    elif new_status == "resolved_pending_verification":
        issue.resolved_at = now
    elif new_status in ("closed_verified", "closed_unverified"):
        issue.closed_at = now
    elif new_status == "reopened":
        issue.reopen_count += 1

    audit = AuditLog(
        actor_id=current_user.id,
        action="issue_status_updated",
        entity_type="issue",
        entity_id=issue.id,
        payload={"from_status": old_status, "to_status": new_status, "reason": payload.reason}
    )
    db.add(audit)
    db.commit()
    db.refresh(issue)
    return issue

@router.post("/{issue_id}/feedback")
def submit_citizen_feedback(
    issue_id: str,
    payload: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found.")

    feedback = Feedback(
        issue_id=issue.id,
        reporter_id=current_user.id,
        verdict=payload.verdict,
        rating=payload.rating,
        comment=payload.comment
    )
    db.add(feedback)

    now = datetime.now(timezone.utc)
    if payload.verdict == "fixed":
        issue.status = "closed_verified"
        issue.verified_at = now
        issue.closed_at = now
    elif payload.verdict == "not_fixed":
        issue.status = "reopened"
        issue.reopen_count += 1

    audit = AuditLog(
        actor_id=current_user.id,
        action="citizen_feedback_submitted",
        entity_type="issue",
        entity_id=issue.id,
        payload={"verdict": payload.verdict, "new_status": issue.status}
    )
    db.add(audit)
    db.commit()
    return {"message": f"Feedback received. Issue updated to '{issue.status}'."}
