# Contributing to Task Planner

## Development Process

### 1. Setting Up Development Environment
Follow the setup instructions in the README.md file to get your local development environment running.

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

#### Backend
- Follow PEP 8 style guide
- Use type hints
- Document all functions and classes
- Write unit tests for new endpoints
- Follow FastAPI best practices
- Use SQLAlchemy for database operations

### 6. Testing Requirements
- Frontend: Jest + React Testing Library
- Backend: pytest
- Minimum coverage: 80% backend, 70% frontend
- Integration tests for critical paths
- E2E tests for main user flows

### 7. Documentation
- Update API documentation for endpoint changes
- Document new components in Storybook
- Update architecture doc for significant changes
- Add migration guides for breaking changes

### 8. Performance Guidelines
- Frontend bundle size < 500KB
- API response time < 200ms
- First contentful paint < 2s
- Time to interactive < 3s

### 9. Security Guidelines
- No secrets in code
- Input validation on all endpoints
- XSS prevention
- CSRF protection
- Regular dependency updates

### 10. Code Review Checklist
- [ ] Follows code standards
- [ ] Tests included and passing
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Breaking changes documented

## Getting Help
- Check existing issues
- Ask in #dev-help channel
- Tag relevant team members
- Include relevant logs/errors

## Recognition
Contributors will be added to our CONTRIBUTORS.md file.

Thank you for contributing to Task Planner! 