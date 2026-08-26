"""
CRITICAL DATABASE SAFETY RULES:
1. NEVER call Base.metadata.drop_all(bind=engine) on the real project database (backend/timetable.db).
2. All automated pytest tests must use an in-memory SQLite database or test_timetable.db.
3. Automatic WAL-safe backups are saved to backend/backups/ on application startup.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os

from .database import engine, Base, get_db
from .backup import create_database_backup
from . import models
from .routers import (
    university,
    departments,
    sections,
    faculty,
    subjects,
    rooms,
    preferences,
    validation,
    dashboard,
    scheduler
)

# Trigger WAL-safe database backup on startup if database file exists
try:
    backup_file = create_database_backup()
    if backup_file:
        print(f"[DATA SAFETY] Database backup created successfully at: {backup_file}")
except Exception as e:
    print(f"[DATA SAFETY WARNING] Backup on startup warning: {e}")

# Create missing tables safely without dropping existing data
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Intelligent University-Wide Timetable Generator API",
    description="Backend API with Data Preservation, Health Monitoring, and CSP Backtracking Engine",
    version="2.1.0"
)

# CORS Configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(university.router)
app.include_router(departments.router)
app.include_router(sections.router)
app.include_router(faculty.router)
app.include_router(subjects.router)
app.include_router(rooms.router)
app.include_router(preferences.router)
app.include_router(validation.router)
app.include_router(dashboard.router)
app.include_router(scheduler.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "project": "Intelligent University-Wide Timetable Generator",
        "phase": "Phase 2.1 - CSP & Backtracking Timetable Engine",
        "health": "/api/health",
        "documentation": "/docs"
    }

@app.get("/api/health")
def get_health_status(db: Session = Depends(get_db)):
    """Backend Health & Database Diagnostics Endpoint"""
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "timetable.db")
    return {
        "status": "ok",
        "database": "connected",
        "database_path": db_path,
        "database_exists": os.path.exists(db_path),
        "departments": db.query(models.Department).count(),
        "sections": db.query(models.Section).count(),
        "faculty": db.query(models.Faculty).count(),
        "subjects": db.query(models.Subject).count(),
        "rooms": db.query(models.Room).count(),
        "preferences": db.query(models.TimetablePreference).count(),
        "generated_entries": db.query(models.TimetableEntry).count()
    }
