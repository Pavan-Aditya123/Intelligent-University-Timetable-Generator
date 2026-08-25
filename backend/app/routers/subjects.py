from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import schemas, crud

router = APIRouter(prefix="/api/subjects", tags=["Subjects / Courses"])

@router.get("", response_model=List[schemas.SubjectResponse])
def get_subjects(db: Session = Depends(get_db)):
    subjects = crud.get_subjects(db)
    result = []
    for sub in subjects:
        assigned_names = [a.faculty.name for a in sub.faculty_assignments if a.faculty]
        assigned_ids = [a.faculty_id for a in sub.faculty_assignments]
        result.append(schemas.SubjectResponse(
            id=sub.id,
            code=sub.code,
            name=sub.name,
            department_id=sub.department_id,
            department_name=sub.department.name if sub.department else None,
            section_id=sub.section_id,
            section_name=sub.section.name if sub.section else None,
            course_type=sub.course_type,
            weekly_classes_required=sub.weekly_classes_required,
            duration_in_periods=sub.duration_in_periods,
            requires_lab=sub.requires_lab,
            assigned_faculty_names=assigned_names,
            assigned_faculty_ids=assigned_ids
        ))
    return result

@router.post("", response_model=schemas.SubjectResponse)
def create_subject(sub_in: schemas.SubjectCreate, db: Session = Depends(get_db)):
    try:
        sub = crud.create_subject(db, sub_in)
        assigned_names = [a.faculty.name for a in sub.faculty_assignments if a.faculty]
        assigned_ids = [a.faculty_id for a in sub.faculty_assignments]
        return schemas.SubjectResponse(
            id=sub.id,
            code=sub.code,
            name=sub.name,
            department_id=sub.department_id,
            department_name=sub.department.name if sub.department else None,
            section_id=sub.section_id,
            section_name=sub.section.name if sub.section else None,
            course_type=sub.course_type,
            weekly_classes_required=sub.weekly_classes_required,
            duration_in_periods=sub.duration_in_periods,
            requires_lab=sub.requires_lab,
            assigned_faculty_names=assigned_names,
            assigned_faculty_ids=assigned_ids
        )
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to create subject: {str(e)}")

@router.put("/{subject_id}", response_model=schemas.SubjectResponse)
def update_subject(subject_id: int, sub_in: schemas.SubjectCreate, db: Session = Depends(get_db)):
    try:
        sub = crud.update_subject(db, subject_id, sub_in)
        if not sub:
            raise HTTPException(status_code=404, detail="Subject not found.")
        assigned_names = [a.faculty.name for a in sub.faculty_assignments if a.faculty]
        assigned_ids = [a.faculty_id for a in sub.faculty_assignments]
        return schemas.SubjectResponse(
            id=sub.id,
            code=sub.code,
            name=sub.name,
            department_id=sub.department_id,
            department_name=sub.department.name if sub.department else None,
            section_id=sub.section_id,
            section_name=sub.section.name if sub.section else None,
            course_type=sub.course_type,
            weekly_classes_required=sub.weekly_classes_required,
            duration_in_periods=sub.duration_in_periods,
            requires_lab=sub.requires_lab,
            assigned_faculty_names=assigned_names,
            assigned_faculty_ids=assigned_ids
        )
    except ValueError as ve:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to update subject: {str(e)}")

@router.delete("/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    success = crud.delete_subject(db, subject_id)
    if not success:
        raise HTTPException(status_code=404, detail="Subject not found.")
    return {"message": "Subject deleted successfully."}
