-- PostgreSQL initialization script for PRD Tool
-- This script runs when the Docker container is first created

-- Create the main database (already created by POSTGRES_DB env var)
-- CREATE DATABASE prd_tool_dev;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Set timezone
SET timezone = 'UTC';

-- Create initial admin user (will be replaced by Prisma migrations)
-- This is just to ensure the database is properly initialized
DO $$
BEGIN
    -- Database is ready for Prisma migrations
    RAISE NOTICE 'PostgreSQL database initialized successfully for PRD Tool';
END
$$;