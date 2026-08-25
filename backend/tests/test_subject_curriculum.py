import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app import models, schemas, crud

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_multi_section_same_course_code(test_db):
    # 1. Create Department CSE
    dept = crud.create_department(
        test_db,
        schemas.DepartmentCreate(code="CSE", name="Computer Science & Engineering", num_sections_auto=3)
    )
    assert len(dept.sections) == 3
    sec_a = next(s for s in dept.sections if s.name == "CSE-A")
    sec_b = next(s for s in dept.sections if s.name == "CSE-B")
    sec_c = next(s for s in dept.sections if s.name == "CSE-C")

    # 2. Create CSE101 -> Artificial Intelligence -> CSE-A
    sub_a = crud.create_subject(
        test_db,
        schemas.SubjectCreate(
            code="CSE101",
            name="Artificial Intelligence",
            department_id=dept.id,
            section_id=sec_a.id,
            weekly_classes_required=4,
            course_type="Theory"
        )
    )
    assert sub_a.id is not None
    assert sub_a.code == "CSE101"
    assert sub_a.section_id == sec_a.id

    # 3. Create CSE101 -> Artificial Intelligence -> CSE-B
    sub_b = crud.create_subject(
        test_db,
        schemas.SubjectCreate(
            code="CSE101",
            name="Artificial Intelligence",
            department_id=dept.id,
            section_id=sec_b.id,
            weekly_classes_required=4,
            course_type="Theory"
        )
    )
    assert sub_b.id is not None
    assert sub_b.code == "CSE101"
    assert sub_b.section_id == sec_b.id

    # 4. Create CSE101 -> Artificial Intelligence -> CSE-C
    sub_c = crud.create_subject(
        test_db,
        schemas.SubjectCreate(
            code="CSE101",
            name="Artificial Intelligence",
            department_id=dept.id,
            section_id=sec_c.id,
            weekly_classes_required=4,
            course_type="Theory"
        )
    )
    assert sub_c.id is not None
    assert sub_c.code == "CSE101"
    assert sub_c.section_id == sec_c.id

    # 5. Verify 3 separate section-specific course requirements exist in DB
    all_subjects = crud.get_subjects(test_db)
    cse101_subjects = [s for s in all_subjects if s.code == "CSE101"]
    assert len(cse101_subjects) == 3
    sec_ids = {s.section_id for s in cse101_subjects}
    assert sec_ids == {sec_a.id, sec_b.id, sec_c.id}

    # 6. Verify duplicate entry for the SAME course (CSE101) + SAME section (CSE-A) is rejected
    with pytest.raises(ValueError) as exc:
        crud.create_subject(
            test_db,
            schemas.SubjectCreate(
                code="CSE101",
                name="Artificial Intelligence Duplicate",
                department_id=dept.id,
                section_id=sec_a.id,
                weekly_classes_required=4
            )
        )
    assert "already created for Section 'CSE-A'" in str(exc.value)
