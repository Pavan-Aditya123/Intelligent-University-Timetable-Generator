from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Metrics"])

@router.get("/stats", response_model=schemas.SystemSetupProgress)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_metrics(db)
