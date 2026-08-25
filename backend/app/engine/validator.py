from typing import List, Dict, Any
from sqlalchemy.orm import Session
from .. import models
import json

def run_pre_generation_validation(db: Session) -> Dict[str, Any]:
    """
    Executes comprehensive pre-generation validation checks across all university data.
    Validates capacity constraints, weekly period limits, room availability, and faculty assignments.
    """
    config = db.query(models.UniversityConfig).first()
    working_days = json.loads(config.working_days) if config and config.working_days else ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    periods_per_day = config.periods_per_day if config else 7
    total_slots_per_week = len(working_days) * periods_per_day

    departments = db.query(models.Department).all()
    sections = db.query(models.Section).all()
    faculty_list = db.query(models.Faculty).all()
    subjects = db.query(models.Subject).all()
    rooms = db.query(models.Room).all()

    results = []
    errors_count = 0
    warnings_count = 0
    passed_count = 0

    # 1. Check University Setup Config
    if not config or not config.university_name:
        errors_count += 1
        results.append({
            "rule_name": "University Setup Configured",
            "status": "FAIL",
            "message": "University configuration is missing.",
            "details": ["Please complete University Setup before generating a timetable."]
        })
    else:
        passed_count += 1
        results.append({
            "rule_name": "University Setup Configured",
            "status": "PASS",
            "message": f"University: '{config.university_name}' ({config.academic_year}, {config.semester})",
            "details": [f"Working Days: {len(working_days)} days", f"Periods/Day: {periods_per_day}", f"Total Slots/Week: {total_slots_per_week}"]
        })

    # 2. Section Student Capacity Limit Check (Max <= 70)
    over_capacity_sections = [s for s in sections if s.student_count > 70]
    if over_capacity_sections:
        errors_count += 1
        results.append({
            "rule_name": "Section Capacity Limit (<= 70)",
            "status": "FAIL",
            "message": f"Found {len(over_capacity_sections)} sections exceeding the maximum allowed limit of 70 students.",
            "details": [f"Section '{s.name}' has {s.student_count} students." for s in over_capacity_sections]
        })
    elif len(sections) > 0:
        passed_count += 1
        results.append({
            "rule_name": "Section Capacity Limit (<= 70)",
            "status": "PASS",
            "message": f"All {len(sections)} sections adhere to the <= 70 student limit requirement.",
            "details": []
        })
    else:
        warnings_count += 1
        results.append({
            "rule_name": "Section Capacity Limit (<= 70)",
            "status": "WARNING",
            "message": "No sections created yet.",
            "details": ["Add departments and sections to proceed."]
        })

    # 3. Room Capacity Limit Check (Max <= 70)
    over_capacity_rooms = [r for r in rooms if r.capacity > 70]
    if over_capacity_rooms:
        errors_count += 1
        results.append({
            "rule_name": "Room Capacity Limit (<= 70)",
            "status": "FAIL",
            "message": f"Found {len(over_capacity_rooms)} rooms exceeding maximum capacity of 70.",
            "details": [f"Room '{r.room_number}' ({r.name}) capacity = {r.capacity}" for r in over_capacity_rooms]
        })
    elif len(rooms) > 0:
        passed_count += 1
        results.append({
            "rule_name": "Room Capacity Limit (<= 70)",
            "status": "PASS",
            "message": f"All {len(rooms)} classrooms and labs satisfy capacity constraints (<= 70).",
            "details": []
        })
    else:
        warnings_count += 1
        results.append({
            "rule_name": "Room Capacity Limit (<= 70)",
            "status": "WARNING",
            "message": "No classrooms or labs created yet.",
            "details": ["Add classrooms and laboratories."]
        })

    # 4. Weekly Required Classes Positive & Capacity per Section
    invalid_weekly_subjects = [sub for sub in subjects if sub.weekly_classes_required <= 0]
    if invalid_weekly_subjects:
        errors_count += 1
        results.append({
            "rule_name": "Subject Weekly Load (> 0)",
            "status": "FAIL",
            "message": "Found subjects with non-positive weekly required classes.",
            "details": [f"Subject '{sub.code}' requires {sub.weekly_classes_required} classes." for sub in invalid_weekly_subjects]
        })
    else:
        passed_count += 1
        results.append({
            "rule_name": "Subject Weekly Load (> 0)",
            "status": "PASS",
            "message": "All subjects have positive weekly class requirements.",
            "details": []
        })

    # 5. Section Weekly Workload vs Available Weekly Slots
    section_overloads = []
    for s in sections:
        sec_subjects = [sub for sub in subjects if sub.section_id == s.id]
        total_weekly_periods = sum(sub.weekly_classes_required * sub.duration_in_periods for sub in sec_subjects)
        if total_weekly_periods > total_slots_per_week:
            section_overloads.append(f"Section '{s.name}': Required {total_weekly_periods} periods > Available {total_slots_per_week} slots/week.")

    if section_overloads:
        errors_count += 1
        results.append({
            "rule_name": "Section Weekly Load Feasibility",
            "status": "FAIL",
            "message": "Weekly subject period requirements exceed total available weekly slots for some sections.",
            "details": section_overloads
        })
    elif len(sections) > 0:
        passed_count += 1
        results.append({
            "rule_name": "Section Weekly Load Feasibility",
            "status": "PASS",
            "message": "All sections have total weekly period requirements within available slots.",
            "details": []
        })

    # 6. Faculty Subject Assignment Coverage
    unassigned_subjects = []
    for sub in subjects:
        if not sub.faculty_assignments:
            unassigned_subjects.append(f"Subject '{sub.code} - {sub.name}' has no assigned faculty member.")

    if unassigned_subjects:
        warnings_count += 1
        results.append({
            "rule_name": "Faculty Subject Assignments",
            "status": "WARNING",
            "message": f"Found {len(unassigned_subjects)} subjects without assigned faculty.",
            "details": unassigned_subjects
        })
    elif len(subjects) > 0:
        passed_count += 1
        results.append({
            "rule_name": "Faculty Subject Assignments",
            "status": "PASS",
            "message": "All subjects have assigned faculty members.",
            "details": []
        })

    # 7. Laboratory Compatibility Check
    lab_subjects = [sub for sub in subjects if sub.requires_lab or sub.course_type == "Lab"]
    lab_rooms = [r for r in rooms if r.is_lab or r.room_type == "Laboratory"]
    if lab_subjects and not lab_rooms:
        errors_count += 1
        results.append({
            "rule_name": "Laboratory Availability for Practical Subjects",
            "status": "FAIL",
            "message": f"There are {len(lab_subjects)} practical/lab subjects, but no laboratories exist in the database.",
            "details": [f"Lab subject '{s.code}' requires a Laboratory room." for s in lab_subjects]
        })
    elif lab_subjects:
        passed_count += 1
        results.append({
            "rule_name": "Laboratory Availability for Practical Subjects",
            "status": "PASS",
            "message": f"Found {len(lab_rooms)} laboratory rooms for {len(lab_subjects)} lab/practical subjects.",
            "details": []
        })

    total_checks = len(results)
    is_valid = errors_count == 0

    return {
        "is_valid": is_valid,
        "total_checks": total_checks,
        "passed_checks": passed_count,
        "warnings_count": warnings_count,
        "errors_count": errors_count,
        "results": results
    }
