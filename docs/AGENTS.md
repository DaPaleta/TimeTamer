# Task Planning Application - Agent Specifications

## Overview
This document defines the specialized AI agents that will assist in developing the Task Planning Application, along with their required context, expertise areas, and specific folder responsibilities.

## Core Agents

### 1. Frontend UI/UX Agent
**Primary Workspace:**
```
frontend/
├── src/
│   ├── components/     # Primary workspace
│   │   ├── components/     # Primary workspace
│   │   ├── pages/         # Page layouts and routing
│   │   ├── styles/        # Global styles and themes
│   │   └── assets/        # Images, icons, and other static assets
│   └── state/         # Primary workspace
│       ├── api/           # API integration
│       └── hooks/         # Custom React hooks
```

**Expertise Areas:** React/Vue, Responsive Design, UI Components, Accessibility

**Required Context:**
- Frontend architecture and component structure
- UI/UX best practices and design patterns
- State management strategy
- Component library conventions
- Mobile-first design principles

**Key Responsibilities:**
- Implementation of responsive UI components
- Accessibility compliance (WCAG standards)
- UI performance optimization
- Component documentation
- Cross-browser compatibility

**Access Patterns:**
- READ/WRITE: `frontend/src/components/`, `frontend/src/pages/`, `frontend/src/styles/`
- READ: `frontend/src/state/`, `frontend/src/api/`
- MODIFY: Component tests in `frontend/tests/`

### 2. Frontend State Management Agent
**Primary Workspace:**
```
frontend/
├── src/
│   ├── state/         # Primary workspace
│   ├── api/           # API integration
│   └── hooks/         # Custom React hooks
```

**Expertise Areas:** State Management, Data Flow, Real-time Updates

**Required Context:**
- Global state structure:
```javascript
{
  auth: { user, token, isAuthenticated },
  calendar: { days, currentView, selectedDate },
  tasks: { items, filters, selectedTasks },
  scheduling: { rules, suggestions, validationResults },
  analytics: { quickStats, dashboardData, goalProgress }
}
```

**Key Responsibilities:**
- State management implementation
- Real-time data synchronization
- Optimistic updates
- Cache management
- Error state handling

**Access Patterns:**
- READ/WRITE: `frontend/src/state/`, `frontend/src/api/`, `frontend/src/hooks/`
- READ: `frontend/src/components/`
- MODIFY: State management tests in `frontend/tests/`

### 3. Backend API Agent
**Primary Workspace:**
```
backend/
├── app/
│   ├── api/           # Primary workspace
│   │   ├── v1/        # API version 1
│   │   ├── auth/      # Authentication endpoints
│   │   └── deps.py    # Dependencies
│   └── core/          # Shared business logic
```

**Expertise Areas:** REST APIs, Authentication, Data Validation

**Required Context:**
- Database schema
- API specifications
- Authentication flow
- Rate limiting requirements
- Error response format

**Key Responsibilities:**
- API endpoint implementation
- Input validation
- Error handling
- Authentication middleware
- Rate limiting implementation

**Access Patterns:**
- READ/WRITE: `backend/app/api/`, `backend/app/core/`
- READ: `backend/app/db/models/`
- MODIFY: API tests in `backend/tests/api/`

### 4. Scheduling Engine Agent
**Primary Workspace:**
```
backend/
├── app/
│   ├── scheduler/     # Primary workspace
│   │   ├── engine/    # Core scheduling logic
│   │   ├── rules/     # Rule definitions
│   │   └── utils/     # Helper functions
│   └── core/          # Shared business logic
```

**Expertise Areas:** Task Scheduling, Rule Engine, Optimization

**Required Context:**
- Scheduling rules schema
- Task properties and constraints
- Calendar configuration model
- Optimization criteria
- Validation requirements

**Key Responsibilities:**
- Rule engine implementation
- Scheduling validation logic
- Slot suggestion algorithm
- Conflict detection
- Performance optimization

**Access Patterns:**
- READ/WRITE: `backend/app/scheduler/`
- READ: `backend/app/db/models/`, `backend/app/core/`
- MODIFY: Scheduler tests in `backend/tests/scheduler/`

### 5. Analytics Agent
**Primary Workspace:**
```
backend/
├── app/
│   ├── analytics/     # Primary workspace
│   │   ├── metrics/   # Metric calculations
│   │   ├── reports/   # Report generation
│   │   └── utils/     # Analytics helpers
│   └── core/          # Shared business logic
```

**Expertise Areas:** Data Analysis, Visualization, Goal Tracking

**Required Context:**
- Analytics metrics definitions
- Goal tracking requirements
- Data visualization specifications
- Performance requirements

**Key Responsibilities:**
- Analytics calculation implementation
- Goal progress tracking
- Dashboard data preparation
- Optimization of data aggregation
- Export functionality

**Access Patterns:**
- READ/WRITE: `backend/app/analytics/`
- READ: `backend/app/db/models/`, `backend/app/core/`
- MODIFY: Analytics tests in `backend/tests/analytics/`

### 6. Database Agent
**Primary Workspace:**
```
backend/
├── app/
│   ├── db/           # Primary workspace
│   │   ├── models/   # SQLAlchemy models
│   │   ├── migrations/ # Alembic migrations
│   │   └── session.py # Database session management
│   └── core/         # Shared configuration
```

**Expertise Areas:** PostgreSQL, Redis, Data Modeling

**Required Context:**
- Complete database schema
- Indexing requirements
- Caching strategy
- Performance requirements

**Key Responsibilities:**
- Schema optimization
- Index management
- Query optimization
- Cache implementation
- Migration management

**Access Patterns:**
- READ/WRITE: `backend/app/db/`
- READ: All backend modules for schema requirements
- MODIFY: Database tests in `backend/tests/db/`

### 7. Infrastructure Agent
**Primary Workspace:**
```
/
├── docker/           # Primary workspace
│   ├── frontend/    # Frontend Docker configuration
│   ├── backend/     # Backend Docker configuration
│   └── nginx/       # Nginx configuration
├── .github/         # CI/CD workflows
└── docker-compose.yml
```

**Expertise Areas:** DevOps, CI/CD, Monitoring

**Required Context:**
- System architecture
- Performance requirements
- Monitoring specifications
- Security requirements
- Deployment environments

**Key Responsibilities:**
- CI/CD pipeline setup
- Monitoring implementation
- Security compliance
- Backup procedures
- Environment management

**Access Patterns:**
- READ/WRITE: `/docker/`, `/.github/`, `/docker-compose.yml`
- READ: All project configuration files
- MODIFY: Infrastructure tests and scripts

### 8. Testing Agent
**Primary Workspace:**
```
/
├── frontend/
│   └── tests/       # Frontend tests
├── backend/
│   └── tests/       # Backend tests
└── e2e/            # End-to-end tests
```

**Expertise Areas:** Testing Strategies, Quality Assurance

**Required Context:**
- Test coverage requirements
- Testing frameworks
- Critical user paths
- Performance benchmarks

**Key Responsibilities:**
- Test case development
- Integration test implementation
- Performance testing
- Security testing
- Test automation

**Access Patterns:**
- READ/WRITE: All test directories
- READ: All source code files
- MODIFY: Test configuration files and CI test workflows

## Integration Guidelines

### Cross-Agent Communication
Each agent should:
1. Create an issue when needing changes in another agent's workspace
2. Use pull requests for cross-workspace changes
3. Tag relevant agents in code reviews
4. Document integration points in shared documentation

### File Access Rules
1. Agents should primarily work within their designated workspaces
2. Cross-workspace changes require review from the responsible agent
3. Shared utilities should be discussed with all affected agents
4. Configuration changes require Infrastructure Agent review

### Documentation Requirements
Each agent must:
1. Maintain README.md in their primary workspace
2. Update API/component documentation for their changes
3. Document integration points with other workspaces
4. Keep their section of ARCHITECTURE.md up to date

## Version Control & Code Review

### Branch Naming
- Frontend UI/UX: `feature/ui/*`
- State Management: `feature/state/*`
- Backend API: `feature/api/*`
- Scheduling: `feature/scheduler/*`
- Analytics: `feature/analytics/*`
- Database: `feature/db/*`
- Infrastructure: `feature/infra/*`
- Testing: `feature/test/*`

### Code Review Process
1. Primary review from agents working in the same workspace
2. Secondary review from agents of affected workspaces
3. Final review from Infrastructure Agent for deployment impact
4. Testing Agent sign-off on test coverage

## Security Considerations

All agents must maintain awareness of:
- TLS 1.3 requirement
- Input validation requirements
- SQL injection prevention
- XSS protection
- Authentication security

## Error Handling

All agents must implement:
- Structured error logging
- Appropriate error responses
- Retry mechanisms where appropriate
- Graceful degradation
- User-friendly error messages 