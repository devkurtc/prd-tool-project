# Authentication Debugging Guide

## Issues Fixed

1. **JWT Token Detection**: Fixed logic to properly identify JWT vs session tokens using dot presence instead of length
2. **Port Mismatch**: Fixed backend port from 3002 to 3001 to match frontend expectations
3. **Environment Validation**: Made environment variable validation more flexible
4. **User Validation**: Improved user account status checking in middleware

## Testing the Fix

### 1. Start Backend Server
```bash
cd backend
npm run dev
```

### 2. Test Authentication Flow
```bash
cd backend
node scripts/test-auth.js
```

This script will:
- Test health endpoint
- Register a new user
- Test /api/auth/me endpoint
- Test login functionality

### 3. Check Server Startup
```bash
cd backend
node scripts/check-startup.js
```

### 4. Manual API Testing

#### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'
```

#### Login User
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Get Current User (replace TOKEN with actual token)
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Key Changes Made

### Authentication Middleware (`auth.ts`)
```typescript
// Old: token.length < 100 (unreliable)
// New: token.includes('.') (JWT tokens have dots)
if (token.includes('.')) {
  // Handle JWT token
} else {
  // Handle session token
}
```

### Environment Configuration (`env.ts`)
- Made DATABASE_URL and REDIS_URL validation more flexible
- Removed strict URL validation that was causing startup issues

### Port Configuration (`.env`)
```
PORT="3001"  # Fixed from 3002
```

## Expected Results

✅ **Working Authentication Flow:**
1. User registration returns JWT token
2. /api/auth/me works with valid token
3. User login returns JWT token
4. Token validation works correctly
5. Session management works properly

❌ **If Still Having Issues:**
1. Check if PostgreSQL is running: `docker compose up -d`
2. Verify .env file has correct DATABASE_URL
3. Check backend logs for specific errors
4. Run the test scripts to isolate the issue

## Frontend Integration

The frontend should now be able to:
1. Register users successfully
2. Login and receive valid tokens
3. Make authenticated requests to /api/auth/me
4. Handle authentication state properly

If you're still seeing "Invalid or expired session" errors:
1. Clear browser localStorage/sessionStorage
2. Check network tab for actual API responses
3. Verify the token is being sent correctly in Authorization header