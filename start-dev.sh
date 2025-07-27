#!/bin/bash

echo "🚀 Starting PRD Tool Development Environment"
echo "========================================="

# Check if backend is running
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is already running on http://localhost:3001"
else
    echo "❌ Backend not running. Please start it first:"
    echo "   cd backend && npm run dev"
    echo ""
fi

# Start frontend
echo "🎨 Starting Frontend Server..."
cd frontend

# Check if we can serve from dist directory
if [ -d "dist" ]; then
    echo "📦 Serving built frontend from dist/"
    echo "🌐 Frontend will be available at: http://localhost:5173"
    echo "🔧 Backend API available at: http://localhost:3001"
    echo "📚 API Documentation: http://localhost:3001/api-docs"
    echo ""
    echo "Press Ctrl+C to stop the server"
    python3 -m http.server 5173 --directory dist
else
    echo "❌ No built frontend found. Building now..."
    npm run build
    if [ $? -eq 0 ]; then
        echo "✅ Build successful! Starting server..."
        python3 -m http.server 5173 --directory dist
    else
        echo "❌ Build failed. Please check the errors above."
        exit 1
    fi
fi