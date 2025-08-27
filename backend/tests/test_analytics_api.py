from datetime import datetime, timedelta


def test_quick_stats_endpoint(client, test_user):
    resp = client.get("/api/v1/analytics/quick-stats", headers=test_user, params={"date_range": "7d"})
    assert resp.status_code == 200
    data = resp.json()
    assert "total_scheduled_minutes" in data
    assert "completed_tasks_count" in data


def test_goals_crud_and_progress(client, test_user):
    # Create goal
    payload = {
        "name": "Deep Work",
        "target_type": "minutes",
        "target_value": 600,
        "time_period": "weekly",
    }
    create = client.post("/api/v1/goals/", json=payload, headers=test_user)
    assert create.status_code == 201
    goal = create.json()

    # List
    lst = client.get("/api/v1/goals/", headers=test_user)
    assert lst.status_code == 200
    assert any(g["goal_id"] == goal["goal_id"] for g in lst.json())

    # Progress
    prog = client.get("/api/v1/goals/progress", headers=test_user)
    assert prog.status_code == 200
    assert isinstance(prog.json(), list)

    # Update
    upd = client.put(f"/api/v1/goals/{goal['goal_id']}", json={"target_value": 300}, headers=test_user)
    assert upd.status_code == 200
    assert upd.json()["target_value"] == 300

    # Delete
    dele = client.delete(f"/api/v1/goals/{goal['goal_id']}", headers=test_user)
    assert dele.status_code == 204


