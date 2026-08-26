"""
CRITICAL TEST SAFETY RULES:
1. NEVER point tests at backend/timetable.db.
2. All tests in this file execute exclusively on an isolated temporary in-memory database fixture.
"""

import pytest
from app import schemas, crud, models
from app.engine.csp_scheduler import CSPSchedulerEngine

def test_csp_successful_timetable_generation(test_db):
    # Setup University Config
    config = crud.get_university_config(test_db)

    # Setup Department & Sections
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="Computer Science", num_sections_auto=2))
    sec_a = next(s for s in dept.sections if s.name == "CSE-A")
    sec_b = next(s for s in dept.sections if s.name == "CSE-B")

    # Setup Faculty
    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Dr. Alan Turing", department_id=dept.id, max_weekly_hours=20))
    f2 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Dr. Grace Hopper", department_id=dept.id, max_weekly_hours=20))

    # Setup Classrooms & Labs
    r1 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-101", name="Lecture Room 1", room_type="Classroom", capacity=65))
    r2 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-102", name="Lecture Room 2", room_type="Classroom", capacity=65))
    lab1 = crud.create_room(test_db, schemas.RoomCreate(room_number="LAB-1", name="AI Lab", room_type="Laboratory", capacity=65, is_lab=True))

    # Setup Subjects
    sub_a1 = crud.create_subject(test_db, schemas.SubjectCreate(
        code="CS101", name="Data Structures", department_id=dept.id, section_id=sec_a.id,
        weekly_classes_required=3, course_type="Theory", assigned_faculty_ids=[f1.id]
    ))
    sub_a2 = crud.create_subject(test_db, schemas.SubjectCreate(
        code="CS102", name="AI Lab", department_id=dept.id, section_id=sec_a.id,
        weekly_classes_required=2, duration_in_periods=2, course_type="Lab", requires_lab=True, assigned_faculty_ids=[f2.id]
    ))
    sub_b1 = crud.create_subject(test_db, schemas.SubjectCreate(
        code="CS101", name="Data Structures", department_id=dept.id, section_id=sec_b.id,
        weekly_classes_required=3, course_type="Theory", assigned_faculty_ids=[f2.id]
    ))

    # Execute CSP Solver
    engine = CSPSchedulerEngine(config, [dept], [sec_a, sec_b], [f1, f2], [sub_a1, sub_a2, sub_b1], [r1, r2, lab1])
    result = engine.solve()

    assert result["status"] == "success"
    entries = result["generated_entries"]
    assert len(entries) == 8  # 3 + 2 + 3 = 8 periods total

    # 1. Section Conflict Check: No two classes for the same section in the same (day, period)
    sec_slots = set()
    for e in entries:
        slot = (e["section_id"], e["day_of_week"], e["period_number"])
        assert slot not in sec_slots, f"Section conflict detected at slot {slot}"
        sec_slots.add(slot)

    # 2. Faculty Conflict Check: No two classes for the same faculty in the same (day, period)
    fac_slots = set()
    for e in entries:
        slot = (e["faculty_id"], e["day_of_week"], e["period_number"])
        assert slot not in fac_slots, f"Faculty conflict detected at slot {slot}"
        fac_slots.add(slot)

    # 3. Room Conflict Check: No two classes in the same room in the same (day, period)
    room_slots = set()
    for e in entries:
        slot = (e["room_id"], e["day_of_week"], e["period_number"])
        assert slot not in room_slots, f"Room conflict detected at slot {slot}"
        room_slots.add(slot)

    # 4. Room Capacity Check
    for e in entries:
        room = next(r for r in [r1, r2, lab1] if r.id == e["room_id"])
        sec = next(s for s in [sec_a, sec_b] if s.id == e["section_id"])
        assert room.capacity >= sec.student_count

    # 5. Laboratory Room Requirement Check
    for e in entries:
        if e["subject_id"] == sub_a2.id:
            room = next(r for r in [r1, r2, lab1] if r.id == e["room_id"])
            assert room.is_lab or room.room_type == "Laboratory"

    # 6. Break Periods Protection Check (period_number > 0 and <= 7)
    for e in entries:
        assert 1 <= e["period_number"] <= 7

    # 7. Consecutive Lab Periods Check for sub_a2
    lab_entries = [e for e in entries if e["subject_id"] == sub_a2.id]
    assert len(lab_entries) == 2
    lab_day = lab_entries[0]["day_of_week"]
    lab_periods = sorted([e["period_number"] for e in lab_entries])
    assert lab_entries[1]["day_of_week"] == lab_day
    assert lab_periods[1] == lab_periods[0] + 1

def test_csp_impossible_schedule_handling(test_db):
    config = crud.get_university_config(test_db)
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="CSE", num_sections_auto=1))
    sec_a = dept.sections[0]

    # Faculty with 1 hour workload allowed, but course requires 5 classes -> Impossible!
    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Overloaded Prof", department_id=dept.id, max_weekly_hours=1))
    r1 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-101", name="Room 1", room_type="Classroom", capacity=60))

    sub = crud.create_subject(test_db, schemas.SubjectCreate(
        code="CS101", name="Impossible Course", department_id=dept.id, section_id=sec_a.id,
        weekly_classes_required=5, course_type="Theory", assigned_faculty_ids=[f1.id]
    ))

    engine = CSPSchedulerEngine(config, [dept], [sec_a], [f1], [sub], [r1])
    result = engine.solve()

    # Must handle failure gracefully without crashing
    assert result["status"] == "failed"
    assert "Unable to find" in result["message"] or "feasibility" in result["message"]
    assert len(result["diagnostics"]) > 0
