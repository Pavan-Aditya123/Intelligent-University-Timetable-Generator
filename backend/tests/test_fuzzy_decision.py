"""
CRITICAL TEST SAFETY RULES:
1. NEVER point tests at backend/timetable.db.
2. All tests in this file execute exclusively on an isolated temporary in-memory database fixture.
"""

import pytest
from app import schemas, crud, models
from app.engine.fuzzy_decision import FuzzyDecisionEngine, triangular_mf, trapezoidal_mf

def test_membership_functions_math():
    # Triangular MF test
    assert triangular_mf(20.0, 30, 55, 80) == 0.0
    assert triangular_mf(55.0, 30, 55, 80) == 1.0
    assert round(triangular_mf(42.5, 30, 55, 80), 2) == 0.5

    # Trapezoidal MF test
    assert trapezoidal_mf(10.0, 0, 0, 20, 45) == 1.0
    assert trapezoidal_mf(90.0, 65, 85, 100, 100) == 1.0
    assert trapezoidal_mf(110.0, 65, 85, 100, 100) == 0.0

def test_fuzzy_engine_standalone_evaluation(test_db):
    config = crud.get_university_config(test_db)
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="Computer Science", num_sections_auto=1))
    sec_a = dept.sections[0]

    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Dr. Alan Turing", department_id=dept.id, max_weekly_hours=20, preferred_time_slot="Morning"))
    r1 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-101", name="Lecture Room 1", room_type="Classroom", capacity=65))

    sub1 = crud.create_subject(test_db, schemas.SubjectCreate(
        code="CS101", name="Data Structures", department_id=dept.id, section_id=sec_a.id,
        weekly_classes_required=3, course_type="Theory", assigned_faculty_ids=[f1.id]
    ))

    # Well-spread entries (Mon, Wed, Fri morning periods)
    good_entries = [
        {"section_id": sec_a.id, "subject_id": sub1.id, "faculty_id": f1.id, "room_id": r1.id, "day_of_week": "Monday", "period_number": 1},
        {"section_id": sec_a.id, "subject_id": sub1.id, "faculty_id": f1.id, "room_id": r1.id, "day_of_week": "Wednesday", "period_number": 2},
        {"section_id": sec_a.id, "subject_id": sub1.id, "faculty_id": f1.id, "room_id": r1.id, "day_of_week": "Friday", "period_number": 3}
    ]

    fuzzy_engine = FuzzyDecisionEngine(config, [sec_a], [f1], [sub1], [r1])
    result = fuzzy_engine.evaluate_timetable(good_entries)

    assert result["fuzzy_score"] >= 60.0
    assert result["decision"] in ("Good", "Excellent")
    assert len(result["rules_fired"]) > 0
    assert "day_distribution" in result["inputs"]
    assert "membership_values" in result

def test_fuzzy_score_poor_day_distribution(test_db):
    config = crud.get_university_config(test_db)
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="CSE", num_sections_auto=1))
    sec_a = dept.sections[0]
    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Prof", department_id=dept.id, max_weekly_hours=20))
    r1 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-101", name="Room", room_type="Classroom", capacity=60))
    sub = crud.create_subject(test_db, schemas.SubjectCreate(code="CS101", name="CS", department_id=dept.id, section_id=sec_a.id, weekly_classes_required=5))

    # Concentrated entries: All 5 classes crammed onto Monday (P1, P2, P3, P4, P5)
    crammed_entries = [
        {"section_id": sec_a.id, "subject_id": sub.id, "faculty_id": f1.id, "room_id": r1.id, "day_of_week": "Monday", "period_number": p}
        for p in range(1, 6)
    ]

    # Well-spread entries: 1 class per day (Mon, Tue, Wed, Thu, Fri P1)
    spread_entries = [
        {"section_id": sec_a.id, "subject_id": sub.id, "faculty_id": f1.id, "room_id": r1.id, "day_of_week": day, "period_number": 1}
        for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    ]

    fuzzy_engine = FuzzyDecisionEngine(config, [sec_a], [f1], [sub], [r1])
    res_crammed = fuzzy_engine.evaluate_timetable(crammed_entries)
    res_spread = fuzzy_engine.evaluate_timetable(spread_entries)

    assert res_spread["fuzzy_score"] > res_crammed["fuzzy_score"]

def test_fuzzy_hard_constraint_independence(test_db):
    config = crud.get_university_config(test_db)
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="CSE", num_sections_auto=1))
    sec_a = dept.sections[0]
    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Prof", department_id=dept.id, max_weekly_hours=20))
    r1 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-101", name="Room", room_type="Classroom", capacity=60))
    sub = crud.create_subject(test_db, schemas.SubjectCreate(code="CS101", name="CS", department_id=dept.id, section_id=sec_a.id, weekly_classes_required=2))

    # Overlapping entries for same section on Monday Period 1 -> Hard conflict!
    conflicting_entries = [
        {"section_id": sec_a.id, "subject_id": sub.id, "faculty_id": f1.id, "room_id": r1.id, "day_of_week": "Monday", "period_number": 1},
        {"section_id": sec_a.id, "subject_id": sub.id, "faculty_id": f1.id, "room_id": r1.id, "day_of_week": "Monday", "period_number": 1}
    ]

    fuzzy_engine = FuzzyDecisionEngine(config, [sec_a], [f1], [sub], [r1])
    res = fuzzy_engine.evaluate_timetable(conflicting_entries)

    # Conflicting timetable receives heavy penalty and low score
    assert res["fuzzy_score"] <= 40.0
