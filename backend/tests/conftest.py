import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from alembic.config import Config
from alembic import command
from backend.app.core.config import settings
import backend.app.db.session as db_session
from backend.app.main import app
import seed.load

# Ensure tests run strictly against the separate test database
test_db_url = settings.TEST_DATABASE_URL
assert "test" in test_db_url.lower(), f"TEST_DATABASE_URL must be a dedicated test database: {test_db_url}"
assert test_db_url != settings.DATABASE_URL, "TEST_DATABASE_URL must never match the dev DATABASE_URL!"

test_engine = create_engine(test_db_url)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Monkeypatch db_session so SessionLocal and engine use the test database
db_session.engine = test_engine
db_session.SessionLocal = TestSessionLocal

# Also monkeypatch seed.load so it seeds the test database
seed.load.engine = test_engine
seed.load.SessionLocal = TestSessionLocal

def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[db_session.get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Applies Alembic migrations and seeds the dedicated Postgres test database once per session."""
    # 1. Run migrations on test DB
    old_env_url = os.environ.get("DATABASE_URL")
    os.environ["DATABASE_URL"] = test_db_url
    try:
        cfg = Config("alembic.ini")
        cfg.set_main_option("sqlalchemy.url", test_db_url)
        command.upgrade(cfg, "head")
    finally:
        if old_env_url is not None:
            os.environ["DATABASE_URL"] = old_env_url
        else:
            os.environ.pop("DATABASE_URL", None)

    # 2. Reseed test database idempotently
    seed.load.run_seed()

    yield
