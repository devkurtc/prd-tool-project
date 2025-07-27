# PRD Tool - AI-Powered Product Requirements Document Platform

## Overview
A collaborative, AI-driven platform for Product Owners to create, manage, and version Product Requirements Documents (PRDs) with real-time collaboration and Git-based version control.

## 🚀 Current Status: **MVP Backend Ready**

✅ **Production-Ready Backend** with comprehensive API documentation and testing
✅ **Swagger Documentation** at `/api-docs` with interactive testing  
✅ **Automated Testing Suite** with 17+ test cases and CI/CD integration
✅ **JWT Authentication** with secure user management
✅ **PRD Management APIs** with full CRUD operations
🔄 **Frontend Integration** - Currently being updated to match backend changes

## Project Structure
```
prd-tool-project/
├── README.md                          # This file
├── docs/
│   ├── requirements/
│   │   ├── functional-requirements.md # Feature specifications
│   │   ├── non-functional-requirements.md # Performance, security, etc.
│   │   └── user-stories.md           # User stories and use cases
│   ├── architecture/
│   │   ├── system-architecture.md    # High-level architecture
│   │   ├── technical-stack.md        # Technology choices
│   │   └── data-flow.md              # Data flow diagrams
│   ├── design/
│   │   ├── software-design.md        # Detailed design specs
│   │   ├── database-schema.md        # Database design
│   │   └── ui-mockups.md             # UI/UX designs
│   ├── api/
│   │   ├── rest-api.md               # REST API documentation
│   │   └── websocket-api.md          # WebSocket events
│   └── flows/
│       ├── user-flows.md             # User journey maps
│       └── process-flows.md          # System process flows
```

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```

### 2. View API Documentation
Visit: **http://localhost:3001/api-docs**
- Interactive Swagger UI
- Test all endpoints
- Authentication & PRD management

### 3. Run Tests
```bash
cd backend
npm test                # Run all tests
npm run test:coverage   # Generate coverage report
./scripts/test-api.sh   # Comprehensive API testing
```

### 4. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentation Structure

### **Implementation Guides**
- `PRODUCTION-READY-GUIDE.md` - Current setup and usage
- `LOCAL-SETUP.md` - Development environment setup
- `TEST-GUIDE.md` - Testing documentation

### **API Documentation**
- **Live Swagger**: http://localhost:3001/api-docs
- `docs/api/rest-api.md` - REST API specifications
- `docs/api/websocket-api-enhanced.md` - WebSocket documentation

### **Architecture & Design**
- `docs/architecture/system-architecture.md` - System overview
- `docs/design/database-schema.md` - Database design
- `docs/requirements/functional-requirements.md` - Feature specifications

## ✅ Implemented Features

### **Backend APIs**
- ✅ **Authentication System**: Registration, login, JWT tokens
- ✅ **PRD Management**: CRUD operations with filtering & pagination
- ✅ **Swagger Documentation**: Interactive API testing
- ✅ **Automated Testing**: 17+ test cases with CI/CD
- ✅ **Production Ready**: Error handling, validation, logging

### **Frontend (In Progress)**
- 🔄 **React + TypeScript**: Modern UI components
- 🔄 **Monaco Editor**: Code editing experience
- 🔄 **Real-time Features**: WebSocket integration
- 🔄 **Authentication UI**: Login/register forms

### **DevOps & Quality**
- ✅ **GitHub Actions**: Automated testing workflow
- ✅ **Database Migrations**: Prisma + SQLite/PostgreSQL
- ✅ **Environment Configuration**: Docker & local development
- ✅ **Test Coverage**: Comprehensive API testing

## 🛠️ Technology Stack

### **Current Implementation**
- **Backend**: Express.js + TypeScript
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT + bcryptjs
- **API Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest + Supertest
- **Frontend**: React + Vite + TypeScript

### **Planned Enhancements**
- **AI Integration**: OpenAI/Claude APIs
- **Real-time**: Socket.io + Operational Transforms
- **Version Control**: Git integration
- **File Upload**: Document attachments

## 🎯 Next Milestones

1. **Frontend-Backend Integration** (Current)
   - Connect frontend to real authentication
   - Implement PRD management UI
   - Replace mock data with API calls

2. **AI Features** (Next)
   - AI-powered PRD generation
   - Content suggestions and improvements
   - Automated documentation

3. **Collaboration** (Future)
   - Real-time editing
   - User presence and cursors
   - Comment and review system