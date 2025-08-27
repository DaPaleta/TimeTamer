#!/bin/bash

# Docker management scripts for Planner application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed. Please install it and try again."
        exit 1
    fi
}

# Development setup: Backend in Docker, Frontend local
dev_setup() {
    print_header "Starting Development Environment"
    check_docker
    check_docker_compose
    
    print_status "Starting backend services..."
    docker-compose up -d db redis backend celery_worker celery_beat
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    print_status "Development environment is ready!"
    echo ""
    echo "Services:"
    echo "  - Backend API: http://localhost:8000"
    echo "  - Database: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo ""
    echo "Next steps:"
    echo "  1. cd frontend"
    echo "  2. npm install"
    echo "  3. npm run dev"
    echo ""
    echo "Frontend will be available at: http://localhost:5173"
}

# Production setup
prod_setup() {
    print_header "Starting Production Environment"
    check_docker
    check_docker_compose
    
    if [ ! -f ".env.production" ]; then
        print_warning "Production environment file not found."
        print_status "Creating from template..."
        cp env.production .env.production
        print_warning "Please edit .env.production with your actual values before continuing."
        exit 1
    fi
    
    print_status "Starting production services..."
    docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
    
    print_status "Production environment is ready!"
    echo ""
    echo "Application: http://localhost"
    echo "API: http://localhost/api"
}

# Stop all services
stop_services() {
    print_header "Stopping Services"
    check_docker
    check_docker_compose
    
    print_status "Stopping all services..."
    docker-compose down
    
    print_status "Services stopped."
}

# Stop and remove volumes (WARNING: This will delete all data)
reset_all() {
    print_header "Resetting All Data"
    check_docker
    check_docker_compose
    
    print_warning "This will delete ALL data including database and Redis data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping services and removing volumes..."
        docker-compose down -v
        
        print_status "Removing all images..."
        docker-compose down --rmi all
        
        print_status "Reset complete. All data has been deleted."
    else
        print_status "Reset cancelled."
    fi
}

# View logs
view_logs() {
    print_header "Viewing Logs"
    check_docker
    check_docker_compose
    
    if [ -z "$1" ]; then
        print_status "Showing logs for all services..."
        docker-compose logs -f
    else
        print_status "Showing logs for service: $1"
        docker-compose logs -f "$1"
    fi
}

# Check service status
check_status() {
    print_header "Service Status"
    check_docker
    check_docker_compose
    
    print_status "Container status:"
    docker-compose ps
    
    echo ""
    print_status "Health check:"
    if docker-compose exec -T backend curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_status "Backend API is healthy"
    else
        print_error "Backend API is not responding"
    fi
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"
    check_docker
    check_docker_compose
    
    print_status "Running Alembic migrations..."
    docker-compose exec backend alembic upgrade head
    
    print_status "Migrations completed."
}

# Backup database
backup_db() {
    print_header "Backing Up Database"
    check_docker
    check_docker_compose
    
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    print_status "Creating backup: $BACKUP_FILE"
    docker-compose exec -T db pg_dump -U postgres planner_db > "$BACKUP_FILE"
    
    print_status "Backup created: $BACKUP_FILE"
}

# Restore database
restore_db() {
    print_header "Restoring Database"
    check_docker
    check_docker_compose
    
    if [ -z "$1" ]; then
        print_error "Please specify a backup file to restore from."
        echo "Usage: $0 restore-db <backup_file.sql>"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        print_error "Backup file not found: $1"
        exit 1
    fi
    
    print_warning "This will overwrite the current database!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Restoring from: $1"
        docker-compose exec -T db psql -U postgres planner_db < "$1"
        print_status "Database restored."
    else
        print_status "Restore cancelled."
    fi
}

# Show help
show_help() {
    print_header "Docker Management Scripts"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  dev-setup      Start development environment (backend in Docker, frontend local)"
    echo "  prod-setup     Start production environment (everything in Docker)"
    echo "  stop           Stop all services"
    echo "  reset          Stop and remove all data (WARNING: destructive)"
    echo "  logs [service] View logs (all services or specific service)"
    echo "  status         Check service status and health"
    echo "  migrate        Run database migrations"
    echo "  backup         Create database backup"
    echo "  restore <file> Restore database from backup file"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev-setup"
    echo "  $0 logs backend"
    echo "  $0 restore backup_20231201_120000.sql"
}

# Main script logic
case "${1:-help}" in
    "dev-setup")
        dev_setup
        ;;
    "prod-setup")
        prod_setup
        ;;
    "stop")
        stop_services
        ;;
    "reset")
        reset_all
        ;;
    "logs")
        view_logs "$2"
        ;;
    "status")
        check_status
        ;;
    "migrate")
        run_migrations
        ;;
    "backup")
        backup_db
        ;;
    "restore")
        restore_db "$2"
        ;;
    "help"|*)
        show_help
        ;;
esac






