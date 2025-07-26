# Technical Stack - PRD Tool

## Frontend Stack

### Core Framework
- **Vite + React 18** - Fast development build tool with React
  - Lightning-fast HMR for development
  - Optimized production builds
  - Better dev experience than Next.js for this use case
  
- **TypeScript 5.x** - Type safety across the application
  - Strict mode enabled
  - Shared types between frontend/backend

### UI & Styling
- **Tailwind CSS 3.x** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Framer Motion** - Animation library for smooth transitions
- **Radix UI** - Accessible component primitives

### State Management & Data Fetching
- **Zustand** - Lightweight state management
  - Global state for user session
  - Local state for UI components
  
- **TanStack Query v5** - Server state management
  - Caching and synchronization
  - Optimistic updates
  - Background refetching

### Editor & Content
- **Monaco Editor** - VS Code editor in browser
  - Syntax highlighting
  - IntelliSense for markdown
  - Custom language support
  
- **react-markdown** - Markdown rendering
  - GitHub Flavored Markdown
  - Custom renderers for Mermaid
  
- **Mermaid** - Diagram generation
  - Flowcharts, sequence diagrams
  - Real-time preview

### Real-time Collaboration (MVP Simplified)
- **Socket.io-client** - WebSocket client
  - Automatic reconnection
  - Room-based communication
  
- **Operational Transforms** - Simpler real-time editing for MVP
  - Character-level operations
  - Conflict resolution via server authority
  - Upgrade path to full CRDT later
  
- **Future: Yjs CRDT** - Full conflict-free collaboration (Phase 2)
  - Offline support
  - Distributed conflict resolution

## Backend Stack

### Runtime & Framework
- **Node.js 20 LTS** - JavaScript runtime
  - Native ESM support
  - Performance improvements
  
- **Express.js** / **Fastify** - Web framework
  - Middleware ecosystem
  - High performance routing

### API Development
- **TypeScript** - Type safety
- **Zod** - Runtime validation
- **OpenAPI/Swagger** - API documentation
- **Express Rate Limit** - API throttling

### Real-time Services
- **Socket.io** - WebSocket server
  - Horizontal scaling with Redis adapter
  - Room management
  - Presence tracking

### AI Integration
- **Direct API Integration** - Simplified approach for MVP
  - OpenAI/Anthropic SDKs directly
  - Custom prompt templates
  - Manual token tracking and cost management
  
- **Future: LangChain.js** - Advanced AI orchestration (Phase 2)
  - Complex chain composition
  - Advanced memory management
  - Multi-model routing

### Database & ORM
- **PostgreSQL 15** - Primary database
  - JSONB for flexible schemas
  - Full-text search
  - Row-level security
  
- **Prisma** - Type-safe ORM
  - Migration management
  - Query optimization
  - Connection pooling

### Caching & Queuing
- **Redis 7** - Cache and pub/sub
  - Session storage
  - Real-time message broker
  - Distributed locks
  
- **BullMQ** - Job queue
  - AI request processing
  - Git operations
  - Email notifications

### Git Integration
- **isomorphic-git** - Pure JavaScript Git
  - Client-side Git operations
  - No native dependencies
  
- **simple-git** - Git wrapper
  - Server-side operations
  - Advanced Git features

## Infrastructure Stack

### Container & Orchestration
- **Docker** - Containerization
  - Multi-stage builds
  - Layer caching
  - Security scanning
  
- **Kubernetes** - Container orchestration
  - Auto-scaling
  - Service mesh (Istio)
  - ConfigMaps/Secrets

### Cloud Services (AWS/GCP/Azure)
- **Load Balancer** - Application Load Balancer
- **CDN** - CloudFront/Cloud CDN
- **Object Storage** - S3/GCS for files
- **Managed PostgreSQL** - RDS/Cloud SQL
- **Managed Redis** - ElastiCache/Cloud Memorystore

### CI/CD Pipeline
- **GitHub Actions** / **GitLab CI**
  - Automated testing
  - Docker image building
  - Kubernetes deployment
  
- **ArgoCD** - GitOps deployment
  - Declarative deployments
  - Automated sync
  - Rollback capabilities

### Monitoring & Observability
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization
- **Jaeger** - Distributed tracing
- **ELK Stack** - Log aggregation
  - Elasticsearch
  - Logstash/Fluentd
  - Kibana

## Development Tools

### Code Quality
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit checks

### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **MSW** - API mocking

### Development Environment
- **Vite** - Fast build tool and dev server
- **Docker Compose** - Local development environment
- **LocalStack** - AWS services locally
- **Mailhog** - Email testing
- **Prisma Studio** - Database management GUI

## Security Stack

### Authentication
- **Passport.js** - Authentication middleware
- **JWT** - Token management
- **OAuth 2.0** - Social login
- **SAML** - Enterprise SSO

### Security Tools
- **Helmet.js** - Security headers
- **CORS** - Cross-origin configuration
- **bcrypt** - Password hashing
- **crypto** - Encryption utilities

### Secrets Management
- **HashiCorp Vault** - Secrets storage
- **AWS Secrets Manager** - Cloud secrets
- **dotenv** - Local development

## Third-party Integrations

### Productivity Tools
- **Jira REST API** - Issue tracking
- **Confluence API** - Documentation
- **Slack SDK** - Notifications
- **Microsoft Graph** - Teams integration
- **Mattermost API** - Chat notifications
- **Craft.io API** - Product strategy platform

### Analytics
- **Segment** - Analytics pipeline
- **Mixpanel** - Product analytics
- **Sentry** - Error tracking
- **LogRocket** - Session replay

### Payment (if needed)
- **Stripe** - Subscription management
- **Webhook processing**
- **Usage-based billing**

## Package Management

### MVP Dependencies
```json
{
  "frontend": {
    "vite": "^5.0.0",
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "@tanstack/react-query": "^5.0.0",
    "socket.io-client": "^4.5.0",
    "@monaco-editor/react": "^4.6.0",
    "mermaid": "^10.0.0",
    "zustand": "^4.4.0"
  },
  "backend": {
    "express": "^4.18.0",
    "typescript": "^5.0.0",
    "prisma": "^5.0.0",
    "socket.io": "^4.5.0",
    "redis": "^4.6.0",
    "bullmq": "^4.0.0",
    "openai": "^4.0.0",
    "@anthropic-ai/sdk": "^0.9.0"
  }
}
```

### Future Phase Dependencies
```json
{
  "phase2": {
    "yjs": "^13.0.0",
    "y-websocket": "^1.5.0",
    "langchain": "^0.1.0"
  }
}
```

## Version Requirements

### Minimum Versions
- Node.js: 20.x LTS
- PostgreSQL: 15.x
- Redis: 7.x
- Docker: 24.x
- Kubernetes: 1.28.x

### Browser Support
- Chrome: 90+
- Firefox: 88+
- Safari: 14+
- Edge: 90+
- Mobile: iOS 14+, Android 10+