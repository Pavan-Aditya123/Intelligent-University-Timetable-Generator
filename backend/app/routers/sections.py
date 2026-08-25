from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/api/sections", tags=["Sections"])

@router.get("", response_model=List[schemas.SectionResponse])
def get_sections(db: Session = Depends(get_db)):
    secs = crud.get_sections(db)
    return [
        schemas.SectionResponse(
            id=s.id,
            department_id=s.department_id,
            department_name=s.department.name if s.department else None,
            name=s.name,
            student_count=s.student_count
        ) for s in secs
    ]

@router.post("", response_model=schemas.SectionResponse)
def create_section(sec_in: schemas.SectionCreate, db: Session = Depends(get_db)):
    dept = crud.get_department(db, sec_in.department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Selected department does not exist.")
    try:
        sec = crud.create_section(db, sec_in)
        return schemas.SectionResponse(
            id=sec.id,
            department_id=sec.department_id,
            department_name=dept.name,
            name=sec.name,
            student_count=sec.student_count
        )
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create section: {str(e)}")

@router.put("/{section_id}", response_model=schemas.SectionResponse)
def update_section(section_id: int, sec_in: schemas.SectionBase, db: Session = Depends(get_db)):
    try:
        sec = crud.update_section(db, section_id, sec_in)
        if not sec:
            raise HTTPException(status_code=404, detail="Section not found.")
        return schemas.SectionResponse(
            id=sec.id,
            department_id=sec.department_id,
            department_name=sec.department.name if sec.department else None,
            name=sec.name,
            student_count=sec.student_count
        )
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update section: {str(e)}")

@router.delete("/{section_id}")
def delete_section(section_id: int, db: Session = Depends(get_db)):
    success = crud.delete_section(db, section_id)
    if not success:
        raise HTTPException(status_code=404, detail="Section not found.")
    return {"message": "Section deleted successfully."}
