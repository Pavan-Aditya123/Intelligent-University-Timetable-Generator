from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/api/departments", tags=["Departments"])

@router.get("", response_model=List[schemas.DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    depts = crud.get_departments(db)
    response = []
    for d in depts:
        sec_responses = [
            schemas.SectionResponse(
                id=s.id,
                department_id=s.department_id,
                department_name=d.name,
                name=s.name,
                student_count=s.student_count
            ) for s in d.sections
        ]
        response.append(schemas.DepartmentResponse(
            id=d.id,
            code=d.code,
            name=d.name,
            sections=sec_responses
        ))
    return response

@router.post("", response_model=schemas.DepartmentResponse)
def create_department(dept_in: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    try:
        d = crud.create_department(db, dept_in)
        sec_responses = [
            schemas.SectionResponse(
                id=s.id,
                department_id=s.department_id,
                department_name=d.name,
                name=s.name,
                student_count=s.student_count
            ) for s in d.sections
        ]
        return schemas.DepartmentResponse(
            id=d.id,
            code=d.code,
            name=d.name,
            sections=sec_responses
        )
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create department: {str(e)}")

@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    success = crud.delete_department(db, dept_id)
    if not success:
        raise HTTPException(status_code=404, detail="Department not found.")
    return {"message": "Department deleted successfully."}
