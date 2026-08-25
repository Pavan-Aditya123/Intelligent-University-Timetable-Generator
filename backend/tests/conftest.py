"""
CRITICAL TEST SAFETY RULES:
1. NEVER point tests at the real project database (backend/timetable.db).
2. All tests MUST use this isolated in-memory or test database fixture.
3. Base.metadata.drop_all() is ONLY allowed on the temporary test database fixture.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base

TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_db():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
