from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import Zone, Category, Department
from backend.app.services.geo import find_zone_for_point
from backend.app.schemas.common import ZoneOut, CategoryOut

router = APIRouter(tags=["Zones & Metadata"])

class PointLookupRequest(BaseModel):
    latitude: float
    longitude: float

@router.get("/zones", response_model=List[ZoneOut])
def list_zones(db: Session = Depends(get_db)):
    return db.query(Zone).all()

@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.get("/departments")
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.post("/lookup-zone", response_model=Optional[ZoneOut])
def lookup_zone(payload: PointLookupRequest, db: Session = Depends(get_db)):
    zones = db.query(Zone).all()
    matched_zone = find_zone_for_point(payload.latitude, payload.longitude, zones)
    if not matched_zone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specified coordinates fall outside the supported Bengaluru Pilot Zones (Koramangala, Indiranagar, HSR Layout). Please select a location within the pilot area."
        )
    return matched_zone
