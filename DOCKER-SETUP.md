# 🐳 Docker Setup Guide for PRD Tool

This guide will help you install Docker and complete the PRD Tool setup in under 5 minutes.

## Step 1: Install Docker Desktop

### macOS (which you're using):
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Open the downloaded `.dmg` file
3. Drag Docker to Applications
4. Launch Docker Desktop from Applications
5. Wait for Docker to start (you'll see the whale icon in your menu bar)

## Step 2: Start the Database Services

Once Docker is running, execute these commands in the terminal:

```bash
# Navigate to the project directory
cd /Users/kurtcarabott/CLAUDE/TEST-CLAUDE-CODE/prd-tool-project

# Start all services (PostgreSQL, Redis, MailHog)
docker compose up -d

# Verify services are running
docker compose ps
```

You should see:
- PostgreSQL running on port 5432
- Redis running on port 6379
- MailHog running on ports 1025 (SMTP) and 8025 (Web UI)

## Step 3: Run Database Migrations

```bash
# Navigate to backend directory
cd backend

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# (Optional) Seed the database with sample data
npm run db:seed
```

## Step 4: Restart the Backend Server

```bash
# Kill the current backend process
lsof -ti:3001 | xargs kill -9

# Start the backend server again
npm run dev
```

## Step 5: Test the Complete Application

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```
   
2. **Create a Test User:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","name":"Test User","password":"password123"}'
   ```

3. **Open the Application:**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:3001/api-docs
   - MailHog: http://localhost:8025

## Step 6: Stop Services (when done)

```bash
# Stop all Docker services
docker compose down

# Stop and remove volumes (complete cleanup)
docker compose down -v
```

## 🎉 You're Done!

The PRD Tool should now be fully functional with:
- ✅ Database persistence
- ✅ User authentication
- ✅ Real-time collaboration
- ✅ AI-powered suggestions
- ✅ Email notifications (via MailHog)

## Troubleshooting

### If Docker fails to start:
- Make sure virtualization is enabled in your BIOS
- Check System Preferences > Security & Privacy > General for any blocked software
- Restart your Mac and try again

### If database connection fails:
- Check if PostgreSQL is running: `docker compose ps`
- Verify the connection string in `.env` file
- Try restarting Docker services: `docker compose restart`

### If migrations fail:
- Check database is accessible: `docker compose logs postgres`
- Try resetting: `npx prisma migrate reset --force`