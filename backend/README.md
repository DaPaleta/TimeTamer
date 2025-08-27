# TimeTamer Backend

This is the backend service for TimeTamer, an intelligent task planning application. It provides RESTful APIs for user authentication, task management, calendar configuration, scheduling rules, analytics, and goal tracking, following a modular, scalable architecture.

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

- **Docker Desktop** with WSL2 integration (Windows)
- **Python 3.11+** (for local development)
- **PostgreSQL** (provided via Docker)
- **Redis** (provided via Docker)

### 2. Development Setup with Docker (Recommended)

#### Option A: Backend in Docker, Frontend Local

```bash
# Start backend services
docker-scripts.bat dev-setup  # Windows
./docker-scripts.sh dev-setup # Linux/macOS

# Run frontend locally
cd frontend
npm install
npm run dev
```

#### Option B: Everything in Docker

```bash
docker-compose up -d
```

### 3. Local Development Setup (Alternative)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp env.example .env  # Edit .env for your local DB credentials
```

### 4. Database

- Tables are auto-created on app startup (development)
- Use Alembic for migrations in production
- PostgreSQL and Redis provided via Docker Compose

### 5. Running the App

```bash
# With Docker (recommended)
docker-compose up backend

# Local development
uvicorn app.main:app --reload
```

- The API will be available at `http://localhost:8000`.
- Interactive docs: `http://localhost:8000/docs`

### 5. Testing

- (To be added) Use `pytest` for backend tests.

* See the new section below on 'Running Tests' for details on how to run and what is covered by the backend test suite.

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
- **Categories:** `/api/v1/categories` (CRUD)
- **Calendar:** `/api/v1/calendar/days` (CRUD, bulk update)
- **Scheduling:** `/api/v1/scheduling/*` (validation, suggestions, rules)
- **Analytics:** `/api/v1/analytics/*` (quick stats, dashboard, exports)
- **Goals:** `/api/v1/goals/*` (goal management, progress tracking)

See [ARCHITECTURE.md](../docs/ARCHITECTURE.md) for full API details.

## Docker Development

### Services

- **Backend API**: FastAPI application with hot reloading
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **Celery Worker**: Background task processing
- **Celery Beat**: Scheduled task management

### Environment Variables

Key environment variables for development:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: Application secret key
- `JWT_SECRET`: JWT token secret
- `DEBUG`: Enable debug mode
- `ALLOWED_ORIGINS`: CORS allowed origins

### Useful Commands

```bash
# View logs
docker-compose logs -f backend

# Restart services
docker-compose restart backend

# Access database
docker-compose exec db psql -U postgres -d planner_db

# Run migrations
docker-compose exec backend alembic upgrade head
```

## Contact

For questions, see the docs or contact the backend lead.
