# Database Setup Guide

## Prerequisites

1. Docker Desktop installed and running
2. Node.js 20+ installed
3. npm 10+ installed

## Quick Setup

Run the following command to set up the database:

```bash
npm run db:setup
```

This script will:
1. Start PostgreSQL and Redis using Docker Compose
2. Wait for services to be ready
3. Generate Prisma client
4. Run database migrations
5. Create all necessary tables

## Manual Setup

If you prefer to run commands manually:

```bash
# Start Docker services
npm run docker:up

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database (optional)
npm run db:seed
```

## Database Management

### View Database
```bash
npm run db:studio
```
This opens Prisma Studio at http://localhost:5555

### Reset Database
```bash
npm run db:reset
```
This will drop all tables and re-run migrations

### Stop Services
```bash
npm run docker:down
```

## Environment Variables

Ensure your `.env` file contains:

```env
DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/prd_tool_dev"
REDIS_URL="redis://localhost:6379"
```

## Database Schema

The database includes the following tables:

- **users** - User accounts and profiles
- **prds** - Product Requirements Documents
- **prd_versions** - Version history for PRDs
- **collaborators** - User permissions for PRDs
- **comments** - Comments on PRDs
- **activities** - Activity log for audit trail
- **ai_interactions** - AI usage tracking
- **sessions** - Authentication sessions

## Troubleshooting

### PostgreSQL Connection Failed
1. Ensure Docker is running
2. Check if port 5432 is available: `lsof -i :5432`
3. Restart Docker services: `npm run docker:restart`

### Migration Failed
1. Check database connection: `docker compose exec postgres psql -U postgres -c '\l'`
2. Reset and try again: `npm run db:reset`

### Permission Errors
1. Ensure script is executable: `chmod +x scripts/db-setup.sh`
2. Check Docker permissions

## Test Data

After seeding, you'll have:
- 3 test users (password: `password123`)
  - alice@example.com
  - bob@example.com
  - charlie@example.com
- 3 sample PRDs with different statuses
- Sample collaborations, comments, and activities