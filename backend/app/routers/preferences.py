from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/api/preferences", tags=["Timetable Preferences"])

@router.get("", response_model=List[schemas.PreferenceResponse])
def get_preferences(db: Session = Depends(get_db)):
    prefs = crud.get_preferences(db)
    return [
        schemas.PreferenceResponse(
            id=p.id,
            key=p.key,
            value=p.value,
            category=p.category,
            description=p.description
        ) for p in prefs
    ]

@router.post("", response_model=List[schemas.PreferenceResponse])
def update_preferences(pref_updates: List[schemas.PreferenceCreate], db: Session = Depends(get_db)):
    updated = crud.update_preferences(db, pref_updates)
    return [
        schemas.PreferenceResponse(
            id=p.id,
            key=p.key,
            value=p.value,
            category=p.category,
            description=p.description
        ) for p in updated
    ]
