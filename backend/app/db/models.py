import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(32), default="citizen", nullable=False)  # citizen, officer, zone_head, dept_head, admin
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    zone_id = Column(String(36), ForeignKey("zones.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_demo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    reports = relationship("Report", back_populates="reporter")

class Zone(Base):
    __tablename__ = "zones"

    id = Column(String(64), primary_key=True)
    name = Column(String(255), nullable=False)
    corporation = Column(String(255), nullable=False)
    ward_number = Column(Integer, nullable=True)
    geom_geojson = Column(JSON, nullable=False)
    is_demo = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)

    reports = relationship("Report", back_populates="zone")
    issues = relationship("Issue", back_populates="zone")

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(64), primary_key=True)
    code = Column(String(64), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=True, nullable=False)

    issues = relationship("Issue", back_populates="department")

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(64), primary_key=True)
    code = Column(String(64), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    icon = Column(String(64), default="alert-circle", nullable=False)
    severity_weight = Column(Float, default=0.5, nullable=False)
    default_radius_m = Column(Float, default=30.0, nullable=False)
    default_dedupe_window_days = Column(Integer, default=30, nullable=False)
    default_department_id = Column(String(64), ForeignKey("departments.id"), nullable=True)
    sla_ack_hours = Column(Integer, default=12, nullable=False)
    sla_resolve_hours = Column(Integer, default=72, nullable=False)

    reports = relationship("Report", foreign_keys="Report.category_user_id")

class ResponsibilityRule(Base):
    __tablename__ = "responsibility_rules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category_id = Column(String(64), ForeignKey("categories.id"), nullable=False)
    zone_id = Column(String(64), ForeignKey("zones.id"), nullable=True)  # Nullable = global rule for all zones
    department_id = Column(String(64), ForeignKey("departments.id"), nullable=False)
    rank = Column(Integer, default=10, nullable=False)  # Lower number = higher priority
    is_demo = Column(Boolean, default=True, nullable=False)

class Issue(Base):
    __tablename__ = "issues"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category_id = Column(String(64), ForeignKey("categories.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    zone_id = Column(String(64), ForeignKey("zones.id"), nullable=False)
    department_id = Column(String(64), ForeignKey("departments.id"), nullable=False)
    
    # State machine: new, acknowledged, in_progress, resolved_pending_verification, closed_verified, closed_unverified, reopened, rejected
    status = Column(String(32), default="new", nullable=False)
    
    severity_score = Column(Float, default=0.5, nullable=False)
    priority_score = Column(Float, default=50.0, nullable=False)
    priority_breakdown = Column(JSON, default=dict, nullable=False)

    ack_due_at = Column(DateTime(timezone=True), nullable=True)
    resolve_due_at = Column(DateTime(timezone=True), nullable=True)

    first_reported_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    
    reopen_count = Column(Integer, default=0, nullable=False)
    report_count = Column(Integer, default=1, nullable=False)
    is_synthetic = Column(Boolean, default=False, nullable=False)

    zone = relationship("Zone", back_populates="issues")
    department = relationship("Department", back_populates="issues")
    category = relationship("Category")
    reports = relationship("Report", back_populates="issue")
    feedback = relationship("Feedback", back_populates="issue")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    issue_id = Column(String(36), ForeignKey("issues.id"), nullable=True)
    
    description = Column(Text, nullable=False)
    category_user_id = Column(String(64), ForeignKey("categories.id"), nullable=False)
    category_pred_id = Column(String(64), ForeignKey("categories.id"), nullable=True)
    pred_confidence = Column(Float, nullable=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    zone_id = Column(String(64), ForeignKey("zones.id"), nullable=False)
    
    # Status: received, linked, triaged, rejected
    status = Column(String(32), default="received", nullable=False)
    is_synthetic = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    reporter = relationship("User", back_populates="reports")
    zone = relationship("Zone", back_populates="reports")
    issue = relationship("Issue", back_populates="reports")
    category_user = relationship("Category", foreign_keys=[category_user_id], overlaps="reports")
    attachments = relationship("Attachment", back_populates="report")

class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    report_id = Column(String(36), ForeignKey("reports.id"), nullable=False)
    storage_path = Column(String(512), nullable=False)
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(64), nullable=False)
    file_size = Column(Integer, nullable=False)
    phash = Column(String(64), nullable=True)
    sha256 = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    report = relationship("Report", back_populates="attachments")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), nullable=True)
    action = Column(String(64), nullable=False)
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(String(36), nullable=False)
    payload = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

class MLPrediction(Base):
    __tablename__ = "ml_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    model_name = Column(String(64), nullable=False)
    model_version = Column(String(32), nullable=False)
    input_text = Column(Text, nullable=False)
    predicted_category = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    issue_id = Column(String(36), ForeignKey("issues.id"), nullable=False)
    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    verdict = Column(String(32), nullable=False)  # fixed, not_fixed
    rating = Column(Integer, nullable=True)  # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    issue = relationship("Issue", back_populates="feedback")
