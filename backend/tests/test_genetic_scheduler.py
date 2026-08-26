"""
CRITICAL TEST SAFETY RULES:
1. NEVER point tests at backend/timetable.db.
2. All tests in this file execute exclusively on an isolated temporary in-memory database fixture.
"""

import pytest
from app import schemas, crud, models
from app.engine.csp_scheduler import CSPSchedulerEngine
from app.engine.genetic_scheduler import GeneticSchedulerEngine

def test_genetic_scheduler_optimization_and_hard_constraint_preservation(test_db):
    config = crud.get_university_config(test_db)
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="Computer Science", num_sections_auto=2))
    sec_a = next(s for s in dept.sections if s.name == "CSE-A")
    sec_b = next(s for s in dept.sections if s.name == "CSE-B")

    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Dr. Alan Turing", department_id=dept.id, max_weekly_hours=20, preferred_time_slot="Morning"))
    f2 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Dr. Grace Hopper", department_id=dept.id, max_weekly_hours=20, preferred_time_slot="Afternoon"))

    r1 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-101", name="Lecture Room 1", room_type="Classroom", capacity=65))
    r2 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-102", name="Lecture Room 2", room_type="Classroom", capacity=65))
    lab1 = crud.create_room(test_db, schemas.RoomCreate(room_number="LAB-1", name="AI Lab", room_type="Laboratory", capacity=65, is_lab=True))

    sub_a1 = crud.create_subject(test_db, schemas.SubjectCreate(
        code="CS101", name="Data Structures", department_id=dept.id, section_id=sec_a.id,
        weekly_classes_required=4, course_type="Theory", assigned_faculty_ids=[f1.id]
    ))
    sub_a2 = crud.create_subject(test_db, schemas.SubjectCreate(
        code="CS102", name="AI Lab", department_id=dept.id, section_id=sec_a.id,
        weekly_classes_required=2, duration_in_periods=2, course_type="Lab", requires_lab=True, assigned_faculty_ids=[f2.id]
    ))
    sub_b1 = crud.create_subject(test_db, schemas.SubjectCreate(
        code="CS101", name="Data Structures", department_id=dept.id, section_id=sec_b.id,
        weekly_classes_required=4, course_type="Theory", assigned_faculty_ids=[f2.id]
    ))

    # Step 1: Run CSP Engine
    csp_engine = CSPSchedulerEngine(config, [dept], [sec_a, sec_b], [f1, f2], [sub_a1, sub_a2, sub_b1], [r1, r2, lab1])
    csp_result = csp_engine.solve()
    assert csp_result["status"] == "success"

    # Step 2: Run Genetic Algorithm Engine
    ga_engine = GeneticSchedulerEngine(config, [dept], [sec_a, sec_b], [f1, f2], [sub_a1, sub_a2, sub_b1], [r1, r2, lab1], generations=20)
    ga_result = ga_engine.optimize(csp_result)

    assert ga_result["status"] == "success"
    assert ga_result["optimized_fitness"] >= ga_result["initial_fitness"]
    best_entries = ga_result["best_entries"]
    assert len(best_entries) == 10  # 4 + 2 + 4 = 10 periods total

    # 1. Section Conflict Check
    sec_slots = set()
    for e in best_entries:
        slot = (e["section_id"], e["day_of_week"], e["period_number"])
        assert slot not in sec_slots, f"GA introduced Section conflict at {slot}"
        sec_slots.add(slot)

    # 2. Faculty Conflict Check
    fac_slots = set()
    for e in best_entries:
        slot = (e["faculty_id"], e["day_of_week"], e["period_number"])
        assert slot not in fac_slots, f"GA introduced Faculty conflict at {slot}"
        fac_slots.add(slot)

    # 3. Room Conflict Check
    room_slots = set()
    for e in best_entries:
        slot = (e["room_id"], e["day_of_week"], e["period_number"])
        assert slot not in room_slots, f"GA introduced Room conflict at {slot}"
        room_slots.add(slot)

    # 4. Room Capacity Check
    for e in best_entries:
        rm = next(r for r in [r1, r2, lab1] if r.id == e["room_id"])
        sec = next(s for s in [sec_a, sec_b] if s.id == e["section_id"])
        assert rm.capacity >= sec.student_count

    # 5. Lab Room Requirement Check
    for e in best_entries:
        if e["subject_id"] == sub_a2.id:
            rm = next(r for r in [r1, r2, lab1] if r.id == e["room_id"])
            assert rm.is_lab or rm.room_type == "Laboratory"

    # 6. Break Protection Check
    for e in best_entries:
        assert 1 <= e["period_number"] <= 7

    # 7. Consecutive 2-Period Lab Check
    lab_entries = [e for e in best_entries if e["subject_id"] == sub_a2.id]
    assert len(lab_entries) == 2
    assert lab_entries[0]["day_of_week"] == lab_entries[1]["day_of_week"]
    p_nums = sorted([e["period_number"] for e in lab_entries])
    assert p_nums[1] == p_nums[0] + 1
    assert p_nums[0] in (1, 3, 5)

def test_genetic_scheduler_fallback_if_unfeasible(test_db):
    config = crud.get_university_config(test_db)
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="CSE", num_sections_auto=1))
    sec_a = dept.sections[0]
    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Prof", department_id=dept.id, max_weekly_hours=20))
    r1 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-101", name="Room", room_type="Classroom", capacity=60))

    sub = crud.create_subject(test_db, schemas.SubjectCreate(
        code="CS101", name="Course", department_id=dept.id, section_id=sec_a.id,
        weekly_classes_required=3, course_type="Theory", assigned_faculty_ids=[f1.id]
    ))

    # Pass invalid CSP result -> GA should fail gracefully
    ga_engine = GeneticSchedulerEngine(config, [dept], [sec_a], [f1], [sub], [r1])
    result = ga_engine.optimize({"status": "failed", "generated_entries": []})

    assert result["status"] == "failed"
    assert "missing" in result["message"].lower() or "cannot" in result["message"].lower()
