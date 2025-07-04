import pytest
from fastapi import status

# 1. Auth endpoints

def test_register_and_login(client):
    # Register
    resp = client.post("/api/v1/auth/register", json={
        "username": "user1",
        "email": "user1@example.com",
        "password": "password1234"
    })
    assert resp.status_code == 201 or resp.status_code == 400  # 400 if already exists
    # Login
    resp = client.post("/api/v1/auth/login", data={
        "username": "user1",
        "password": "password1234"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

# 2. CORS check

def test_cors_enabled(client):
    resp = client.options("/api/v1/auth/login", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST"
    })
    assert resp.status_code in (200, 204)
    assert "access-control-allow-origin" in resp.headers

# 3. CRUD Task

def test_task_crud(client, test_user):
    # Create category
    cat_resp = client.post("/api/v1/tasks/categories", json={"name": "Work", "color_hex": "#FF0000"}, headers=test_user)
    assert cat_resp.status_code == 201
    category_id = cat_resp.json()["category_id"]
    # Create task
    task_data = {
        "title": "Test Task",
        "description": "Test Desc",
        "category_id": category_id,
        "fitting_environments": ['office'],
        "priority": "medium",
        "estimated_duration_minutes": 30
    }
    resp = client.post("/api/v1/tasks", json=task_data, headers=test_user)
    print("DANIEL RESP", resp.json())
    assert resp.status_code == 201
    task_id = resp.json()["task_id"]
    # Get task
    resp = client.get(f"/api/v1/tasks/{task_id}", headers=test_user)
    assert resp.status_code == 200
    # Update task
    resp = client.put(f"/api/v1/tasks/{task_id}", json={"title": "Updated Task"}, headers=test_user)
    assert resp.status_code == 200
    # Delete task
    resp = client.delete(f"/api/v1/tasks/{task_id}", headers=test_user)
    assert resp.status_code == 204

# 4. Fetch calendar days and categories

def test_fetch_calendar_and_categories(client, test_user):
    # Categories
    resp = client.get("/api/v1/tasks/categories", headers=test_user)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    # Calendar days
    resp = client.get("/api/v1/calendar/days?start_date=2025-01-01&end_date=2025-01-07", headers=test_user)
    assert resp.status_code == 200
    assert "days" in resp.json()

# 5. Error format

def test_error_format(client):
    # Invalid registration (short password)
    resp = client.post("/api/v1/auth/register", json={
        "username": "shortpw",
        "email": "shortpw@example.com",
        "password": "123"
    })
    assert resp.status_code == 422 or resp.status_code == 400
    data = resp.json()
    if resp.status_code == 400:
        assert "error" in data
        assert "code" in data["error"]
        assert "message" in data["error"]

def test_scheduled_events_validation(client, test_user):
    # Create category
    cat_resp = client.post("/api/v1/tasks/categories", json={"name": "Focus", "color_hex": "#00FF00"}, headers=test_user)
    assert cat_resp.status_code == 201
    category_id = cat_resp.json()["category_id"]
    # Create a calendar day with availability and focus slots
    cal_resp = client.post("/api/v1/calendar/days", json={
        "date": "2025-01-02",
        "work_environment": "office",
        "focus_slots": [{"start_time": "09:00", "end_time": "12:00", "focus_level": "high"}],
        "availability_slots": [{"start_time": "09:00", "end_time": "17:00", "status": "available"}]
    }, headers=test_user)
    assert cal_resp.status_code == 201
    # Create a task with a valid scheduled slot
    task_data = {
        "title": "Deep Work",
        "category_id": category_id,
        "fitting_environments": ["office"],
        "priority": "high",
        "estimated_duration_minutes": 60,
        "requires_focus": True,
        "scheduled_slots": [{
            "start_time": "2025-01-02T09:30:00",
            "end_time": "2025-01-02T10:30:00",
            "calendar_day_id": None
        }]
    }
    resp = client.post("/api/v1/tasks", json=task_data, headers=test_user)
    assert resp.status_code == 201
    # Create a task with an invalid slot (wrong environment)
    task_data2 = {
        "title": "Outdoor Task",
        "category_id": category_id,
        "fitting_environments": ["outdoors"],
        "priority": "medium",
        "estimated_duration_minutes": 30,
        "scheduled_slots": [{
            "start_time": "2025-01-02T11:00:00",
            "end_time": "2025-01-02T11:30:00",
            "calendar_day_id": None
        }]
    }
    resp2 = client.post("/api/v1/tasks", json=task_data2, headers=test_user)
    assert resp2.status_code == 201
    # Query scheduled events
    sched_resp = client.get("/api/v1/tasks/scheduled?start=2025-01-01&end=2025-01-03", headers=test_user)
    assert sched_resp.status_code == 200
    events = sched_resp.json()
    assert isinstance(events, list)
    # Check that both events are present and validation is correct
    found_valid = found_invalid = False
    for event in events:
        if event['title'] == 'Deep Work':
            assert event['validation']['valid'] is True
            found_valid = True
        if event['title'] == 'Outdoor Task':
            assert event['validation']['valid'] is False
            assert 'Work environment mismatch' in event['validation']['reasons']
            found_invalid = True
    assert found_valid and found_invalid 