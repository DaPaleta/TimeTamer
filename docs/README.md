# Task Planning Application

## Project Overview
A modern task planning application with intelligent scheduling, environment-aware calendar management, and goal-driven analytics.

## Development Setup

### Prerequisites
- Node.js >= 18.x
- Python >= 3.11
- PostgreSQL >= 15.x
- Redis >= 7.x
- Docker (optional, for containerized development)

### Quick Start
1. Clone the repository
```bash
git clone <repository-url>
cd planner
```

2. Setup Frontend (React + TypeScript)
```bash
cd frontend
npm install
npm run dev
```

3. Setup Backend (Python + FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

4. Setup Database
```bash
# Using Docker
docker-compose up -d db redis

# Manual PostgreSQL setup
createdb planner_db
psql planner_db < backend/db/init.sql
```

### Development Scripts
- `npm run dev` - Start frontend development server
- `npm run test` - Run frontend tests
- `npm run lint` - Run ESLint
- `npm run build` - Build for production
- `pytest` - Run backend tests
- `black .` - Format Python code
- `flake8` - Lint Python code

## Project Structure
```
planner/
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── state/      # State management
│   │   ├── api/        # API integration
│   │   └── utils/      # Utility functions
│   ├── tests/          # Frontend tests
│   └── package.json
├── backend/            # Python backend application
│   ├── app/
│   │   ├── api/        # API endpoints
│   │   ├── core/       # Core business logic
│   │   ├── db/         # Database models and migrations
│   │   ├── scheduler/  # Scheduling engine
│   │   └── analytics/  # Analytics engine
│   ├── tests/          # Backend tests
│   └── requirements.txt
├── docs/              # Documentation
├── docker/            # Docker configurations
└── docker-compose.yml
```

## Documentation
- [Architecture Document](docs/ARCHITECTURE.md)
- [Agent Specifications](docs/AGENTS.md)
- [API Documentation](docs/api/README.md)
- [Frontend Documentation](docs/frontend/README.md)
- [Backend Documentation](docs/backend/README.md)

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 