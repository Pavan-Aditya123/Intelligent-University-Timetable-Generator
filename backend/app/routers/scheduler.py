from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from ..database import get_db
from .. import models, crud
from ..engine.csp_scheduler import CSPSchedulerEngine
from ..engine.period_generator import generate_academic_periods

router = APIRouter(prefix="/api/scheduler", tags=["Timetable Scheduler (Phase 2.1 CSP)"])

@router.post("/generate")
def generate_timetable_csp(db: Session = Depends(get_db)):
    """
    Executes Phase 2.1 CSP & Backtracking solver on active university data.
    Saves assigned period slots to DB upon success, or returns conflict diagnostics on failure.
    """
    config = crud.get_university_config(db)
    departments = crud.get_departments(db)
    sections = crud.get_sections(db)
    faculty_list = crud.get_faculty_list(db)
    subjects = crud.get_subjects(db)
    rooms = crud.get_rooms(db)

    engine = CSPSchedulerEngine(config, departments, sections, faculty_list, subjects, rooms)
    result = engine.solve()

    if result["status"] == "success":
        # Clear existing generated entries in DB
        db.query(models.TimetableEntry).delete()

        # Save new entries
        for entry in result["generated_entries"]:
            db_entry = models.TimetableEntry(
                section_id=entry["section_id"],
                subject_id=entry["subject_id"],
                faculty_id=entry["faculty_id"],
                room_id=entry["room_id"],
                day_of_week=entry["day_of_week"],
                period_number=entry["period_number"],
                is_locked=entry.get("is_locked", False)
            )
            db.add(db_entry)
        db.commit()

        return {
            "status": "success",
            "message": result["message"],
            "generated_count": len(result["generated_entries"]),
            "diagnostics": []
        }
    else:
        return {
            "status": "failed",
            "message": result["message"],
            "generated_count": 0,
            "diagnostics": result.get("diagnostics", [])
        }

@router.get("/timetable")
def get_timetable_entries(
    section_id: Optional[int] = None,
    faculty_id: Optional[int] = None,
    room_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Returns populated timetable entries with relational details and period timings.
    """
    query = db.query(models.TimetableEntry)
    if section_id:
        query = query.filter(models.TimetableEntry.section_id == section_id)
    if faculty_id:
        query = query.filter(models.TimetableEntry.faculty_id == faculty_id)
    if room_id:
        query = query.filter(models.TimetableEntry.room_id == room_id)

    entries = query.all()
    periods = crud.get_generated_periods(db)
    period_map = {p["period_number"]: p for p in periods if p["period_number"] > 0}

    result = []
    for e in entries:
        p_info = period_map.get(e.period_number, {})
        result.append({
            "id": e.id,
            "section_id": e.section_id,
            "section_name": e.section.name if e.section else None,
            "subject_id": e.subject_id,
            "subject_code": e.subject.code if e.subject else None,
            "subject_name": e.subject.name if e.subject else None,
            "course_type": e.subject.course_type if e.subject else "Theory",
            "faculty_id": e.faculty_id,
            "faculty_name": e.faculty.name if e.faculty else None,
            "room_id": e.room_id,
            "room_number": e.room.room_number if e.room else None,
            "room_name": e.room.name if e.room else None,
            "day_of_week": e.day_of_week,
            "period_number": e.period_number,
            "start_time": p_info.get("start_time", ""),
            "end_time": p_info.get("end_time", ""),
            "is_locked": e.is_locked
        })

    return result

@router.delete("/timetable")
def clear_timetable(db: Session = Depends(get_db)):
    """Clears all generated timetable entries."""
    db.query(models.TimetableEntry).delete()
    db.commit()
    return {"message": "All generated timetable entries cleared."}
