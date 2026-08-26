"""
CRITICAL TEST SAFETY RULES:
1. NEVER point tests at backend/timetable.db.
2. All tests in this file execute exclusively on an isolated temporary in-memory database fixture.
"""

import pytest
from app import schemas, crud, models
from app.engine.evaluation_engine import EvaluationEngine, run_full_evaluation
from fastapi.testclient import TestClient
from app.main import app

def test_evaluation_engine_experiments_a_b_c(test_db):
    config = crud.get_university_config(test_db)
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="Computer Science", num_sections_auto=1))
    sec_a = dept.sections[0]

    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Dr. Alan Turing", department_id=dept.id, max_weekly_hours=20, preferred_time_slot="Morning"))
    r1 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-101", name="Lecture Room 1", room_type="Classroom", capacity=65))

    sub1 = crud.create_subject(test_db, schemas.SubjectCreate(
        code="CS101", name="Data Structures", department_id=dept.id, section_id=sec_a.id,
        weekly_classes_required=3, course_type="Theory", assigned_faculty_ids=[f1.id]
    ))

    eval_engine = EvaluationEngine(config, [sec_a], [f1], [sub1], [r1])

    exp_a = eval_engine.evaluate_csp()
    assert exp_a["generation_status"] == "success"
    assert exp_a["hard_violations"] == 0
    assert exp_a["csp_fitness"] >= 0.0
    assert exp_a["runtime_seconds"] >= 0.0

    exp_b = eval_engine.evaluate_csp_ga(seed=42)
    assert exp_b["generation_status"] == "success"
    assert exp_b["hard_violations"] == 0
    assert exp_b["ga_fitness"] >= exp_a["csp_fitness"]
    assert exp_b["ga_improvement_percent"] >= 0.0

    exp_c = eval_engine.evaluate_csp_ga_fuzzy(seed=42)
    assert exp_c["generation_status"] == "success"
    assert exp_c["hard_violations"] == 0
    assert exp_c["final_score"] >= 0.0
    assert exp_c["fuzzy_decision"] in ("Poor", "Acceptable", "Good", "Excellent")

def test_stochastic_ga_5_runs(test_db):
    config = crud.get_university_config(test_db)
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="CSE", num_sections_auto=1))
    sec_a = dept.sections[0]
    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Prof", department_id=dept.id, max_weekly_hours=20))
    r1 = crud.create_room(test_db, schemas.RoomCreate(room_number="C-101", name="Room", room_type="Classroom", capacity=60))
    sub = crud.create_subject(test_db, schemas.SubjectCreate(code="CS101", name="CS", department_id=dept.id, section_id=sec_a.id, weekly_classes_required=2))

    eval_engine = EvaluationEngine(config, [sec_a], [f1], [sub], [r1])
    seeds = [42, 101, 202, 303, 404]
    stoch = eval_engine.run_stochastic_ga_runs(seeds=seeds)

    assert stoch["total_runs"] == 5
    assert stoch["seeds_used"] == seeds
    assert stoch["best_ga_fitness"] >= stoch["worst_ga_fitness"]
    assert stoch["mean_ga_fitness"] >= 0.0
    assert stoch["std_deviation"] >= 0.0
    assert len(stoch["individual_runs"]) == 5

def test_evaluation_api_endpoints(test_db):
    client = TestClient(app)

    res_run = client.post("/api/evaluation/run")
    assert res_run.status_code == 200
    data = res_run.json()
    assert data["status"] == "success"
    assert "experiments" in data
    assert "comparison_table" in data
    assert "research_conclusions" in data

    res_results = client.get("/api/evaluation/results")
    assert res_results.status_code == 200

    res_comp = client.get("/api/evaluation/comparison")
    assert res_comp.status_code == 200
    comp_data = res_comp.json()
    assert "comparison_table" in comp_data
    assert "research_conclusions" in comp_data
