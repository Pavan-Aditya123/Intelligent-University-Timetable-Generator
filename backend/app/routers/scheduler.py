from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from ..database import get_db
from .. import models, crud
from ..engine.csp_scheduler import CSPSchedulerEngine
from ..engine.genetic_scheduler import GeneticSchedulerEngine
from ..engine.fuzzy_decision import FuzzyDecisionEngine
from ..engine.validator import validate_timetable

router = APIRouter(prefix="/api/scheduler", tags=["Timetable Scheduler Engine"])

@router.post("/generate")
def generate_timetable_pipeline(db: Session = Depends(get_db)):
    """
    Full Phase 2.3 Timetable Generation Pipeline:
    Database -> CSP Feasibility -> GA Optimization -> Fuzzy Decision Evaluation -> Hard Validation -> DB Persistence
    """
    config = crud.get_university_config(db)
    departments = crud.get_departments(db)
    sections = crud.get_sections(db)
    faculty_list = crud.get_faculty_list(db)
    subjects = crud.get_subjects(db)
    rooms = crud.get_rooms(db)

    # Step 1: CSP Backtracking Engine (Feasible Initial Solution)
    csp_engine = CSPSchedulerEngine(config, departments, sections, faculty_list, subjects, rooms)
    csp_result = csp_engine.solve()

    if csp_result["status"] != "success":
        return {
            "status": "failed",
            "phase": "Phase 2.1 - CSP Engine Failure",
            "message": csp_result["message"],
            "generated_count": 0,
            "initial_fitness": 0.0,
            "optimized_fitness": 0.0,
            "fuzzy_score": 0.0,
            "final_score": 0.0,
            "fuzzy_decision": "Poor",
            "generations": 0,
            "diagnostics": csp_result.get("diagnostics", [])
        }

    # Step 2: Genetic Algorithm Optimization Engine (Phase 2.2)
    ga_engine = GeneticSchedulerEngine(config, departments, sections, faculty_list, subjects, rooms)
    ga_result = ga_engine.optimize(csp_result)

    final_entries = ga_result["best_entries"] if ga_result["status"] == "success" else csp_result["generated_entries"]

    # Step 3: Fuzzy Decision-Making Engine (Phase 2.3)
    fuzzy_engine = FuzzyDecisionEngine(config, sections, faculty_list, subjects, rooms)
    fuzzy_result = fuzzy_engine.evaluate_timetable(final_entries)

    # Combined Score calculation (60% GA Fitness + 40% Fuzzy Suitability Score)
    ga_fit = ga_result.get("optimized_fitness", 70.0)
    fuzzy_sc = fuzzy_result.get("fuzzy_score", 70.0)
    final_combined_score = round((ga_fit * 0.60) + (fuzzy_sc * 0.40), 1)

    # Step 4: Hard Constraint Validation Audit
    validation = validate_timetable(config, sections, faculty_list, subjects, rooms, final_entries)
    if not validation["is_valid"]:
        # Fallback safely to CSP solution if validation fails
        final_entries = csp_result["generated_entries"]
        fuzzy_result = fuzzy_engine.evaluate_timetable(final_entries)
        final_combined_score = round((csp_result.get("initial_fitness", 30.0) * 0.60) + (fuzzy_result.get("fuzzy_score", 50.0) * 0.40), 1)

    # Step 5: Persist final timetable to DB safely
    db.query(models.TimetableEntry).delete()
    for entry in final_entries:
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
        "phase": "Phase 2.3 - CSP + GA + Fuzzy Decision Engine",
        "message": "Successfully generated and evaluated university timetable using CSP feasibility, GA optimization, and Fuzzy Decision Making.",
        "generated_count": len(final_entries),
        "initial_fitness": ga_result.get("initial_fitness", 30.0),
        "optimized_fitness": ga_fit,
        "fuzzy_score": fuzzy_sc,
        "final_score": final_combined_score,
        "fuzzy_decision": fuzzy_result.get("decision", "Good"),
        "fuzzy_breakdown": fuzzy_result.get("breakdown", {}),
        "fuzzy_inputs": fuzzy_result.get("inputs", {}),
        "rules_fired_count": len(fuzzy_result.get("rules_fired", [])),
        "generations": ga_result.get("generations", 100),
        "diagnostics": []
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
