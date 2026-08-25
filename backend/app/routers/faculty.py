from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/api/faculty", tags=["Faculty"])

@router.get("", response_model=List[schemas.FacultyResponse])
def get_faculty_list(db: Session = Depends(get_db)):
    faculty = crud.get_faculty_list(db)
    result = []
    for f in faculty:
        assigned_sub_ids = [a.subject_id for a in f.assignments]
        availabilities = [
            schemas.FacultyAvailabilityBase(
                day_of_week=av.day_of_week,
                period_number=av.period_number,
                is_available=av.is_available
            ) for av in f.availabilities
        ]
        result.append(schemas.FacultyResponse(
            id=f.id,
            name=f.name,
            department_id=f.department_id,
            department_name=f.department.name if f.department else None,
            email=f.email,
            max_weekly_hours=f.max_weekly_hours,
            preferred_time_slot=f.preferred_time_slot,
            assigned_subject_ids=assigned_sub_ids,
            availabilities=availabilities
        ))
    return result

@router.post("", response_model=schemas.FacultyResponse)
def create_faculty(fac_in: schemas.FacultyCreate, db: Session = Depends(get_db)):
    dept = crud.get_department(db, fac_in.department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Selected department does not exist.")
    try:
        f = crud.create_faculty(db, fac_in)
        assigned_sub_ids = [a.subject_id for a in f.assignments]
        return schemas.FacultyResponse(
            id=f.id,
            name=f.name,
            department_id=f.department_id,
            department_name=dept.name,
            email=f.email,
            max_weekly_hours=f.max_weekly_hours,
            preferred_time_slot=f.preferred_time_slot,
            assigned_subject_ids=assigned_sub_ids,
            availabilities=[]
        )
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create faculty: {str(e)}")

@router.put("/{faculty_id}", response_model=schemas.FacultyResponse)
def update_faculty(faculty_id: int, fac_in: schemas.FacultyCreate, db: Session = Depends(get_db)):
    try:
        f = crud.update_faculty(db, faculty_id, fac_in)
        if not f:
            raise HTTPException(status_code=404, detail="Faculty member not found.")
        assigned_sub_ids = [a.subject_id for a in f.assignments]
        return schemas.FacultyResponse(
            id=f.id,
            name=f.name,
            department_id=f.department_id,
            department_name=f.department.name if f.department else None,
            email=f.email,
            max_weekly_hours=f.max_weekly_hours,
            preferred_time_slot=f.preferred_time_slot,
            assigned_subject_ids=assigned_sub_ids,
            availabilities=[]
        )
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update faculty: {str(e)}")

@router.delete("/{faculty_id}")
def delete_faculty(faculty_id: int, db: Session = Depends(get_db)):
    success = crud.delete_faculty(db, faculty_id)
    if not success:
        raise HTTPException(status_code=404, detail="Faculty member not found.")
    return {"message": "Faculty deleted successfully."}
