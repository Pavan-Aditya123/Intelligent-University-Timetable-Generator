"""
CRITICAL: NEVER point tests at backend/timetable.db.
This test suite executes exclusively on an isolated temporary in-memory database fixture.
"""

import pytest
from app import schemas, crud, models
from app.engine.period_generator import generate_academic_periods

def test_department_creation_and_duplicate_prevention(test_db):
    # 1. Create Department ECE
    dept1 = crud.create_department(
        test_db,
        schemas.DepartmentCreate(code="ECE", name="Electronics & Communication Engineering", num_sections_auto=2)
    )
    assert dept1.code == "ECE"
    assert len(dept1.sections) == 2

    # 2. Try creating duplicate ECE -> Should raise ValueError cleanly
    with pytest.raises(ValueError) as exc:
        crud.create_department(
            test_db,
            schemas.DepartmentCreate(code="ECE", name="Electronics & Communication Engineering", num_sections_auto=0)
        )
    assert "Department 'ECE' already exists" in str(exc.value)

def test_section_creation_and_capacity_limits(test_db):
    dept = crud.create_department(
        test_db,
        schemas.DepartmentCreate(code="CSE", name="Computer Science", num_sections_auto=0)
    )
    
    # Valid capacity 60 & 70
    sec1 = crud.create_section(test_db, schemas.SectionCreate(department_id=dept.id, name="CSE-A", student_count=60))
    sec2 = crud.create_section(test_db, schemas.SectionCreate(department_id=dept.id, name="CSE-B", student_count=70))
    assert sec1.student_count == 60
    assert sec2.student_count == 70

    # Invalid capacity > 70
    with pytest.raises(ValueError):
        schemas.SectionBase(name="CSE-C", student_count=71)

def test_faculty_creation_and_retrieval(test_db):
    cse = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="CSE", num_sections_auto=0))
    ece = crud.create_department(test_db, schemas.DepartmentCreate(code="ECE", name="ECE", num_sections_auto=0))

    f1 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Ravi Kumar", department_id=cse.id))
    f2 = crud.create_faculty(test_db, schemas.FacultyCreate(name="Suresh Kumar", department_id=ece.id))

    all_fac = crud.get_faculty_list(test_db)
    assert len(all_fac) == 2

    cse_fac = [f for f in all_fac if f.department_id == cse.id]
    ece_fac = [f for f in all_fac if f.department_id == ece.id]

    assert len(cse_fac) == 1
    assert cse_fac[0].name == "Ravi Kumar"
    assert len(ece_fac) == 1
    assert ece_fac[0].name == "Suresh Kumar"

def test_subject_multi_section_and_duplicate_prevention(test_db):
    dept = crud.create_department(test_db, schemas.DepartmentCreate(code="CSE", name="CSE", num_sections_auto=3))
    sec_a = next(s for s in dept.sections if s.name == "CSE-A")
    sec_b = next(s for s in dept.sections if s.name == "CSE-B")

    # Multi-section same course code CSE101
    s_a = crud.create_subject(test_db, schemas.SubjectCreate(code="CSE101", name="AI", department_id=dept.id, section_id=sec_a.id, weekly_classes_required=4))
    s_b = crud.create_subject(test_db, schemas.SubjectCreate(code="CSE101", name="AI", department_id=dept.id, section_id=sec_b.id, weekly_classes_required=4))

    assert s_a.id != s_b.id
    assert s_a.code == s_b.code == "CSE101"

    # Duplicate on same section CSE-A
    with pytest.raises(ValueError) as exc:
        crud.create_subject(test_db, schemas.SubjectCreate(code="CSE101", name="AI", department_id=dept.id, section_id=sec_a.id, weekly_classes_required=4))
    assert "already created for Section 'CSE-A'" in str(exc.value)

def test_period_generation_exact_timings():
    periods = generate_academic_periods(
        start_time_str="08:25",
        class_duration_mins=50,
        morning_break_after=2,
        morning_break_mins=15,
        lunch_break_after=4,
        lunch_break_mins=50,
        periods_count=7
    )
    # Check 7 class periods + 2 breaks
    class_periods = [p for p in periods if p["period_type"] == "Class"]
    assert len(class_periods) == 7

    assert periods[0]["start_time"] == "08:25"
    assert periods[0]["end_time"] == "09:15"

    assert periods[1]["start_time"] == "09:15"
    assert periods[1]["end_time"] == "10:05"

    # Morning Break
    assert periods[2]["period_type"] == "MorningBreak"
    assert periods[2]["start_time"] == "10:05"
    assert periods[2]["end_time"] == "10:20"

    assert periods[3]["start_time"] == "10:20"
    assert periods[3]["end_time"] == "11:10"

    assert periods[4]["start_time"] == "11:10"
    assert periods[4]["end_time"] == "12:00"

    # Lunch Break
    assert periods[5]["period_type"] == "LunchBreak"
    assert periods[5]["start_time"] == "12:00"
    assert periods[5]["end_time"] == "12:50"

    assert periods[6]["start_time"] == "12:50"
    assert periods[6]["end_time"] == "13:40"

    assert periods[7]["start_time"] == "13:40"
    assert periods[7]["end_time"] == "14:30"

    assert periods[8]["start_time"] == "14:30"
    assert periods[8]["end_time"] == "15:20"
