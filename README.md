# Intelligent University-Wide Timetable Generator

A modern, knowledge-representation and fuzzy decision-making timetable generator built for university-wide course scheduling.

---

## 🛡️ Critical Data Safety & Database Protection Rules

> [!IMPORTANT]
> **CRITICAL DATA PRESERVATION RULE**:
> 1. The production/project database is located at `backend/timetable.db`.
> 2. `Base.metadata.drop_all(bind=engine)` MUST NEVER BE EXECUTED against `backend/timetable.db`.
> 3. Automated tests MUST ALWAYS use an isolated temporary database (`sqlite:///:memory:` or `test_timetable.db`). Tests MUST NEVER point to or modify `backend/timetable.db`.

---

## 💾 Database Location & Backup/Recovery Instructions

### Database Location
- **Active Project Database**: `backend/timetable.db`
- **Automatic Backups Directory**: `backend/backups/`

### Automatic WAL-Safe Backups
The backend server automatically generates a timestamped WAL-safe database backup in `backend/backups/timetable_YYYYMMDD_HHMMSS.db` upon every server startup.

### Manual Backup Command
To create an instant manual backup of the database:
```powershell
python -c "from app.backup import create_database_backup; print(create_database_backup())"
```

### Manual Restore Command
To restore from the latest backup:
```powershell
Copy-Item -Path "backend/backups/timetable_latest.db" -Destination "backend/timetable.db" -Force
```

---

## 🧪 Testing Instructions (Test Database Isolation)

All automated backend pytest cases execute in complete isolation using in-memory SQLite database fixtures (`conftest.py`).

Run the test suite safely without affecting `backend/timetable.db`:
```powershell
pytest backend/tests
```

---

## 🚀 How to Run the Application

### 1. Start Backend API Server
```powershell
cd backend
python run.py
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Diagnostics: `http://127.0.0.1:8000/api/health`

### 2. Start Frontend Admin UI
```powershell
cd frontend
npm run dev
```
- Admin Dashboard UI: `http://localhost:3000`