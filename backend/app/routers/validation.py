from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas
from ..engine.validator import run_pre_generation_validation

router = APIRouter(prefix="/api/validation", tags=["Validation / Conflicts"])

@router.get("", response_model=schemas.PreGenerationValidationReport)
def get_validation_report(db: Session = Depends(get_db)):
    report_data = run_pre_generation_validation(db)
    return report_data
