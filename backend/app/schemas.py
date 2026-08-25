from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional

# --- University Config ---
class UniversityConfigBase(BaseModel):
    university_name: str = Field(..., min_length=1)
    academic_year: str = Field(..., min_length=1)
    semester: str = Field(..., min_length=1)
    working_days: List[str] = Field(default=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
    day_start_time: str = Field(default="09:00")
    class_duration_minutes: int = Field(default=50, ge=30, le=120)
    morning_break_after_period: int = Field(default=2, ge=1, le=5)
    morning_break_minutes: int = Field(default=15, ge=5, le=60)
    lunch_break_after_period: int = Field(default=4, ge=2, le=6)
    lunch_break_minutes: int = Field(default=50, ge=20, le=90)
    periods_per_day: int = Field(default=7, ge=4, le=12)

class UniversityConfigCreate(UniversityConfigBase):
    pass

class UniversityConfigResponse(UniversityConfigBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Period Schemas ---
class PeriodSchema(BaseModel):
    period_number: int
    start_time: str
    end_time: str
    period_type: str  # Class / MorningBreak / LunchBreak
    label: str

# --- Section ---
class SectionBase(BaseModel):
    name: str = Field(..., min_length=1)
    student_count: int = Field(default=60)

    @field_validator('student_count')
    @classmethod
    def validate_student_count(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Student count must be at least 1.")
        if v > 70:
            raise ValueError("Maximum allowed student strength per section is 70.")
        return v

class SectionCreate(SectionBase):
    department_id: int

class SectionResponse(SectionBase):
    id: int
    department_id: int
    department_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# --- Department ---
class DepartmentBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=10)
    name: str = Field(..., min_length=1)

class DepartmentCreate(DepartmentBase):
    num_sections_auto: Optional[int] = Field(default=0, ge=0, le=10)

class DepartmentResponse(DepartmentBase):
    id: int
    sections: List[SectionResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- Faculty ---
class FacultyAvailabilityBase(BaseModel):
    day_of_week: str
    period_number: int
    is_available: bool = True

class FacultyBase(BaseModel):
    name: str = Field(..., min_length=1)
    department_id: int
    email: Optional[str] = None
    max_weekly_hours: int = Field(default=20, ge=1, le=50)
    preferred_time_slot: str = Field(default="No Preference")  # Morning / Afternoon / No Preference

class FacultyCreate(FacultyBase):
    assigned_subject_ids: Optional[List[int]] = []

class FacultyResponse(FacultyBase):
    id: int
    department_name: Optional[str] = None
    assigned_subject_ids: List[int] = []
    availabilities: List[FacultyAvailabilityBase] = []
    model_config = ConfigDict(from_attributes=True)

# --- Subject ---
class SubjectBase(BaseModel):
    code: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    department_id: int
    section_id: int
    course_type: str = Field(default="Theory")  # Theory / Lab / Project / Activity
    weekly_classes_required: int = Field(default=4)
    duration_in_periods: int = Field(default=1)
    requires_lab: bool = Field(default=False)

    @field_validator('weekly_classes_required')
    @classmethod
    def validate_weekly_classes(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Number of weekly classes required must be greater than 0.")
        return v

class SubjectCreate(SubjectBase):
    assigned_faculty_ids: Optional[List[int]] = []

class SubjectResponse(SubjectBase):
    id: int
    department_name: Optional[str] = None
    section_name: Optional[str] = None
    assigned_faculty_names: List[str] = []
    assigned_faculty_ids: List[int] = []
    model_config = ConfigDict(from_attributes=True)

# --- Room ---
class RoomBase(BaseModel):
    room_number: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    room_type: str = Field(default="Classroom")  # Classroom / Laboratory
    capacity: int = Field(default=60)
    is_lab: bool = Field(default=False)

    @field_validator('capacity')
    @classmethod
    def validate_capacity(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Room capacity must be at least 1.")
        if v > 70:
            raise ValueError("Maximum room capacity allowed is 70.")
        return v

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Preferences ---
class PreferenceBase(BaseModel):
    key: str
    value: str
    category: str = "general"
    description: Optional[str] = None

class PreferenceCreate(PreferenceBase):
    pass

class PreferenceResponse(PreferenceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Dashboard & System Summary ---
class SystemSetupProgress(BaseModel):
    university_config_done: bool
    departments_count: int
    sections_count: int
    faculty_count: int
    subjects_count: int
    classrooms_count: int
    laboratories_count: int
    overall_progress_percentage: float
    is_ready_for_generation: bool
    missing_requirements: List[str]

# --- Validation Report ---
class ValidationRuleResult(BaseModel):
    rule_name: str
    status: str  # PASS / WARNING / FAIL
    message: str
    details: List[str] = []

class PreGenerationValidationReport(BaseModel):
    is_valid: bool
    total_checks: int
    passed_checks: int
    warnings_count: int
    errors_count: int
    results: List[ValidationRuleResult]
