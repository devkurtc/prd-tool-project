# PRD Tool - Production Setup Guide

This guide will help you set up the PRD Tool application with a real database and authentication system, without any mock data.

## Prerequisites

You'll need to install:
1. **Docker Desktop** - For running PostgreSQL database
2. **Node.js 20+** - Already installed
3. **PostgreSQL client** (optional) - For direct database access

## Step 1: Stop Current Servers

Stop any running servers:
- Frontend: Press `Ctrl+C` in the terminal running Vite
- Backend: Press `Ctrl+C` in the terminal running the Express server

## Step 2: Install Docker Desktop

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Install and start Docker Desktop
3. Verify installation: `docker --version`

## Step 3: Start PostgreSQL with Docker

Once Docker is installed, run:

```bash
cd /Users/kurtcarabott/CLAUDE/TEST-CLAUDE-CODE/prd-tool-project
docker-compose up -d postgres
```

This will start PostgreSQL on port 5432.

## Step 4: Set Up Database

1. Install Prisma CLI globally (if not already installed):
```bash
npm install -g prisma
```

2. Initialize Prisma in the backend:
```bash
cd backend
npx prisma init
```

3. Update the `.env` file with real database URL:
```
DATABASE_URL="postgresql://postgres:dev_password@localhost:5432/prd_tool_dev"
```

4. Run migrations:
```bash
npx prisma migrate dev --name init
```

## Step 5: Create Initial User

We'll create a registration endpoint first, then you can register your first user through the API.

## Step 6: Start the Application

1. Backend:
```bash
cd backend
npm run dev
```

2. Frontend (in a new terminal):
```bash
cd frontend
npm run dev
```

## Alternative: Use SQLite (No Docker Required)

If you can't install Docker, we can use SQLite instead:

1. Update `.env`:
```
DATABASE_URL="file:./dev.db"
```

2. Update Prisma schema to use SQLite provider
3. Run migrations as normal

## Next Steps

After setup:
1. Register your first user at `/auth/register`
2. Log in at `/auth/login`
3. Create your first real PRD
4. All data will be persisted in the database

## Features Available

- ✅ User registration and login
- ✅ Create, read, update, delete PRDs
- ✅ Real-time collaboration
- ✅ AI assistance (with real API keys)
- ✅ Persistent data storage
- ✅ User sessions with JWT