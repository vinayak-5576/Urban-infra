from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from backend.app.core.deps import get_current_user
from backend.app.db.session import get_db
from backend.app.db.models import User, Zone, Category, Report, Attachment, AuditLog, MLPrediction
from backend.app.services.geo import find_zone_for_point
from backend.app.services.storage import storage_service
from backend.app.services.linking import link_or_create_issue
from backend.app.ml.text_classifier import classifier
from backend.app.schemas.common import (
    ReportOut, SuggestCategoryRequest, SuggestCategoryResponse
)

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/suggest-category", response_model=SuggestCategoryResponse)
def suggest_category(
    payload: SuggestCategoryRequest,
    db: Session = Depends(get_db)
):
    predicted_cat, conf = classifier.predict(payload.description)
    
    # Store audit prediction
    if predicted_cat:
        pred_record = MLPrediction(
            model_name="CivicTextClassifier",
            model_version=classifier.model_version,
            input_text=payload.description[:500],
            predicted_category=predicted_cat,
            confidence=conf
        )
        db.add(pred_record)
        db.commit()

    return {
        "suggested_category_id": predicted_cat,
        "confidence": conf,
        "model_version": classifier.model_version
    }

@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def submit_report(
    description: str = Form(..., min_length=10, max_length=2000),
    category_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate Category exists
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category_id}' is invalid."
        )

    # 2. Point-in-polygon Zone check
    zones = db.query(Zone).all()
    matched_zone = find_zone_for_point(latitude, longitude, zones)
    if not matched_zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected coordinates are outside the Bengaluru pilot boundary. Submissions are only supported within Koramangala, Indiranagar, and HSR Layout pilot zones."
        )

    # 3. Secure Image Processing (validation, strip EXIF, compute pHash & sha256)
    storage_path, mime_type, file_size, sha256_hex, phash_hex = await storage_service.process_and_save_image(image)

    # 4. Run ML text classification in background for advisory comparison
    pred_cat, pred_conf = classifier.predict(description)

    # 5. Core Differentiator: Link to existing Issue or Create new Issue
    issue, is_new = link_or_create_issue(
        db=db,
        category=category,
        zone_id=matched_zone.id,
        latitude=latitude,
        longitude=longitude,
        is_synthetic=False
    )

    # 6. Create Report record
    from shapely.geometry import Point
    from geoalchemy2.shape import from_shape

    new_report = Report(
        reporter_id=current_user.id,
        issue_id=issue.id,
        description=description,
        category_user_id=category.id,
        category_pred_id=pred_cat,
        pred_confidence=pred_conf,
        location=from_shape(Point(longitude, latitude), srid=4326),
        latitude=latitude,
        longitude=longitude,
        zone_id=matched_zone.id,
        status="linked",
        is_synthetic=False
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    # 7. Create Attachment record
    attachment = Attachment(
        report_id=new_report.id,
        storage_path=storage_path,
        filename=image.filename or "photo.jpg",
        mime_type=mime_type,
        file_size=file_size,
        phash=phash_hex,
        sha256=sha256_hex
    )
    db.add(attachment)

    # 8. Audit log entry
    audit = AuditLog(
        actor_id=current_user.id,
        action="report_submitted",
        entity_type="report",
        entity_id=new_report.id,
        payload={
            "issue_id": issue.id,
            "is_new_issue": is_new,
            "zone_id": matched_zone.id,
            "category_user": category.id,
            "category_pred": pred_cat
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(new_report)

    return new_report

@router.get("/mine", response_model=List[ReportOut])
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Report).filter(Report.reporter_id == current_user.id).order_by(Report.created_at.desc()).all()

@router.get("", response_model=List[ReportOut])
def list_reports(
    zone_id: Optional[str] = None,
    category_id: Optional[str] = None,
    issue_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Report)
    if zone_id:
        query = query.filter(Report.zone_id == zone_id)
    if category_id:
        query = query.filter(Report.category_user_id == category_id)
    if issue_id:
        query = query.filter(Report.issue_id == issue_id)
    return query.order_by(Report.created_at.desc()).all()
