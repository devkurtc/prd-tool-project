# Testing Guide

This document outlines the testing setup and procedures for the PRD Tool project.

## Quick Start

```bash
# Run all tests (backend + frontend)
npm test

# Run only frontend tests
npm run test:frontend

# Run only backend tests
npm run test:backend

# Run tests with coverage reports
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch

# Run full CI pipeline locally
npm run ci
```

## Frontend Testing

The frontend uses **Vitest** with **React Testing Library** for comprehensive UI testing.

### Test Structure
```
frontend/src/
├── components/__tests__/     # Component tests
├── contexts/__tests__/       # Context and hook tests
├── lib/__tests__/           # API and utility tests
└── test/                    # Test setup and utilities
```

### Running Frontend Tests
```bash
cd frontend

# Run all tests once
npm test run

# Run tests in watch mode
npm run test:watch

# Run tests with UI (browser interface)
npm run test:ui

# Generate coverage report
npm run test:coverage

# Type checking
npm run typecheck
```

### Test Coverage

Current test coverage:
- **Authentication Components**: LoginForm, AuthContext
- **API Client**: All endpoints, error handling, token management
- **User Interactions**: Form submissions, error states, state management

### Key Test Files

1. **LoginForm.test.tsx**
   - Renders login and register forms correctly
   - Handles form submissions and validation
   - Displays error messages appropriately
   - Tests mode switching between login/register

2. **AuthContext.test.tsx**
   - Authentication state management
   - Login/logout/register flows
   - Token persistence and retrieval
   - Error handling for failed authentication

3. **api.test.tsx**
   - HTTP request handling
   - Authentication token management
   - API endpoint coverage (auth, PRDs, etc.)
   - Error handling and network failures

## Backend Testing

The backend uses **Jest** with **Supertest** for comprehensive API testing.

### Running Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.js
```

### Test Categories

1. **Authentication Tests**
   - User registration and login
   - JWT token generation and validation
   - Password hashing and verification
   - Protected route access

2. **PRD Management Tests**
   - CRUD operations for PRDs
   - User authorization for PRD access
   - Pagination and filtering
   - Input validation

3. **API Integration Tests**
   - Complete request/response cycles
   - Database interactions
   - Error handling and edge cases

## Continuous Integration

### GitHub Actions Workflow

The project includes a comprehensive CI/CD pipeline (`.github/workflows/ci.yml`) that:

1. **Backend Tests**
   - Sets up PostgreSQL test database
   - Runs Prisma migrations
   - Executes all backend tests with coverage

2. **Frontend Tests**
   - Runs all UI tests
   - Performs type checking
   - Builds the frontend application

3. **Code Quality**
   - ESLint for code style
   - TypeScript compilation checks
   - Test coverage validation

4. **Integration Tests**
   - End-to-end API testing
   - Health check verification
   - Swagger documentation validation

### Local CI Simulation

Run the complete CI pipeline locally:

```bash
# Full CI pipeline
npm run ci

# Individual steps
npm run lint           # Code style checks
npm run typecheck      # TypeScript validation
npm test              # All tests
npm run build         # Build applications
```

## Test Environment Setup

### Frontend Test Environment
- **Vitest**: Fast unit test runner optimized for Vite
- **React Testing Library**: DOM testing utilities
- **jsdom**: Browser environment simulation
- **MSW (Future)**: API mocking for integration tests

### Backend Test Environment
- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library
- **SQLite**: In-memory database for tests
- **Test Database**: Isolated from development data

## Writing New Tests

### Frontend Component Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../test/test-utils'
import { YourComponent } from '../YourComponent'

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
  
  it('handles user interactions', async () => {
    const mockFn = vi.fn()
    render(<YourComponent onAction={mockFn} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(mockFn).toHaveBeenCalled()
  })
})
```

### Backend API Tests

```javascript
const request = require('supertest')
const app = require('../app')

describe('API Endpoint', () => {
  it('should return expected response', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200)
      
    expect(response.body).toMatchObject({
      success: true,
      data: expect.any(Object)
    })
  })
})
```

## Debugging Tests

### Frontend Debug Tips
```bash
# Run single test file
npm test LoginForm.test.tsx

# Debug with browser UI
npm run test:ui

# Verbose output
npm test -- --reporter=verbose
```

### Backend Debug Tips
```bash
# Run with debugging
npm test -- --verbose

# Test specific pattern
npm test -- --testNamePattern="login"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test Data and Mocking

### Frontend Mocks
- API client mocked for isolation
- LocalStorage mocked for token management
- Context providers wrapped for consistent state

### Backend Test Data
- Database seeded with predictable test data
- User credentials and tokens generated per test
- Clean database state between tests

## Performance and Best Practices

### Frontend
- ✅ Use `render()` from test-utils for consistent provider setup
- ✅ Mock external dependencies (API calls, localStorage)
- ✅ Test user interactions, not implementation details
- ✅ Use `screen.getByRole()` for accessibility-focused queries

### Backend
- ✅ Use isolated test database
- ✅ Clean up data between tests
- ✅ Test both success and error scenarios
- ✅ Mock external services and APIs

### General
- ✅ Write descriptive test names
- ✅ Follow AAA pattern (Arrange, Act, Assert)
- ✅ Keep tests independent and atomic
- ✅ Maintain high test coverage (>80%)

## Troubleshooting

### Common Issues

1. **Frontend tests timing out**
   - Check for unresolved promises
   - Ensure mocks are properly configured
   - Use `waitFor()` for async operations

2. **Backend tests failing**
   - Verify database connection
   - Check test data setup
   - Ensure proper cleanup between tests

3. **CI pipeline failures**
   - Review GitHub Actions logs
   - Check environment variable setup
   - Verify database migration status

For additional support, refer to the main README.md or open an issue in the project repository.