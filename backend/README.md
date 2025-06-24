# Task Planner Backend

This is the backend service for the Task Planning Application. It provides RESTful APIs for user authentication, task management, calendar configuration, and category management, following a modular, scalable architecture.

## Project Structure

```
backend/
  app/
    api/
      v1/           # Versioned API endpoints (auth, tasks, calendar)
    core/           # Core utilities (config, auth)
    db/             # Database models and session management
    schemas/        # Pydantic schemas for API validation
    main.py         # FastAPI app entrypoint
  requirements.txt  # Python dependencies
  env.example       # Example environment variables
```

- **api/v1/**: All REST API endpoints, grouped by resource and versioned.
- **core/**: Configuration and authentication utilities.
- **db/**: SQLAlchemy models and session helpers.
- **schemas/**: Pydantic models for request/response validation.
- **main.py**: FastAPI app, CORS, error handling, router inclusion.

## Setup & Development

### 1. Prerequisites
- Python 3.10+
- PostgreSQL (for production; SQLite can be used for local dev)
- Redis (optional, for future features)

### 2. Installation
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp env.example .env  # Edit .env for your local DB credentials
```

### 3. Database
- By default, tables are auto-created on app startup (for dev only).
- For production, use Alembic for migrations (to be added).

### 4. Running the App
```bash
uvicorn app.main:app --reload
```
- The API will be available at `http://localhost:8000`.
- Interactive docs: `http://localhost:8000/docs`

### 5. Testing
- (To be added) Use `pytest` for backend tests.
+ See the new section below on 'Running Tests' for details on how to run and what is covered by the backend test suite.

## Running Tests

To ensure the backend is ready for frontend integration and MVP requirements, run the automated test suite:

1. **Seed the Database:**
   - The test suite will automatically create and use a test database (SQLite in-memory by default).
   - If you want to run tests against PostgreSQL, set the appropriate environment variables in `.env`.

2. **Run Tests:**
   ```bash
   cd backend
   pytest
   ```

3. **What is Tested:**
   - All MVP endpoints are implemented and reachable
   - Database is seeded with test data
   - JWT-based authentication (register/login, protected routes)
   - CORS is enabled for frontend origin
   - User can register/login and get a JWT
   - Can CRUD a task via API
   - Can fetch calendar days and categories
   - API returns correct error format (see ARCHITECTURE.md)

Test results will be shown in the console. All tests should pass before integration with the frontend.

## Contribution Guidelines

- Follow the [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for design and API specs.
- Use feature branches: `feature/api/*`, `feature/db/*`, etc.
- Write clear, modular code and document new endpoints.
- All code must be reviewed by at least one other engineer.
- Add/modify tests for new features or bugfixes.
- Keep your `.env` and secrets out of version control.

## API Overview
- **Auth:** `/api/v1/auth/register`, `/login`, `/refresh`, `/me`
- **Tasks:** `/api/v1/tasks`, `/tasks/{task_id}` (CRUD, filtering, comments)
- **Categories:** `/api/v1/tasks/categories` (CRUD)
- **Calendar:** `/api/v1/calendar/days` (CRUD, bulk update)

See [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for full API details.

## Contact
For questions, see the docs or contact the backend lead. 