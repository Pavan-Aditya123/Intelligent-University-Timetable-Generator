from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from .. import schemas, crud
import json

router = APIRouter(prefix="/api/university", tags=["University Setup"])

@router.get("/config", response_model=schemas.UniversityConfigResponse)
def get_config(db: Session = Depends(get_db)):
    config = crud.get_university_config(db)
    return schemas.UniversityConfigResponse(
        id=config.id,
        university_name=config.university_name,
        academic_year=config.academic_year,
        semester=config.semester,
        working_days=json.loads(config.working_days) if config.working_days else ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        day_start_time=config.day_start_time,
        class_duration_minutes=config.class_duration_minutes,
        morning_break_after_period=config.morning_break_after_period,
        morning_break_minutes=config.morning_break_minutes,
        lunch_break_after_period=config.lunch_break_after_period,
        lunch_break_minutes=config.lunch_break_minutes,
        periods_per_day=config.periods_per_day
    )

@router.post("/config", response_model=schemas.UniversityConfigResponse)
def update_config(config_in: schemas.UniversityConfigCreate, db: Session = Depends(get_db)):
    config = crud.update_university_config(db, config_in)
    return schemas.UniversityConfigResponse(
        id=config.id,
        university_name=config.university_name,
        academic_year=config.academic_year,
        semester=config.semester,
        working_days=json.loads(config.working_days),
        day_start_time=config.day_start_time,
        class_duration_minutes=config.class_duration_minutes,
        morning_break_after_period=config.morning_break_after_period,
        morning_break_minutes=config.morning_break_minutes,
        lunch_break_after_period=config.lunch_break_after_period,
        lunch_break_minutes=config.lunch_break_minutes,
        periods_per_day=config.periods_per_day
    )

@router.get("/periods", response_model=List[schemas.PeriodSchema])
def get_periods(db: Session = Depends(get_db)):
    return crud.get_generated_periods(db)
