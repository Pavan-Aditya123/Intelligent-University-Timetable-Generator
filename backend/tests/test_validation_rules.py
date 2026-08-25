import pytest
from pydantic import ValidationError
from app.schemas import SectionBase, RoomBase, SubjectBase

def test_section_capacity_validation():
    # Valid student strength <= 70
    valid_sec = SectionBase(name="CSE-A", student_count=65)
    assert valid_sec.student_count == 65

    # Invalid student strength > 70
    with pytest.raises(ValidationError) as exc:
        SectionBase(name="CSE-A", student_count=75)
    assert "Maximum allowed student strength per section is 70" in str(exc.value)

def test_room_capacity_validation():
    # Valid room capacity <= 70
    valid_room = RoomBase(room_number="C-101", name="Lecture Hall 1", capacity=70)
    assert valid_room.capacity == 70

    # Invalid room capacity > 70
    with pytest.raises(ValidationError) as exc:
        RoomBase(room_number="C-102", name="Lecture Hall 2", capacity=80)
    assert "Maximum room capacity allowed is 70" in str(exc.value)

def test_subject_weekly_classes_validation():
    # Valid weekly classes > 0
    valid_sub = SubjectBase(
        code="CS101", name="Programming", department_id=1, section_id=1, weekly_classes_required=4
    )
    assert valid_sub.weekly_classes_required == 4

    # Invalid weekly classes <= 0
    with pytest.raises(ValidationError) as exc:
        SubjectBase(
            code="CS101", name="Programming", department_id=1, section_id=1, weekly_classes_required=0
        )
    assert "Number of weekly classes required must be greater than 0" in str(exc.value)
