# Docker management scripts for Planner application (PowerShell)

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Service
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "=== $Title ===" -ForegroundColor Cyan
    Write-Host ""
}

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check if docker-compose is available
function Test-DockerCompose {
    try {
        docker-compose --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Development setup: Backend in Docker, Frontend local
function Start-DevSetup {
    Write-Header "Starting Development Environment"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not available. Please ensure Docker Desktop is installed."
        exit 1
    }
    
    Write-Status "Starting backend services..."
    docker-compose up -d db redis backend celery_worker celery_beat
    
    Write-Status "Waiting for services to be ready..."
    Start-Sleep -Seconds 10
    
    Write-Status "Development environment is ready!"
    Write-Host ""
    Write-Host "Services:"
    Write-Host "  - Backend API: http://localhost:8000"
    Write-Host "  - Database: localhost:5432"
    Write-Host "  - Redis: localhost:6379"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. cd frontend"
    Write-Host "  2. npm install"
    Write-Host "  3. npm run dev"
    Write-Host ""
    Write-Host "Frontend will be available at: http://localhost:5173"
}

# Production setup
function Start-ProdSetup {
    Write-Header "Starting Production Environment"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not available. Please ensure Docker Desktop is installed."
        exit 1
    }
    
    if (-not (Test-Path ".env.production")) {
        Write-Warning "Production environment file not found."
        Write-Status "Creating from template..."
        Copy-Item "env.production" ".env.production"
        Write-Warning "Please edit .env.production with your actual values before continuing."
        exit 1
    }
    
    Write-Status "Starting production services..."
    docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
    
    Write-Status "Production environment is ready!"
    Write-Host ""
    Write-Host "Application: http://localhost"
    Write-Host "API: http://localhost/api"
}

# Stop all services
function Stop-Services {
    Write-Header "Stopping Services"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not available. Please ensure Docker Desktop is installed."
        exit 1
    }
    
    Write-Status "Stopping all services..."
    docker-compose down
    
    Write-Status "Services stopped."
}

# Stop and remove volumes (WARNING: This will delete all data)
function Reset-All {
    Write-Header "Resetting All Data"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not available. Please ensure Docker Desktop is installed."
        exit 1
    }
    
    Write-Warning "This will delete ALL data including database and Redis data!"
    $confirm = Read-Host "Are you sure? (y/N)"
    
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-Status "Stopping services and removing volumes..."
        docker-compose down -v
        
        Write-Status "Removing all images..."
        docker-compose down --rmi all
        
        Write-Status "Reset complete. All data has been deleted."
    } else {
        Write-Status "Reset cancelled."
    }
}

# View logs
function Show-Logs {
    Write-Header "Viewing Logs"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not available. Please ensure Docker Desktop is installed."
        exit 1
    }
    
    if ([string]::IsNullOrEmpty($Service)) {
        Write-Status "Showing logs for all services..."
        docker-compose logs -f
    } else {
        Write-Status "Showing logs for service: $Service"
        docker-compose logs -f $Service
    }
}

# Check service status
function Get-Status {
    Write-Header "Service Status"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not available. Please ensure Docker Desktop is installed."
        exit 1
    }
    
    Write-Status "Container status:"
    docker-compose ps
    
    Write-Host ""
    Write-Status "Health check:"
    try {
        docker-compose exec -T backend curl -s http://localhost:8000/health | Out-Null
        Write-Status "Backend API is healthy"
    }
    catch {
        Write-Error "Backend API is not responding"
    }
}

# Run database migrations
function Invoke-Migrations {
    Write-Header "Running Database Migrations"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not available. Please ensure Docker Desktop is installed."
        exit 1
    }
    
    Write-Status "Running Alembic migrations..."
    docker-compose exec backend alembic upgrade head
    
    Write-Status "Migrations completed."
}

# Backup database
function Backup-Database {
    Write-Header "Backing Up Database"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not available. Please ensure Docker Desktop is installed."
        exit 1
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backup_$timestamp.sql"
    
    Write-Status "Creating backup: $backupFile"
    docker-compose exec -T db pg_dump -U postgres planner_db > $backupFile
    
    Write-Status "Backup created: $backupFile"
}

# Restore database
function Restore-Database {
    param([string]$BackupFile)
    
    Write-Header "Restoring Database"
    
    if (-not (Test-Docker)) {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        Write-Error "docker-compose is not available. Please ensure Docker Desktop is installed."
        exit 1
    }
    
    if ([string]::IsNullOrEmpty($BackupFile)) {
        Write-Error "Please specify a backup file to restore from."
        Write-Host "Usage: .\docker-scripts.ps1 restore <backup_file.sql>"
        exit 1
    }
    
    if (-not (Test-Path $BackupFile)) {
        Write-Error "Backup file not found: $BackupFile"
        exit 1
    }
    
    Write-Warning "This will overwrite the current database!"
    $confirm = Read-Host "Are you sure? (y/N)"
    
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-Status "Restoring from: $BackupFile"
        Get-Content $BackupFile | docker-compose exec -T db psql -U postgres planner_db
        Write-Status "Database restored."
    } else {
        Write-Status "Restore cancelled."
    }
}

# Show help
function Show-Help {
    Write-Header "Docker Management Scripts"
    Write-Host "Usage: .\docker-scripts.ps1 <command> [options]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  dev-setup      Start development environment (backend in Docker, frontend local)"
    Write-Host "  prod-setup     Start production environment (everything in Docker)"
    Write-Host "  stop           Stop all services"
    Write-Host "  reset          Stop and remove all data (WARNING: destructive)"
    Write-Host "  logs [service] View logs (all services or specific service)"
    Write-Host "  status         Check service status and health"
    Write-Host "  migrate        Run database migrations"
    Write-Host "  backup         Create database backup"
    Write-Host "  restore <file> Restore database from backup file"
    Write-Host "  help           Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\docker-scripts.ps1 dev-setup"
    Write-Host "  .\docker-scripts.ps1 logs backend"
    Write-Host "  .\docker-scripts.ps1 restore backup_20231201_120000.sql"
}

# Main script logic
switch ($Command.ToLower()) {
    "dev-setup" { Start-DevSetup }
    "prod-setup" { Start-ProdSetup }
    "stop" { Stop-Services }
    "reset" { Reset-All }
    "logs" { Show-Logs }
    "status" { Get-Status }
    "migrate" { Invoke-Migrations }
    "backup" { Backup-Database }
    "restore" { Restore-Database $Service }
    "help" { Show-Help }
    default {
        Write-Error "Unknown command: $Command"
        Write-Host ""
        Show-Help
    }
}



