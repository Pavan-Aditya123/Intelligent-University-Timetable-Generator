import os
import shutil
import sqlite3
from datetime import datetime

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BACKEND_DIR, "timetable.db")
BACKUPS_DIR = os.path.join(BACKEND_DIR, "backups")

def create_database_backup() -> str:
    """
    Creates a timestamped, WAL-safe backup of backend/timetable.db into backend/backups/.
    Guarantees data preservation before schema or application modifications.
    """
    if not os.path.exists(DB_PATH):
        return ""

    if not os.path.exists(BACKUPS_DIR):
        os.makedirs(BACKUPS_DIR, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"timetable_{timestamp}.db"
    backup_path = os.path.join(BACKUPS_DIR, backup_filename)

    # Use SQLite online backup API for WAL consistency if database is active
    try:
        src_conn = sqlite3.connect(DB_PATH)
        dst_conn = sqlite3.connect(backup_path)
        with dst_conn:
            src_conn.backup(dst_conn)
        dst_conn.close()
        src_conn.close()
    except Exception:
        # Fallback to file copy
        shutil.copy2(DB_PATH, backup_path)

    # Also maintain latest_backup.db copy
    latest_path = os.path.join(BACKUPS_DIR, "timetable_latest.db")
    shutil.copy2(backup_path, latest_path)

    return backup_path
