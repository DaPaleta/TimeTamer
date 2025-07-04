import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import Base
from app.db.session import get_db

# Use PostgreSQL for tests, configurable via env var
# Example: postgresql+psycopg2://postgres:postgres@localhost:5432/planner_test
test_db_url = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/planner_test"
)
engine = create_engine(test_db_url, connect_args={})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def test_user(client):
    # Register a user
    user_data = {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "testpassword123"
    }
    client.post("/api/v1/auth/register", json=user_data)
    # Login
    resp = client.post("/api/v1/auth/login", data={"username": "testuser", "password": "testpassword123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"} 