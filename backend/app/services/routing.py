from typing import Optional
from sqlalchemy.orm import Session
from backend.app.db.models import ResponsibilityRule, Category

def determine_department_for_issue(db: Session, category_id: str, zone_id: str) -> str:
    """
    Evaluates responsibility mapping:
    1. Zone-specific rule with lowest rank
    2. Global rule (zone_id is None) with lowest rank
    3. Category default department
    4. Fallback triage department ('dept-roads')
    """
    # 1. Zone specific rule
    zone_rule = db.query(ResponsibilityRule).filter(
        ResponsibilityRule.category_id == category_id,
        ResponsibilityRule.zone_id == zone_id
    ).order_by(ResponsibilityRule.rank.asc()).first()

    if zone_rule:
        return zone_rule.department_id

    # 2. Global rule
    global_rule = db.query(ResponsibilityRule).filter(
        ResponsibilityRule.category_id == category_id,
        ResponsibilityRule.zone_id.is_(None)
    ).order_by(ResponsibilityRule.rank.asc()).first()

    if global_rule:
        return global_rule.department_id

    # 3. Category default
    category = db.query(Category).filter(Category.id == category_id).first()
    if category and category.default_department_id:
        return category.default_department_id

    return "dept-roads"
