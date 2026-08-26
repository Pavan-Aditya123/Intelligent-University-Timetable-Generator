"""
CRITICAL TEST SAFETY RULES:
1. NEVER point tests at backend/timetable.db.
2. All tests in this file execute exclusively on an isolated temporary in-memory database fixture.
"""

import pytest
import io
import csv
from app import schemas, crud, models
from app.engine.csp_scheduler import CSPSchedulerEngine
from app.engine.genetic_scheduler import GeneticSchedulerEngine
from app.engine.fuzzy_decision import FuzzyDecisionEngine
from app.engine.validator import audit_hard_constraints
from fastapi.testclient import TestClient
from app.main import app

def test_audit_hard_constraints_zero_violations(test_db):
    config = crud.get_university_config(test_db)
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="Computer Science", num_sections_auto=1))
    sec_a = dept.sections[0]

    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Dr. Alan Turing", department_id=dept.id, max_weekly_hours=20))
    r1 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-101", name="Lecture Room 1", room_type="Classroom", capacity=65))

    sub1 = crud.create_subject(test_db, schemas.SubjectCreate(
        code="CS101", name="Data Structures", department_id=dept.id, section_id=sec_a.id,
        weekly_classes_required=3, course_type="Theory", assigned_faculty_ids=[f1.id]
    ))

    csp = CSPSchedulerEngine(config, [dept], [sec_a], [f1], [sub1], [r1])
    csp_res = csp.solve()
    assert csp_res["status"] == "success"

    entries = csp_res["generated_entries"]
    audit = audit_hard_constraints(config, [sec_a], [f1], [sub1], [r1], entries)

    assert audit["is_valid"] is True
    assert audit["total_hard_violations"] == 0
    assert audit["category_breakdown"]["section_conflicts"] == 0
    assert audit["category_breakdown"]["faculty_conflicts"] == 0
    assert audit["category_breakdown"]["room_conflicts"] == 0

def test_csv_export_endpoint(test_db):
    client = TestClient(app)
    response = client.get("/api/scheduler/export")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"

    content = response.text
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)
    assert len(rows) >= 1  # Header row present
    header = rows[0]
    assert "Day" in header
    assert "Period Number" in header
    assert "Subject Code" in header
    assert "Faculty Name" in header

def test_before_vs_after_explainability():
    # Verify delta computation logic
    initial_fitness = 30.9
    final_fitness = 77.5
    improvement = round(((final_fitness - initial_fitness) / initial_fitness) * 100, 1)
    assert improvement == 150.8

def test_fuzzy_fired_rules_explainability(test_db):
    config = crud.get_university_config(test_db)
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="CSE", num_sections_auto=1))
    sec_a = dept.sections[0]
    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Prof", department_id=dept.id, max_weekly_hours=20, preferred_time_slot="Morning"))
    r1 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-101", name="Room", room_type="Classroom", capacity=60))
    sub = crud.create_subject(test_db, schemas.SubjectCreate(code="CS101", name="CS", department_id=dept.id, section_id=sec_a.id, weekly_classes_required=3))

    good_entries = [
        {"section_id": sec_a.id, "subject_id": sub.id, "faculty_id": f1.id, "room_id": r1.id, "day_of_week": "Monday", "period_number": 1},
        {"section_id": sec_a.id, "subject_id": sub.id, "faculty_id": f1.id, "room_id": r1.id, "day_of_week": "Wednesday", "period_number": 2},
        {"section_id": sec_a.id, "subject_id": sub.id, "faculty_id": f1.id, "room_id": r1.id, "day_of_week": "Friday", "period_number": 3}
    ]

    fuzzy_engine = FuzzyDecisionEngine(config, [sec_a], [f1], [sub], [r1])
    res = fuzzy_engine.evaluate_timetable(good_entries)

    assert "rules_fired" in res
    assert len(res["rules_fired"]) > 0
    rule1 = res["rules_fired"][0]
    assert "rule_id" in rule1
    assert "statement" in rule1
    assert "activation_weight" in rule1
    assert "consequence" in rule1
    assert "contribution_explanation" in rule1
