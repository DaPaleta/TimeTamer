# Contributing to TimeTamer

Thank you for your interest in contributing to TimeTamer! This document provides guidelines and information for contributors.

## Development Process

### 1. Setting Up Development Environment

#### Prerequisites

- **Docker Desktop** with WSL2 integration (Windows)
- **Node.js 18+** and **npm**
- **Python 3.11+** (optional for local development)

#### Quick Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/timetamer.git
   cd timetamer
   ```

2. **Start backend services with Docker**

   ```bash
   # Windows
   docker-scripts.bat dev-setup

   # Linux/macOS
   ./docker-scripts.sh dev-setup
   ```

3. **Run frontend locally**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

For detailed setup instructions, see the [README.md](../README.md) and [DOCKER_README.md](../DOCKER_README.md).

### 2. Branching Strategy

- `main` - Production-ready code
- `develop` - Main development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### 3. Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add task scheduling algorithm
fix: resolve calendar sync issue
docs: update API documentation
test: add unit tests for task validation
refactor: improve scheduling engine performance
style: format code with black
chore: update dependencies
```

### 4. Pull Request Process

1. Create a branch from `develop`
2. Implement your changes
3. Add tests covering new functionality
4. Update documentation as needed
5. Submit PR with detailed description
6. Get code review approval
7. Pass all CI checks

### 5. Code Standards

#### Frontend

- Use TypeScript for all new code
- Follow ESLint configuration
- Write unit tests for components
- Document component props
- Use Material-UI components when possible
- Follow React hooks best practices
- Use React Query for server state management

#### Backend

- Follow PEP 8 style guide
- Use type hints
- Document all functions and classes
- Write unit tests for new endpoints
- Follow FastAPI best practices
- Use SQLAlchemy for database operations
- Use Pydantic for data validation

### 6. Testing Requirements

#### Backend Tests

```bash
cd backend
pytest
```

#### Frontend Tests

```bash
cd frontend
npm test
```

#### End-to-End Testing

```bash
# Run the full test suite
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

#### Coverage Requirements

- **Backend**: Minimum 80% coverage for new features
- **Frontend**: Minimum 70% coverage for new features
- **Integration tests**: Required for critical paths
- **E2E tests**: Required for main user flows

### 7. Documentation

- Update API documentation for endpoint changes
- Document new components with JSDoc
- Update architecture doc for significant changes
- Add migration guides for breaking changes
- Update Docker setup documentation if needed

### 8. Performance Guidelines

- Frontend bundle size < 500KB
- API response time < 200ms (95th percentile)
- First contentful paint < 2s
- Time to interactive < 3s
- Database query response time < 50ms

### 9. Security Guidelines

- No secrets in code or version control
- Input validation on all endpoints
- XSS prevention with proper escaping
- CSRF protection for state-changing operations
- Regular dependency updates
- Use environment variables for configuration
- Follow OWASP security guidelines

### 10. Docker Development Guidelines

- All backend services should run in Docker for consistency
- Use Docker Compose for local development
- Frontend can run locally for hot reloading
- Production builds should be fully containerized
- Use multi-stage Dockerfiles for optimization

### 11. Code Review Checklist

- [ ] Follows code standards and style guides
- [ ] Tests included and passing
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Breaking changes documented
- [ ] Docker setup tested
- [ ] API changes documented in OpenAPI spec

## Getting Help

### Before Asking

- Check existing issues and discussions
- Review the documentation in `/docs`
- Test your setup with the provided Docker scripts
- Check the API documentation at `http://localhost:8000/docs`

### Asking for Help

- Use GitHub Issues for bug reports
- Use GitHub Discussions for questions
- Tag relevant team members
- Include relevant logs/errors
- Provide reproduction steps
- Mention your environment (OS, Docker version, etc.)

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Pull Requests**: Code reviews and feedback

## Recognition

Contributors will be:

- Added to our CONTRIBUTORS.md file
- Mentioned in release notes
- Given credit in the project documentation
- Invited to join the core team for significant contributions

## Development Workflow Tips

### Backend Development

- Use the provided Docker setup for consistent environments
- Test API changes with the interactive docs
- Use Alembic for database migrations
- Follow the established API patterns

### Frontend Development

- Use the local development server for hot reloading
- Test with the Docker backend services
- Follow the established component patterns
- Use the provided Material-UI theme

### Database Changes

- Always create migrations for schema changes
- Test migrations on sample data
- Document breaking changes
- Consider backward compatibility

Thank you for contributing to TimeTamer! Your contributions help make this project better for everyone.
