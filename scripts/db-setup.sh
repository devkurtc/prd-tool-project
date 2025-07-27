#!/bin/bash

# Database setup script for PRD Tool
# This script starts Docker services and sets up the database

echo "🚀 Setting up PRD Tool Database..."

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Start Docker services
echo "📦 Starting Docker services..."
docker compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is ready
max_attempts=30
attempt=0
while ! docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ PostgreSQL failed to start after $max_attempts attempts"
        exit 1
    fi
    echo "   Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

echo "✅ Database setup complete!"
echo ""
echo "You can now:"
echo "  - Run 'npm run dev' to start the application"
echo "  - Run 'npx prisma studio' to view your database"
echo "  - Run 'npm run db:seed' to add sample data"