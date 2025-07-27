#!/bin/bash

# PRD Tool Backend API Testing Script
# This script runs comprehensive tests on all backend APIs

set -e

echo "🧪 PRD Tool Backend API Testing"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the backend directory"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Setup test database
print_status "Setting up test database..."
DATABASE_URL="file:./test.db" npx prisma migrate dev --name init --schema=../prisma/schema.prisma
npx prisma generate --schema=../prisma/schema.prisma

# Run linting
print_status "Running code linting..."
if npm run lint; then
    print_success "Code linting passed"
else
    print_error "Code linting failed"
    exit 1
fi

# Run TypeScript compilation
print_status "Checking TypeScript compilation..."
if npm run build; then
    print_success "TypeScript compilation successful"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

# Run tests
print_status "Running unit tests..."
if npm test; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Run tests with coverage
print_status "Running tests with coverage..."
if npm run test:coverage; then
    print_success "Coverage tests passed"
else
    print_error "Coverage tests failed"
    exit 1
fi

# Test Swagger documentation
print_status "Testing Swagger documentation..."
if node -e "
import('./dist/swagger/swagger.js').then(({specs}) => {
    console.log('✅ Swagger specs generated successfully');
    console.log('📊 API endpoints documented:', Object.keys(specs.paths || {}).length);
    if (Object.keys(specs.paths || {}).length === 0) {
        console.error('❌ No API endpoints documented');
        process.exit(1);
    }
}).catch(err => {
    console.error('❌ Swagger generation failed:', err);
    process.exit(1);
});
"; then
    print_success "Swagger documentation is valid"
else
    print_error "Swagger documentation test failed"
    exit 1
fi

# Test API server startup (if not in CI)
if [ -z "$CI" ]; then
    print_status "Testing API server startup..."
    
    # Start the server in the background
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test health endpoint
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "API server started successfully"
        
        # Test Swagger UI endpoint
        if curl -f http://localhost:3001/api-docs > /dev/null 2>&1; then
            print_success "Swagger UI is accessible"
        else
            print_warning "Swagger UI not accessible (might be disabled in production)"
        fi
        
    else
        print_error "API server failed to start or health check failed"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    # Stop the server
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    print_success "API server stopped"
else
    print_status "Skipping server startup test (running in CI)"
fi

print_success "All API tests completed successfully! 🎉"
print_status "Summary:"
echo "  ✅ Code linting passed"
echo "  ✅ TypeScript compilation successful"
echo "  ✅ Unit tests passed"
echo "  ✅ Coverage tests passed"
echo "  ✅ Swagger documentation validated"
if [ -z "$CI" ]; then
    echo "  ✅ API server startup test passed"
fi

print_status "You can now:"
echo "  🚀 Start the development server: npm run dev"
echo "  📚 View API documentation: http://localhost:3001/api-docs"
echo "  💾 View database: npx prisma studio"