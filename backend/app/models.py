from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class UniversityConfig(Base):
    __tablename__ = "university_config"

    id = Column(Integer, primary_key=True, index=True)
    university_name = Column(String, default="State University")
    academic_year = Column(String, default="2026-2027")
    semester = Column(String, default="Odd Semester")
    working_days = Column(Text, default='["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]')
    day_start_time = Column(String, default="08:25")
    class_duration_minutes = Column(Integer, default=50)
    morning_break_after_period = Column(Integer, default=2)
    morning_break_minutes = Column(Integer, default=15)
    lunch_break_after_period = Column(Integer, default=4)
    lunch_break_minutes = Column(Integer, default=50)
    periods_per_day = Column(Integer, default=7)

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)

    sections = relationship("Section", back_populates="department", cascade="all, delete-orphan")
    faculty_members = relationship("Faculty", back_populates="department", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="department", cascade="all, delete-orphan")

class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g., CSE-A
    student_count = Column(Integer, default=60)  # Constraint <= 70

    department = relationship("Department", back_populates="sections")
    subjects = relationship("Subject", back_populates="section", cascade="all, delete-orphan")
    timetable_entries = relationship("TimetableEntry", back_populates="section", cascade="all, delete-orphan")

class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    email = Column(String, nullable=True)
    max_weekly_hours = Column(Integer, default=20)
    preferred_time_slot = Column(String, default="No Preference")  # Morning / Afternoon / No Preference

    department = relationship("Department", back_populates="faculty_members")
    assignments = relationship("FacultySubjectAssignment", back_populates="faculty", cascade="all, delete-orphan")
    availabilities = relationship("FacultyAvailability", back_populates="faculty", cascade="all, delete-orphan")
    timetable_entries = relationship("TimetableEntry", back_populates="faculty", cascade="all, delete-orphan")

class FacultyAvailability(Base):
    __tablename__ = "faculty_availability"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    day_of_week = Column(String, nullable=False)
    period_number = Column(Integer, nullable=False)
    is_available = Column(Boolean, default=True)

    faculty = relationship("Faculty", back_populates="availabilities")

class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (
        UniqueConstraint('code', 'section_id', name='_subject_code_section_uc'),
    )

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, index=True, nullable=False)  # Multi-section courses share code
    name = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    course_type = Column(String, default="Theory")  # Theory / Lab / Project / Activity
    weekly_classes_required = Column(Integer, default=4)
    duration_in_periods = Column(Integer, default=1)
    requires_lab = Column(Boolean, default=False)

    department = relationship("Department", back_populates="subjects")
    section = relationship("Section", back_populates="subjects")
    faculty_assignments = relationship("FacultySubjectAssignment", back_populates="subject", cascade="all, delete-orphan")
    timetable_entries = relationship("TimetableEntry", back_populates="subject", cascade="all, delete-orphan")

class FacultySubjectAssignment(Base):
    __tablename__ = "faculty_subject_assignments"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)

    faculty = relationship("Faculty", back_populates="assignments")
    subject = relationship("Subject", back_populates="faculty_assignments")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    room_type = Column(String, default="Classroom")  # Classroom / Laboratory
    capacity = Column(Integer, default=60)  # Max <= 70
    is_lab = Column(Boolean, default=False)

    timetable_entries = relationship("TimetableEntry", back_populates="room", cascade="all, delete-orphan")

class TimetablePreference(Base):
    __tablename__ = "timetable_preferences"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, default="general")
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)  # e.g., "Low", "Medium", "High", "Morning"
    description = Column(String, nullable=True)

class GeneratedPeriod(Base):
    __tablename__ = "generated_periods"

    id = Column(Integer, primary_key=True, index=True)
    period_number = Column(Integer, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    period_type = Column(String, nullable=False)  # Class / MorningBreak / LunchBreak
    label = Column(String, nullable=False)

class TimetableEntry(Base):
    """Placeholder table for Phase 2 generated timetable entries"""
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    day_of_week = Column(String, nullable=False)
    period_number = Column(Integer, nullable=False)
    is_locked = Column(Boolean, default=False)

    section = relationship("Section", back_populates="timetable_entries")
    subject = relationship("Subject", back_populates="timetable_entries")
    faculty = relationship("Faculty", back_populates="timetable_entries")
    room = relationship("Room", back_populates="timetable_entries")
