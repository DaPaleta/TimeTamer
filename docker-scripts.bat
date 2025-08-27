@echo off
setlocal enabledelayedexpansion

REM Docker management scripts for Planner application (Windows)

REM Function to print colored output (simple text version for Windows)
:print_status
echo [INFO] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

:print_header
echo.
echo === %~1 ===
echo.
goto :eof

REM Function to check if Docker is running
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not running. Please start Docker Desktop and try again."
    exit /b 1
)
goto :eof

REM Function to check if docker-compose is available
:check_docker_compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "docker-compose is not available. Please ensure Docker Desktop is installed."
    exit /b 1
)
goto :eof

REM Development setup: Backend in Docker, Frontend local
:dev_setup
call :print_header "Starting Development Environment"
call :check_docker
call :check_docker_compose

call :print_status "Starting backend services..."
docker-compose up -d db redis backend celery_worker celery_beat

call :print_status "Waiting for services to be ready..."
timeout /t 10 /nobreak >nul

call :print_status "Development environment is ready!"
echo.
echo Services:
echo   - Backend API: http://localhost:8000
echo   - Database: localhost:5432
echo   - Redis: localhost:6379
echo.
echo Next steps:
echo   1. cd frontend
echo   2. npm install
echo   3. npm run dev
echo.
echo Frontend will be available at: http://localhost:5173
goto :eof

REM Production setup
:prod_setup
call :print_header "Starting Production Environment"
call :check_docker
call :check_docker_compose

if not exist ".env.production" (
    call :print_warning "Production environment file not found."
    call :print_status "Creating from template..."
    copy env.production .env.production >nul
    call :print_warning "Please edit .env.production with your actual values before continuing."
    exit /b 1
)

call :print_status "Starting production services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

call :print_status "Production environment is ready!"
echo.
echo Application: http://localhost
echo API: http://localhost/api
goto :eof

REM Stop all services
:stop_services
call :print_header "Stopping Services"
call :check_docker
call :check_docker_compose

call :print_status "Stopping all services..."
docker-compose down

call :print_status "Services stopped."
goto :eof

REM Stop and remove volumes (WARNING: This will delete all data)
:reset_all
call :print_header "Resetting All Data"
call :check_docker
call :check_docker_compose

call :print_warning "This will delete ALL data including database and Redis data!"
set /p "confirm=Are you sure? (y/N): "
if /i "!confirm!"=="y" (
    call :print_status "Stopping services and removing volumes..."
    docker-compose down -v
    
    call :print_status "Removing all images..."
    docker-compose down --rmi all
    
    call :print_status "Reset complete. All data has been deleted."
) else (
    call :print_status "Reset cancelled."
)
goto :eof

REM View logs
:view_logs
call :print_header "Viewing Logs"
call :check_docker
call :check_docker_compose

if "%~1"=="" (
    call :print_status "Showing logs for all services..."
    docker-compose logs -f
) else (
    call :print_status "Showing logs for service: %~1"
    docker-compose logs -f "%~1"
)
goto :eof

REM Check service status
:check_status
call :print_header "Service Status"
call :check_docker
call :check_docker_compose

call :print_status "Container status:"
docker-compose ps

echo.
call :print_status "Health check:"
docker-compose exec -T backend curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    call :print_error "Backend API is not responding"
) else (
    call :print_status "Backend API is healthy"
)
goto :eof

REM Run database migrations
:run_migrations
call :print_header "Running Database Migrations"
call :check_docker
call :check_docker_compose

call :print_status "Running Alembic migrations..."
docker-compose exec backend alembic upgrade head

call :print_status "Migrations completed."
goto :eof

REM Backup database
:backup_db
call :print_header "Backing Up Database"
call :check_docker
call :check_docker_compose

for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "BACKUP_FILE=backup_%YYYY%%MM%%DD%_%HH%%Min%%Sec%.sql"

call :print_status "Creating backup: %BACKUP_FILE%"
docker-compose exec -T db pg_dump -U postgres planner_db > "%BACKUP_FILE%"

call :print_status "Backup created: %BACKUP_FILE%"
goto :eof

REM Restore database
:restore_db
call :print_header "Restoring Database"
call :check_docker
call :check_docker_compose

if "%~1"=="" (
    call :print_error "Please specify a backup file to restore from."
    echo Usage: %0 restore-db ^<backup_file.sql^>
    exit /b 1
)

if not exist "%~1" (
    call :print_error "Backup file not found: %~1"
    exit /b 1
)

call :print_warning "This will overwrite the current database!"
set /p "confirm=Are you sure? (y/N): "
if /i "!confirm!"=="y" (
    call :print_status "Restoring from: %~1"
    docker-compose exec -T db psql -U postgres planner_db < "%~1"
    call :print_status "Database restored."
) else (
    call :print_status "Restore cancelled."
)
goto :eof

REM Show help
:show_help
call :print_header "Docker Management Scripts"
echo Usage: %0 ^<command^> [options]
echo.
echo Commands:
echo   dev-setup      Start development environment (backend in Docker, frontend local)
echo   prod-setup     Start production environment (everything in Docker)
echo   stop           Stop all services
echo   reset          Stop and remove all data (WARNING: destructive)
echo   logs [service] View logs (all services or specific service)
echo   status         Check service status and health
echo   migrate        Run database migrations
echo   backup         Create database backup
echo   restore ^<file^> Restore database from backup file
echo   help           Show this help message
echo.
echo Examples:
echo   %0 dev-setup
echo   %0 logs backend
echo   %0 restore backup_20231201_120000.sql
goto :eof

REM Main script logic
if "%~1"=="" goto show_help

if "%~1"=="dev-setup" goto dev_setup
if "%~1"=="prod-setup" goto prod_setup
if "%~1"=="stop" goto stop_services
if "%~1"=="reset" goto reset_all
if "%~1"=="logs" goto view_logs
if "%~1"=="status" goto check_status
if "%~1"=="migrate" goto run_migrations
if "%~1"=="backup" goto backup_db
if "%~1"=="restore" goto restore_db
if "%~1"=="help" goto show_help

REM If we get here, unknown command
call :print_error "Unknown command: %~1"
echo.
goto show_help



