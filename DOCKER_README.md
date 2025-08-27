# Docker Setup Guide

This guide explains how to use Docker with the Planner application for both development and production environments.

## Overview

The project includes two Docker setups:

1. **Development Mode**: Backend services run in Docker, frontend runs locally with Vite
2. **Production Mode**: Complete containerized application with all services

## Prerequisites

### Windows Requirements

- **Docker Desktop for Windows** installed and running
- **WSL2** (Windows Subsystem for Linux 2) enabled (recommended)
- **Node.js 18+** (for local frontend development)
- **Python 3.11+** (optional, for local backend development)

### Installing Docker Desktop on Windows

1. Download Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Install Docker Desktop
3. Enable WSL2 integration (recommended for better performance)
4. Start Docker Desktop
5. Verify installation by opening PowerShell/Command Prompt and running:
   ```powershell
   docker --version
   docker-compose --version
   ```

### Windows-Specific Notes

- **WSL2 Integration**: For better performance, enable WSL2 integration in Docker Desktop settings
- **File Sharing**: Ensure your project directory is shared with Docker Desktop
- **Antivirus**: Some antivirus software may interfere with Docker. Add Docker directories to exclusions if needed
- **PowerShell**: Use PowerShell or Command Prompt for running Docker commands

## Development Setup

### Option 1: Backend in Docker, Frontend Local (Recommended)

This setup allows you to develop the frontend with hot reloading while running backend services in Docker.

#### 1. Start Backend Services

**Using the Windows batch script (recommended):**

```cmd
docker-scripts.bat dev-setup
```

**Or manually:**

```cmd
docker-compose up -d db redis backend celery_worker celery_beat
```

#### 2. Run Frontend Locally

```cmd
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and will connect to the backend API at `http://localhost:8000`.

#### 3. Access Services

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432
- **Redis**: localhost:6379

### Option 2: Everything in Docker

```cmd
docker-compose up -d
```

## Production Setup

### 1. Prepare Environment

```cmd
REM Copy and edit production environment file
copy env.production .env.production
REM Edit .env.production with your actual values
```

### 2. Deploy

**Using the Windows batch script:**

```cmd
docker-scripts.bat prod-setup
```

**Or manually:**

```cmd
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 3. Access Application

- **Frontend**: http://localhost (or your domain)
- **Backend API**: http://localhost/api (proxied through nginx)

## Windows Management Scripts

The project includes `docker-scripts.bat` for easy management on Windows:

### Available Commands

```cmd
docker-scripts.bat dev-setup      # Start development environment
docker-scripts.bat prod-setup     # Start production environment
docker-scripts.bat stop           # Stop all services
docker-scripts.bat reset          # Stop and remove all data (WARNING: destructive)
docker-scripts.bat logs [service] # View logs (all services or specific service)
docker-scripts.bat status         # Check service status and health
docker-scripts.bat migrate        # Run database migrations
docker-scripts.bat backup         # Create database backup
docker-scripts.bat restore <file> # Restore database from backup file
docker-scripts.bat help           # Show help message
```

### Examples

```cmd
REM Start development environment
docker-scripts.bat dev-setup

REM View backend logs
docker-scripts.bat logs backend

REM Check service status
docker-scripts.bat status

REM Run migrations
docker-scripts.bat migrate
```

## Service Details

### Backend Services

- **backend**: FastAPI application
- **celery_worker**: Celery worker for background tasks
- **celery_beat**: Celery beat for scheduled tasks
- **db**: PostgreSQL database
- **redis**: Redis for caching and Celery broker

### Frontend Service

- **frontend**: React application served by nginx (production only)

## Environment Variables

### Development

Use `env.development` as a reference. Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: Application secret key
- `JWT_SECRET`: JWT signing secret
- `ALLOWED_ORIGINS`: CORS allowed origins

### Production

Use `env.production` as a template. **Important**: Change all secrets and passwords!

## Database Management

### Run Migrations

```cmd
REM Using the script
docker-scripts.bat migrate

REM Or manually
docker-compose exec backend alembic upgrade head
```

### Create Database

```cmd
docker-compose exec db psql -U postgres -d planner_db
```

## Monitoring and Logs

### View Logs

```cmd
REM All services
docker-scripts.bat logs

REM Specific service
docker-scripts.bat logs backend
docker-scripts.bat logs celery_worker

REM Or manually
docker-compose logs -f
docker-compose logs -f backend
```

### Health Checks

Services include health checks for database and Redis. Check status:

```cmd
docker-scripts.bat status
```

## Development Workflow

### 1. Start Development Environment

```cmd
REM Start backend services
docker-scripts.bat dev-setup

REM In another terminal, start frontend
cd frontend && npm run dev
```

### 2. Make Changes

- Frontend changes will hot reload automatically
- Backend changes will restart the container automatically (with `--reload` flag)

### 3. Stop Services

```cmd
REM Stop all services
docker-scripts.bat stop

REM Stop and remove volumes (WARNING: This will delete all data)
docker-compose down -v
```

## Troubleshooting

### Common Windows Issues

1. **Docker Desktop not running**: Start Docker Desktop from the system tray
2. **WSL2 not enabled**: Enable WSL2 in Windows Features and Docker Desktop settings
3. **Port conflicts**: Ensure ports 5432, 6379, 8000, and 5173 are available
4. **Permission issues**: Run PowerShell/Command Prompt as Administrator if needed
5. **File sharing issues**: Add your project directory to Docker Desktop file sharing settings

### Reset Everything

```cmd
REM Using the script
docker-scripts.bat reset

REM Or manually
docker-compose down -v
docker-compose down --rmi all
docker-compose up --build -d
```

### Check Service Status

```cmd
REM Using the script
docker-scripts.bat status

REM Or manually
docker-compose ps
docker-compose exec backend curl http://localhost:8000/health
```

## Production Deployment

### Security Considerations

1. **Change all default passwords** in `.env.production`
2. **Use strong secrets** for `SECRET_KEY` and `JWT_SECRET`
3. **Configure proper CORS** origins
4. **Set up SSL/TLS** with a reverse proxy
5. **Use external database** for production data

### Scaling

For production scaling, consider:

- Using external PostgreSQL service (AWS RDS, etc.)
- Using external Redis service (AWS ElastiCache, etc.)
- Running multiple Celery workers
- Using a load balancer for the backend API

### Backup

```cmd
REM Using the script
docker-scripts.bat backup

REM Or manually
docker-compose exec -T db pg_dump -U postgres planner_db > backup.sql
docker-compose exec -T db psql -U postgres planner_db < backup.sql
```

## File Structure

```
├── docker-compose.yml          # Development compose file
├── docker-compose.prod.yml     # Production compose file
├── docker-scripts.bat          # Windows management script
├── docker-scripts.sh           # Linux/macOS management script
├── env.development             # Development environment template
├── env.production              # Production environment template
├── backend/
│   └── Dockerfile              # Backend multi-stage Dockerfile
└── frontend/
    ├── Dockerfile              # Frontend multi-stage Dockerfile
    └── nginx.conf              # Nginx configuration for production
```

## Windows Performance Tips

1. **Enable WSL2**: Use WSL2 backend in Docker Desktop for better performance
2. **File Sharing**: Add your project directory to Docker Desktop file sharing
3. **Memory Allocation**: Increase memory allocation for Docker Desktop (8GB+ recommended)
4. **Antivirus Exclusions**: Add Docker directories to antivirus exclusions
5. **SSD Storage**: Store Docker data on an SSD for better performance
