from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from . import models, schemas
from .engine.period_generator import generate_academic_periods
import json

# --- University Config ---
def get_university_config(db: Session) -> models.UniversityConfig:
    config = db.query(models.UniversityConfig).first()
    if not config:
        config = models.UniversityConfig(day_start_time="08:25")
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

def update_university_config(db: Session, config_in: schemas.UniversityConfigCreate) -> models.UniversityConfig:
    config = get_university_config(db)
    config.university_name = config_in.university_name
    config.academic_year = config_in.academic_year
    config.semester = config_in.semester
    config.working_days = json.dumps(config_in.working_days)
    config.day_start_time = config_in.day_start_time
    config.class_duration_minutes = config_in.class_duration_minutes
    config.morning_break_after_period = config_in.morning_break_after_period
    config.morning_break_minutes = config_in.morning_break_minutes
    config.lunch_break_after_period = config_in.lunch_break_after_period
    config.lunch_break_minutes = config_in.lunch_break_minutes
    config.periods_per_day = config_in.periods_per_day
    db.commit()
    db.refresh(config)
    return config

def get_generated_periods(db: Session) -> List[Dict[str, Any]]:
    config = get_university_config(db)
    return generate_academic_periods(
        start_time_str=config.day_start_time,
        class_duration_mins=config.class_duration_minutes,
        morning_break_after=config.morning_break_after_period,
        morning_break_mins=config.morning_break_minutes,
        lunch_break_after=config.lunch_break_after_period,
        lunch_break_mins=config.lunch_break_minutes,
        periods_count=config.periods_per_day
    )

# --- Departments & Auto-Sections ---
def get_departments(db: Session) -> List[models.Department]:
    return db.query(models.Department).all()

def get_department(db: Session, dept_id: int) -> Optional[models.Department]:
    return db.query(models.Department).filter(models.Department.id == dept_id).first()

def create_department(db: Session, dept_in: schemas.DepartmentCreate) -> models.Department:
    code_upper = dept_in.code.strip().upper()
    existing = db.query(models.Department).filter(models.Department.code == code_upper).first()
    if existing:
        raise ValueError(f"Department '{code_upper}' already exists.")

    dept = models.Department(code=code_upper, name=dept_in.name.strip())
    db.add(dept)
    db.commit()
    db.refresh(dept)

    # Auto-suggest / generate sections if num_sections_auto > 0 (e.g. CSE -> CSE-A, CSE-B, CSE-C)
    if dept_in.num_sections_auto and dept_in.num_sections_auto > 0:
        letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
        for i in range(min(dept_in.num_sections_auto, 10)):
            sec_name = f"{dept.code}-{letters[i]}"
            sec = models.Section(department_id=dept.id, name=sec_name, student_count=60)
            db.add(sec)
        db.commit()
        db.refresh(dept)

    return dept

def delete_department(db: Session, dept_id: int) -> bool:
    dept = get_department(db, dept_id)
    if not dept:
        return False
    db.delete(dept)
    db.commit()
    return True

# --- Sections ---
def get_sections(db: Session) -> List[models.Section]:
    return db.query(models.Section).all()

def create_section(db: Session, sec_in: schemas.SectionCreate) -> models.Section:
    sec_name = sec_in.name.strip()
    existing = db.query(models.Section).filter(
        models.Section.name == sec_name,
        models.Section.department_id == sec_in.department_id
    ).first()
    if existing:
        raise ValueError(f"Section '{sec_name}' already exists in this department.")

    sec = models.Section(
        department_id=sec_in.department_id,
        name=sec_name,
        student_count=sec_in.student_count
    )
    db.add(sec)
    db.commit()
    db.refresh(sec)
    return sec

def update_section(db: Session, section_id: int, sec_in: schemas.SectionBase) -> Optional[models.Section]:
    sec = db.query(models.Section).filter(models.Section.id == section_id).first()
    if not sec:
        return None
    sec.name = sec_in.name.strip()
    sec.student_count = sec_in.student_count
    db.commit()
    db.refresh(sec)
    return sec

def delete_section(db: Session, section_id: int) -> bool:
    sec = db.query(models.Section).filter(models.Section.id == section_id).first()
    if not sec:
        return False
    db.delete(sec)
    db.commit()
    return True

# --- Faculty ---
def get_faculty_list(db: Session) -> List[models.Faculty]:
    return db.query(models.Faculty).all()

def create_faculty(db: Session, fac_in: schemas.FacultyCreate) -> models.Faculty:
    fac_name = fac_in.name.strip()
    existing = db.query(models.Faculty).filter(
        models.Faculty.name == fac_name,
        models.Faculty.department_id == fac_in.department_id
    ).first()
    if existing:
        raise ValueError(f"Faculty member '{fac_name}' already exists in this department.")

    fac = models.Faculty(
        name=fac_name,
        department_id=fac_in.department_id,
        email=fac_in.email.strip() if fac_in.email else None,
        max_weekly_hours=fac_in.max_weekly_hours,
        preferred_time_slot=fac_in.preferred_time_slot
    )
    db.add(fac)
    db.commit()
    db.refresh(fac)

    # Subject assignments
    if fac_in.assigned_subject_ids:
        for sub_id in fac_in.assigned_subject_ids:
            assignment = models.FacultySubjectAssignment(faculty_id=fac.id, subject_id=sub_id)
            db.add(assignment)
        db.commit()
        db.refresh(fac)

    return fac

def update_faculty(db: Session, fac_id: int, fac_in: schemas.FacultyCreate) -> Optional[models.Faculty]:
    fac = db.query(models.Faculty).filter(models.Faculty.id == fac_id).first()
    if not fac:
        return None
    fac.name = fac_in.name.strip()
    fac.department_id = fac_in.department_id
    fac.email = fac_in.email.strip() if fac_in.email else None
    fac.max_weekly_hours = fac_in.max_weekly_hours
    fac.preferred_time_slot = fac_in.preferred_time_slot

    # Clear old assignments and rebuild
    db.query(models.FacultySubjectAssignment).filter(models.FacultySubjectAssignment.faculty_id == fac_id).delete()
    if fac_in.assigned_subject_ids:
        for sub_id in fac_in.assigned_subject_ids:
            assignment = models.FacultySubjectAssignment(faculty_id=fac.id, subject_id=sub_id)
            db.add(assignment)

    db.commit()
    db.refresh(fac)
    return fac

def delete_faculty(db: Session, fac_id: int) -> bool:
    fac = db.query(models.Faculty).filter(models.Faculty.id == fac_id).first()
    if not fac:
        return False
    db.delete(fac)
    db.commit()
    return True

# --- Subjects ---
def get_subjects(db: Session) -> List[models.Subject]:
    return db.query(models.Subject).all()

def create_subject(db: Session, sub_in: schemas.SubjectCreate) -> models.Subject:
    code_upper = sub_in.code.strip().upper()
    existing = db.query(models.Subject).filter(
        models.Subject.code == code_upper,
        models.Subject.section_id == sub_in.section_id
    ).first()
    if existing:
        sec = db.query(models.Section).filter(models.Section.id == sub_in.section_id).first()
        sec_name = sec.name if sec else f"ID {sub_in.section_id}"
        raise ValueError(f"Subject '{code_upper}' is already created for Section '{sec_name}'.")

    sub = models.Subject(
        code=code_upper,
        name=sub_in.name.strip(),
        department_id=sub_in.department_id,
        section_id=sub_in.section_id,
        course_type=sub_in.course_type,
        weekly_classes_required=sub_in.weekly_classes_required,
        duration_in_periods=sub_in.duration_in_periods,
        requires_lab=sub_in.requires_lab or (sub_in.course_type == "Lab")
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    if sub_in.assigned_faculty_ids:
        for fac_id in sub_in.assigned_faculty_ids:
            assignment = models.FacultySubjectAssignment(faculty_id=fac_id, subject_id=sub.id)
            db.add(assignment)
        db.commit()
        db.refresh(sub)

    return sub

def update_subject(db: Session, sub_id: int, sub_in: schemas.SubjectCreate) -> Optional[models.Subject]:
    sub = db.query(models.Subject).filter(models.Subject.id == sub_id).first()
    if not sub:
        return None

    code_upper = sub_in.code.strip().upper()
    existing = db.query(models.Subject).filter(
        models.Subject.code == code_upper,
        models.Subject.section_id == sub_in.section_id,
        models.Subject.id != sub_id
    ).first()
    if existing:
        sec = db.query(models.Section).filter(models.Section.id == sub_in.section_id).first()
        sec_name = sec.name if sec else f"ID {sub_in.section_id}"
        raise ValueError(f"Subject '{code_upper}' is already created for Section '{sec_name}'.")

    sub.code = code_upper
    sub.name = sub_in.name.strip()
    sub.department_id = sub_in.department_id
    sub.section_id = sub_in.section_id
    sub.course_type = sub_in.course_type
    sub.weekly_classes_required = sub_in.weekly_classes_required
    sub.duration_in_periods = sub_in.duration_in_periods
    sub.requires_lab = sub_in.requires_lab or (sub_in.course_type == "Lab")

    # Clear old assignments and rebuild
    db.query(models.FacultySubjectAssignment).filter(models.FacultySubjectAssignment.subject_id == sub_id).delete()
    if sub_in.assigned_faculty_ids:
        for fac_id in sub_in.assigned_faculty_ids:
            assignment = models.FacultySubjectAssignment(faculty_id=fac_id, subject_id=sub.id)
            db.add(assignment)

    db.commit()
    db.refresh(sub)
    return sub

def delete_subject(db: Session, sub_id: int) -> bool:
    sub = db.query(models.Subject).filter(models.Subject.id == sub_id).first()
    if not sub:
        return False
    db.delete(sub)
    db.commit()
    return True

# --- Rooms ---
def get_rooms(db: Session) -> List[models.Room]:
    return db.query(models.Room).all()

def create_room(db: Session, room_in: schemas.RoomCreate) -> models.Room:
    room_num = room_in.room_number.strip().upper()
    existing = db.query(models.Room).filter(models.Room.room_number == room_num).first()
    if existing:
        raise ValueError(f"Room '{room_num}' already exists.")

    rm = models.Room(
        room_number=room_num,
        name=room_in.name.strip(),
        room_type=room_in.room_type,
        capacity=room_in.capacity,
        is_lab=room_in.is_lab or (room_in.room_type == "Laboratory")
    )
    db.add(rm)
    db.commit()
    db.refresh(rm)
    return rm

def update_room(db: Session, room_id: int, room_in: schemas.RoomBase) -> Optional[models.Room]:
    rm = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not rm:
        return None
    room_num = room_in.room_number.strip().upper()
    existing = db.query(models.Room).filter(
        models.Room.room_number == room_num,
        models.Room.id != room_id
    ).first()
    if existing:
        raise ValueError(f"Room '{room_num}' already exists.")

    rm.room_number = room_num
    rm.name = room_in.name.strip()
    rm.room_type = room_in.room_type
    rm.capacity = room_in.capacity
    rm.is_lab = room_in.is_lab or (room_in.room_type == "Laboratory")
    db.commit()
    db.refresh(rm)
    return rm

def delete_room(db: Session, room_id: int) -> bool:
    rm = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not rm:
        return False
    db.delete(rm)
    db.commit()
    return True

# --- Preferences ---
def get_preferences(db: Session) -> List[models.TimetablePreference]:
    prefs = db.query(models.TimetablePreference).all()
    if not prefs:
        defaults = [
            {"key": "faculty_preferred_time", "value": "No Preference", "category": "faculty", "description": "Global preference for faculty teaching time slots."},
            {"key": "avoid_consecutive_classes", "value": "Medium", "category": "scheduling", "description": "Avoid assigning 3+ consecutive classes for a single section or faculty."},
            {"key": "workload_balancing", "value": "High", "category": "faculty", "description": "Evenly distribute subject periods across the working week."},
            {"key": "avoid_unnecessary_gaps", "value": "High", "category": "section", "description": "Minimize idle gap periods between classes for students."}
        ]
        for d in defaults:
            p = models.TimetablePreference(**d)
            db.add(p)
        db.commit()
        prefs = db.query(models.TimetablePreference).all()
    return prefs

def update_preferences(db: Session, pref_updates: List[schemas.PreferenceCreate]) -> List[models.TimetablePreference]:
    for p_in in pref_updates:
        p = db.query(models.TimetablePreference).filter(models.TimetablePreference.key == p_in.key).first()
        if p:
            p.value = p_in.value
            if p_in.description:
                p.description = p_in.description
        else:
            p = models.TimetablePreference(key=p_in.key, value=p_in.value, category=p_in.category, description=p_in.description)
            db.add(p)
    db.commit()
    return get_preferences(db)

# --- Dashboard & Progress Metrics ---
def get_dashboard_metrics(db: Session) -> schemas.SystemSetupProgress:
    config = get_university_config(db)
    depts_count = db.query(models.Department).count()
    sections_count = db.query(models.Section).count()
    faculty_count = db.query(models.Faculty).count()
    subjects_count = db.query(models.Subject).count()
    classrooms_count = db.query(models.Room).filter(models.Room.room_type == "Classroom").count()
    labs_count = db.query(models.Room).filter(models.Room.room_type == "Laboratory").count()

    missing = []
    if not config or not config.university_name:
        missing.append("University setup configuration is incomplete.")
    if depts_count == 0:
        missing.append("No departments created.")
    if sections_count == 0:
        missing.append("No student sections defined.")
    if faculty_count == 0:
        missing.append("No faculty members added.")
    if subjects_count == 0:
        missing.append("No subjects/courses defined.")
    if (classrooms_count + labs_count) == 0:
        missing.append("No classrooms or laboratories configured.")

    completed_steps = 0
    total_steps = 6
    if config and config.university_name: completed_steps += 1
    if depts_count > 0: completed_steps += 1
    if sections_count > 0: completed_steps += 1
    if faculty_count > 0: completed_steps += 1
    if subjects_count > 0: completed_steps += 1
    if (classrooms_count + labs_count) > 0: completed_steps += 1

    percentage = round((completed_steps / total_steps) * 100.0, 1)

    return schemas.SystemSetupProgress(
        university_config_done=bool(config and config.university_name),
        departments_count=depts_count,
        sections_count=sections_count,
        faculty_count=faculty_count,
        subjects_count=subjects_count,
        classrooms_count=classrooms_count,
        laboratories_count=labs_count,
        overall_progress_percentage=percentage,
        is_ready_for_generation=len(missing) == 0,
        missing_requirements=missing
    )
