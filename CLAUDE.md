# CLAUDE.md - PRD Tool Project Guide

## Project Overview
The PRD Tool is an AI-powered Product Requirements Document collaboration platform. This guide helps Claude understand the project structure, development approach, and key decisions.

## Development Approach
- **Incremental Development**: Build feature by feature with git commits at each step
- **Monorepo Structure**: Frontend and backend in separate workspaces
- **Docker-First**: Local development using Docker Compose
- **TypeScript Everywhere**: Strong typing across the entire stack

## Current Project Status
- ✅ **Documentation Phase**: Complete with all specifications
- 🟡 **Development Phase**: Just starting - basic project structure
- ⏳ **MVP Target**: 8 weeks from now

## Key Architecture Decisions

### Technology Stack (MVP-Optimized)
- **Frontend**: Vite + React (not Next.js for faster dev)
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.io (Operational Transforms → CRDT later)
- **AI**: Direct OpenAI/Anthropic APIs (LangChain later)

### Directory Structure
```
prd-tool-project/
├── frontend/          # Vite + React application
├── backend/           # Express.js API server
├── docs/              # All project documentation
├── prisma/            # Database schema and migrations
├── docker-compose.yml # Local development environment
└── package.json       # Root workspace configuration
```

## Development Commands

### Setup and Development
```bash
# Install dependencies
npm install

# Start local services (PostgreSQL, Redis, MailHog)
npm run docker:up

# Run both frontend and backend in development
npm run dev

# Stop local services
npm run docker:down
```

### Database Operations
```bash
# Run Prisma migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Open Prisma Studio
npx prisma studio --schema=./prisma/schema.prisma
```

## Environment Configuration
1. Copy `.env.example` to `.env` in both frontend and backend
2. Update API keys for AI services
3. Database and Redis are configured for Docker Compose

## Incremental Development Plan
Each step should be committed separately for easy rollback:

### Phase 1: Infrastructure (Weeks 1-2)
1. ✅ Project structure and Docker setup
2. Frontend Vite + React setup
3. Backend Express + TypeScript setup
4. Database schema with Prisma
5. Basic authentication

### Phase 2: Core Features (Weeks 3-4)
6. Monaco Editor integration
7. Auto-save functionality
8. WebSocket setup for real-time
9. Basic AI integration (@update commands)

### Phase 3: Collaboration (Weeks 5-6)
10. Real-time presence
11. Operational Transforms
12. Basic commenting
13. User management

### Phase 4: Polish (Weeks 7-8)
14. UI/UX improvements
15. Testing and bug fixes
16. Performance optimization
17. Deployment preparation

## Important Files to Understand

### Documentation (Critical for Understanding)
- `docs/requirements/functional-requirements.md` - What we're building
- `docs/architecture/system-architecture.md` - How it's architected
- `docs/implementation/roadmap-with-risk-mitigation.md` - Development plan with risks
- `IMPROVEMENTS-SUMMARY.md` - All improvements made before development

### Schema and APIs
- `prisma/schema.prisma` - Complete database schema with CRDT support
- `docs/api/websocket-api-enhanced.md` - WebSocket-first API specification
- `docs/security/security-specifications.md` - Security requirements

### Success Metrics
- `docs/metrics/success-metrics.md` - KPIs and monitoring specifications

## Development Guidelines

### Commit Strategy
- Commit after each working feature
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Include brief description of what was accomplished

### Code Quality
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Test coverage target: 80%
- Security-first approach (no secrets in code)

### AI Integration Guidelines
- Start with direct API calls (OpenAI/Anthropic)
- Implement cost tracking from day 1
- Add PII detection before sending to AI
- Cache common responses to reduce costs

### Real-time Collaboration
- Start with simple Operational Transforms
- Server-authoritative conflict resolution
- Graceful degradation if WebSocket fails
- Plan upgrade path to CRDT in Phase 2

## Risk Mitigation
- Each feature has a fallback plan
- Extensive testing before deployment
- Monitoring and alerting from the start
- User feedback collection early and often

## When Working with This Project
1. **Read the specs first** - All requirements are documented
2. **Follow the incremental plan** - Don't skip steps
3. **Commit frequently** - Each step should be reversible
4. **Test thoroughly** - Quality over speed
5. **Monitor costs** - AI usage tracking is critical

## Questions or Issues?
- Check the documentation in `docs/` first
- Review `IMPROVEMENTS-SUMMARY.md` for context
- All architectural decisions are documented with reasoning
- Risk mitigation strategies are in the roadmap

This project is **production-ready** from a specification standpoint. The development phase focuses on implementation with careful attention to the documented requirements and risk mitigation strategies.