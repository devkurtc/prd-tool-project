# Local Development Setup Guide

## Prerequisites

Make sure you have these installed:

### Required Software
- **Node.js 20+** - `node --version` should show v20.x.x or higher
- **npm 10+** - `npm --version` should show v10.x.x or higher  
- **Docker Desktop** - For running PostgreSQL, Redis, and MailHog
- **Git** - For version control

### Installation Commands
```bash
# Install Node.js (using nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop/

# Verify installations
node --version    # Should be v20.x.x+
npm --version     # Should be v10.x.x+  
docker --version  # Should show Docker version
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start local services (PostgreSQL, Redis, MailHog)
npm run docker:up

# 3. Set up database
npm run db:migrate

# 4. Seed with sample data (optional)
npm run db:seed

# 5. Start development servers
npm run dev
```

That's it! Your application will be running at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Database**: PostgreSQL on localhost:5432
- **Redis**: localhost:6379
- **MailHog Web UI**: http://localhost:8025

## Detailed Setup Steps

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd prd-tool-project
npm install
```

### 2. Environment Configuration
Environment files are already configured for local development:
- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration

**No changes needed for local development!**

### 3. Start Services
```bash
# Start PostgreSQL, Redis, and MailHog
npm run docker:up

# Verify services are running
docker ps
```

You should see 3 containers:
- `prd-tool-postgres`
- `prd-tool-redis` 
- `prd-tool-mailhog`

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 5. Start Development
```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
npm run dev:frontend  # Port 5173
npm run dev:backend   # Port 3001
```

## Development Workflow

### Daily Development
```bash
# Start services (if not running)
npm run docker:up

# Start development servers
npm run dev

# When done for the day
npm run docker:down
```

### Code Quality
```bash
# Run linting
npm run lint

# Run tests
npm run test

# Build for production
npm run build
```

### Database Operations
```bash
# View database in browser
npm run db:studio

# Reset database (careful!)
npm run db:migrate -- --reset

# Create new migration
npm run db:migrate -- --name your_migration_name
```

## Available URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React application |
| Backend API | http://localhost:3001 | Express.js API |
| Health Check | http://localhost:3001/health | API status |
| Prisma Studio | http://localhost:5555 | Database viewer |
| MailHog | http://localhost:8025 | Email testing |
| Redis Insight | Manual setup | Redis viewer |

## Troubleshooting

### Common Issues

**Docker services won't start:**
```bash
# Check if ports are in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :1025  # MailHog SMTP
lsof -i :8025  # MailHog Web

# Kill processes using ports
kill -9 <PID>

# Restart Docker
npm run docker:down
npm run docker:up
```

**Database connection errors:**
```bash
# Wait for PostgreSQL to fully start
docker logs prd-tool-postgres

# Test connection manually
psql postgresql://postgres:dev_password@localhost:5432/prd_tool_dev
```

**Frontend/Backend not starting:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Must be 20.x.x+
```

**Prisma errors:**
```bash
# Regenerate Prisma client
npm run db:generate

# Reset database completely
npm run db:migrate -- --reset
```

### Port Conflicts
If you have port conflicts, update these files:
- `docker-compose.yml` - Change service ports
- `backend/.env` - Update PORT and DATABASE_URL
- `frontend/.env` - Update VITE_API_URL

### Environment Issues
```bash
# Verify environment files exist
ls -la backend/.env
ls -la frontend/.env

# Check environment variables
cat backend/.env
cat frontend/.env
```

## Development Tools

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- Prisma
- Docker
- GitLens
- Prettier
- ESLint
- Tailwind CSS IntelliSense

### Database Tools
- **Prisma Studio** (included) - `npm run db:studio`
- **pgAdmin** - Full PostgreSQL administration
- **DBeaver** - Universal database tool

### API Testing
- **Thunder Client** (VS Code extension)
- **Postman** - API development platform
- **Insomnia** - API client

## Performance Monitoring

### Local Monitoring
```bash
# Check Docker resource usage
docker stats

# Monitor logs
docker logs -f prd-tool-postgres
docker logs -f prd-tool-redis
docker logs -f prd-tool-mailhog

# Backend logs
tail -f backend/logs/app.log
```

### Database Performance
```bash
# Connect to PostgreSQL
psql postgresql://postgres:dev_password@localhost:5432/prd_tool_dev

# Check active connections
SELECT * FROM pg_stat_activity;

# Check database size
SELECT pg_size_pretty(pg_database_size('prd_tool_dev'));
```

## Next Steps

Once local development is working:
1. **Add AI API Keys** - Update `backend/.env` with real API keys
2. **Configure Git Hooks** - Set up pre-commit hooks for code quality
3. **Set up CI/CD** - GitHub Actions for automated testing
4. **Production Deployment** - Use the AWS scripts when ready

## Getting Help

1. Check this guide first
2. Look at error logs: `docker logs <container-name>`
3. Check the project documentation in `docs/`
4. Review the backend logs: `backend/logs/app.log`

Happy coding! 🚀