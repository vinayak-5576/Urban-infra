from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Auth schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    full_name: str
    role: str
    department_id: Optional[str] = None
    zone_id: Optional[str] = None
    created_at: datetime

# Zone & Category schemas
class ZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    corporation: str
    ward_number: Optional[int] = None
    is_demo: bool
    description: Optional[str] = None
    geom_geojson: Dict[str, Any]

class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    code: str
    name: str
    icon: str
    severity_weight: float
    default_radius_m: float
    default_dedupe_window_days: int
    sla_ack_hours: int
    sla_resolve_hours: int

# AI Suggestion schemas
class SuggestCategoryRequest(BaseModel):
    description: str = Field(..., min_length=5, max_length=2000)

class SuggestCategoryResponse(BaseModel):
    suggested_category_id: Optional[str] = None
    confidence: float
    model_version: str

# Report & Issue schemas
class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    storage_path: str
    filename: str
    mime_type: str
    file_size: int
    created_at: datetime

class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    reporter_id: str
    issue_id: Optional[str] = None
    description: str
    category_user_id: str
    category_pred_id: Optional[str] = None
    pred_confidence: Optional[float] = None
    latitude: float
    longitude: float
    zone_id: str
    status: str
    is_synthetic: bool
    created_at: datetime
    attachments: List[AttachmentOut] = []

class IssueOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    category_id: str
    latitude: float
    longitude: float
    zone_id: str
    department_id: str
    status: str
    severity_score: float
    priority_score: float
    priority_breakdown: Dict[str, Any]
    ack_due_at: Optional[datetime] = None
    resolve_due_at: Optional[datetime] = None
    first_reported_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    reopen_count: int
    report_count: int
    is_synthetic: bool
    reports: List[ReportOut] = []

class IssueStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(acknowledged|in_progress|resolved_pending_verification|closed_verified|closed_unverified|reopened|rejected)$")
    reason: Optional[str] = None

class FeedbackCreate(BaseModel):
    verdict: str = Field(..., pattern="^(fixed|not_fixed)$")
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None
