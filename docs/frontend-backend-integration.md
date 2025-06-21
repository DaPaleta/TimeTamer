# Frontend Integration Guide: Task Planner Backend

This document helps frontend engineers integrate with the backend REST API for the Task Planning Application.

## API Base URL
- Local development: `http://localhost:8000/api/v1`

## Authentication
- **Register:** `POST /auth/register` (username, email, password)
- **Login:** `POST /auth/login` (OAuth2 form: username, password)
  - Returns: `access_token`, `refresh_token`, `expires_in`
- **Authenticated Requests:**
  - Add header: `Authorization: Bearer <access_token>`
  - Use `/auth/refresh` to get a new access token when expired.
- **Get/Update Profile:** `GET/PUT /auth/me`

## Tasks
- **List Tasks:** `GET /tasks?status=todo&category_id=...&priority=...&page=1&limit=20&sort_by=deadline&sort_order=asc`
- **Create Task:** `POST /tasks` (see OpenAPI docs for fields)
- **Update Task:** `PUT /tasks/{task_id}`
- **Delete Task:** `DELETE /tasks/{task_id}`
- **Task Comments:** `GET/POST /tasks/{task_id}/comments`

## Categories
- **List:** `GET /tasks/categories`
- **Create:** `POST /tasks/categories`
- **Update:** `PUT /tasks/categories/{category_id}`
- **Delete:** `DELETE /tasks/categories/{category_id}`

## Calendar
- **Get Days:** `GET /calendar/days?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
- **Get Day:** `GET /calendar/days/{date}`
- **Update Day:** `PUT /calendar/days/{date}`
- **Create Day:** `POST /calendar/days`
- **Bulk Update:** `POST /calendar/days/bulk-update`
- **Delete Day:** `DELETE /calendar/days/{date}`

## Error Handling
- All errors follow this format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": { ... },
    "timestamp": "..."
  }
}
```
- Show user-friendly messages for errors.

## CORS
- The backend allows requests from `http://localhost:5173` (Vite dev server).

## OpenAPI Docs
- Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Use schemas for request/response validation.

## Best Practices
- Always check for `401` and refresh tokens as needed.
- Use debounced search/filter for task lists.
- Use pagination for large lists.
- Validate forms on frontend before sending.
- Use the provided error messages for inline feedback.

## Contact
For backend questions, see the OpenAPI docs or contact the backend team. 