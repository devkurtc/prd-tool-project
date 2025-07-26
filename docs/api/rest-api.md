# REST API Documentation - PRD Tool

## 1. API Overview

### 1.1 Base Information
- **Base URL**: `https://api.prdtool.com/v1`
- **Authentication**: Bearer Token (JWT)
- **Content Type**: `application/json`
- **Rate Limiting**: 1000 requests/hour per user

### 1.2 Common Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Organization-ID: <org_id>
X-Request-ID: <unique_request_id>
```

### 1.3 Standard Response Format
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2024-01-26T10:30:00Z",
    "requestId": "req_123456789"
  },
  "errors": []
}
```

### 1.4 Error Response Format
```json
{
  "success": false,
  "data": null,
  "meta": {
    "timestamp": "2024-01-26T10:30:00Z",
    "requestId": "req_123456789"
  },
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Title is required",
      "field": "title"
    }
  ]
}
```

## 2. Authentication Endpoints

### 2.1 Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://avatar.url"
    }
  }
}
```

### 2.2 SSO Login
```http
POST /auth/sso/initiate
```

**Request Body:**
```json
{
  "provider": "okta",
  "redirectUri": "https://app.prdtool.com/auth/callback"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://sso.provider.com/auth?...",
    "state": "random_state_token"
  }
}
```

### 2.3 Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 3. Organization Endpoints

### 3.1 Get Organizations
```http
GET /organizations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "org_123",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "role": "admin",
      "settings": {
        "aiModel": "gpt-4",
        "defaultTemplate": "standard"
      }
    }
  ]
}
```

### 3.2 Create Organization
```http
POST /organizations
```

**Request Body:**
```json
{
  "name": "New Organization",
  "slug": "new-org"
}
```

## 4. Project Endpoints

### 4.1 Get Projects
```http
GET /projects?organizationId=org_123&page=1&limit=20
```

**Query Parameters:**
- `organizationId` (required): Organization ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search term
- `archived` (optional): Include archived projects

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "proj_123",
        "name": "Mobile App",
        "slug": "mobile-app",
        "description": "iOS and Android mobile application",
        "prdCount": 15,
        "lastActivity": "2024-01-26T10:30:00Z",
        "isArchived": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### 4.2 Create Project
```http
POST /projects
```

**Request Body:**
```json
{
  "organizationId": "org_123",
  "name": "New Project",
  "slug": "new-project",
  "description": "Project description"
}
```

### 4.3 Get Project Details
```http
GET /projects/{projectId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "proj_123",
    "name": "Mobile App",
    "slug": "mobile-app",
    "description": "iOS and Android mobile application",
    "settings": {
      "gitRepo": "https://github.com/org/mobile-app",
      "defaultBranch": "main"
    },
    "members": [
      {
        "userId": "user_123",
        "name": "John Doe",
        "role": "owner",
        "joinedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "stats": {
      "prdCount": 15,
      "activeContributors": 5,
      "lastActivity": "2024-01-26T10:30:00Z"
    }
  }
}
```

## 5. PRD Endpoints

### 5.1 Get PRDs
```http
GET /prds?projectId=proj_123&status=draft&page=1&limit=20
```

**Query Parameters:**
- `projectId` (required): Project ID
- `status` (optional): Filter by status (draft, review, approved)
- `search` (optional): Search in title and content
- `createdBy` (optional): Filter by creator
- `page`, `limit`: Pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "prds": [
      {
        "id": "prd_123",
        "title": "User Authentication",
        "slug": "user-authentication",
        "status": "draft",
        "currentVersion": "1.2.0",
        "createdBy": {
          "id": "user_123",
          "name": "John Doe",
          "avatar": "https://avatar.url"
        },
        "lastModified": "2024-01-26T10:30:00Z",
        "collaborators": [
          {
            "id": "user_456",
            "name": "Sarah Smith",
            "status": "viewing"
          }
        ],
        "stats": {
          "versionCount": 5,
          "commentCount": 12,
          "approvalStatus": "pending"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### 5.2 Create PRD
```http
POST /prds
```

**Request Body:**
```json
{
  "projectId": "proj_123",
  "title": "New Feature PRD",
  "templateId": "tmpl_123",
  "aiPrompt": "Create a PRD for user authentication with SSO support"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prd_123",
    "title": "New Feature PRD",
    "slug": "new-feature-prd",
    "content": "# New Feature PRD\n\n## Executive Summary\n...",
    "status": "draft",
    "currentVersion": "1.0.0",
    "createdAt": "2024-01-26T10:30:00Z"
  }
}
```

### 5.3 Get PRD Details
```http
GET /prds/{prdId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prd_123",
    "projectId": "proj_123",
    "title": "User Authentication",
    "slug": "user-authentication",
    "content": "# User Authentication PRD\n\n## Executive Summary\n...",
    "metadata": {
      "sections": [
        {
          "id": "summary",
          "title": "Executive Summary",
          "type": "text"
        },
        {
          "id": "problem",
          "title": "Problem Statement",
          "type": "text"
        }
      ],
      "tags": ["authentication", "security"],
      "estimatedEffort": "large"
    },
    "status": "draft",
    "currentVersion": "1.2.0",
    "templateId": "tmpl_123",
    "createdBy": "user_123",
    "createdAt": "2024-01-20T10:30:00Z",
    "updatedAt": "2024-01-26T10:30:00Z",
    "approvedBy": null,
    "approvedAt": null
  }
}
```

### 5.4 Update PRD
```http
PATCH /prds/{prdId}
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "# Updated content...",
  "metadata": {
    "tags": ["authentication", "security", "sso"]
  }
}
```

### 5.5 Delete PRD
```http
DELETE /prds/{prdId}
```

## 6. Version Endpoints

### 6.1 Get PRD Versions
```http
GET /prds/{prdId}/versions?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "ver_123",
        "version": "1.2.0",
        "changelog": "Added OAuth2 support and security requirements",
        "content": "# User Authentication PRD v1.2.0\n...",
        "commitHash": "abc123def456",
        "createdBy": {
          "id": "user_123",
          "name": "John Doe"
        },
        "createdAt": "2024-01-26T10:30:00Z",
        "changes": [
          {
            "type": "added",
            "section": "Technical Requirements",
            "description": "OAuth2 flow specification"
          }
        ]
      }
    ]
  }
}
```

### 6.2 Create Version
```http
POST /prds/{prdId}/versions
```

**Request Body:**
```json
{
  "changelog": "Added new user stories and acceptance criteria",
  "versionType": "minor"
}
```

### 6.3 Compare Versions
```http
GET /prds/{prdId}/versions/compare?from=1.1.0&to=1.2.0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fromVersion": "1.1.0",
    "toVersion": "1.2.0",
    "diff": {
      "additions": [
        {
          "line": 45,
          "content": "+ OAuth2 authorization code flow"
        }
      ],
      "deletions": [
        {
          "line": 23,
          "content": "- Basic authentication only"
        }
      ],
      "modifications": [
        {
          "line": 67,
          "before": "Simple login form",
          "after": "SSO integration with login form fallback"
        }
      ]
    },
    "summary": {
      "totalChanges": 12,
      "additions": 8,
      "deletions": 2,
      "modifications": 2
    }
  }
}
```

## 7. AI Endpoints

### 7.1 Generate Content
```http
POST /ai/generate
```

**Request Body:**
```json
{
  "prdId": "prd_123",
  "prompt": "Add technical requirements for OAuth2 integration",
  "section": "technical-requirements",
  "context": {
    "previousContent": "Current technical requirements...",
    "relatedSections": ["security", "user-stories"]
  }
}
```

**Response (Server-Sent Events):**
```
data: {"type": "start", "jobId": "job_123"}

data: {"type": "chunk", "content": "## OAuth2 Integration\n\n"}

data: {"type": "chunk", "content": "The system shall support OAuth2"}

data: {"type": "complete", "totalTokens": 150}
```

### 7.2 Generate Diagram
```http
POST /ai/diagram
```

**Request Body:**
```json
{
  "description": "Create a sequence diagram for user login flow",
  "diagramType": "sequence",
  "context": "User authentication with SSO support"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mermaidCode": "sequenceDiagram\n    participant U as User\n    participant A as App\n    participant S as SSO\n    U->>A: Login\n    A->>S: Auth Request\n    S->>U: Login Form\n    U->>S: Credentials\n    S->>A: Token\n    A->>U: Success",
    "renderedUrl": "https://cdn.prdtool.com/diagrams/abc123.svg"
  }
}
```

### 7.3 Get AI Suggestions
```http
GET /ai/suggestions/{prdId}?section=user-stories
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "sug_123",
        "type": "improvement",
        "section": "user-stories",
        "title": "Add accessibility requirements",
        "description": "Consider adding user stories for screen reader support",
        "priority": "medium",
        "suggestion": "As a visually impaired user, I want screen reader support so I can navigate the authentication flow independently."
      }
    ]
  }
}
```

## 8. Collaboration Endpoints

### 8.1 Get Active Sessions
```http
GET /prds/{prdId}/sessions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "userId": "user_123",
        "userName": "John Doe",
        "avatar": "https://avatar.url",
        "status": "editing",
        "cursorPosition": 1245,
        "selection": {
          "start": 1200,
          "end": 1250
        },
        "lastActivity": "2024-01-26T10:30:00Z",
        "color": "#8B5CF6"
      }
    ]
  }
}
```

### 8.2 Join Session
```http
POST /prds/{prdId}/sessions
```

**Request Body:**
```json
{
  "status": "viewing"
}
```

### 8.3 Update Presence
```http
PATCH /prds/{prdId}/sessions
```

**Request Body:**
```json
{
  "status": "editing",
  "cursorPosition": 1245,
  "selection": {
    "start": 1200,
    "end": 1250
  }
}
```

### 8.4 Leave Session
```http
DELETE /prds/{prdId}/sessions
```

## 9. Integration Endpoints

### 9.1 Jira Integration
```http
POST /integrations/jira/sync
```

**Request Body:**
```json
{
  "prdId": "prd_123",
  "projectKey": "PROJ",
  "issueType": "Story",
  "syncDirection": "bidirectional"
}
```

### 9.2 Mattermost Integration
```http
POST /integrations/mattermost/configure
```

**Request Body:**
```json
{
  "serverUrl": "https://mattermost.company.com",
  "accessToken": "token_123",
  "channelId": "channel_456",
  "notificationTypes": ["prd_created", "prd_approved", "comment_added"]
}
```

### 9.3 Craft.io Integration
```http
POST /integrations/craft/link
```

**Request Body:**
```json
{
  "prdId": "prd_123",
  "initiativeId": "init_456",
  "syncProgress": true,
  "syncMetrics": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "linkId": "link_123",
    "initiative": {
      "id": "init_456",
      "title": "User Authentication Initiative",
      "status": "in_progress",
      "objectives": ["Improve security", "Reduce friction"]
    }
  }
}
```

### 9.4 Get Craft.io Suggestions
```http
GET /integrations/craft/suggestions?keywords=authentication,security
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "init_456",
        "title": "Security Enhancement Initiative",
        "description": "Improve authentication and authorization",
        "confidence": 0.89,
        "alignment": "high"
      }
    ]
  }
}
```

### 9.5 Export PRD
```http
POST /prds/{prdId}/export
```

**Request Body:**
```json
{
  "format": "pdf",
  "template": "corporate",
  "options": {
    "includeDiagrams": true,
    "includeComments": false,
    "watermark": "CONFIDENTIAL"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exportId": "exp_123",
    "downloadUrl": "https://api.prdtool.com/downloads/exp_123",
    "expiresAt": "2024-01-27T10:30:00Z"
  }
}
```

## 10. Search Endpoints

### 10.1 Search PRDs
```http
GET /search/prds?q=authentication&organizationId=org_123&filters[status]=draft
```

**Query Parameters:**
- `q`: Search query
- `organizationId`: Scope to organization
- `projectId`: Scope to project
- `filters[status]`: Filter by status
- `filters[createdBy]`: Filter by creator
- `sort`: Sort by (relevance, created_at, updated_at)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "prd_123",
        "title": "User Authentication",
        "snippet": "...OAuth2 authentication with SSO support...",
        "score": 0.95,
        "highlights": [
          "OAuth2 <mark>authentication</mark> with SSO"
        ],
        "project": {
          "id": "proj_123",
          "name": "Mobile App"
        }
      }
    ],
    "total": 15,
    "facets": {
      "status": {
        "draft": 8,
        "review": 4,
        "approved": 3
      },
      "project": {
        "Mobile App": 10,
        "Web Platform": 5
      }
    }
  }
}
```

## 11. Analytics Endpoints

### 11.1 Get PRD Analytics
```http
GET /analytics/prds/{prdId}?period=30d
```

**Response:**
```json
{
  "success": true,
  "data": {
    "views": {
      "total": 245,
      "unique": 18,
      "trend": "+12%"
    },
    "edits": {
      "total": 67,
      "contributors": 5
    },
    "aiUsage": {
      "prompts": 23,
      "tokensGenerated": 15000
    },
    "collaboration": {
      "comments": 12,
      "approvals": 3
    },
    "timeline": [
      {
        "date": "2024-01-26",
        "views": 15,
        "edits": 3
      }
    ]
  }
}
```

## 12. Error Codes

| Code | Description |
|------|-------------|
| `AUTHENTICATION_REQUIRED` | Valid authentication token required |
| `AUTHORIZATION_FAILED` | Insufficient permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource does not exist |
| `RESOURCE_CONFLICT` | Resource conflict (e.g., duplicate slug) |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `AI_SERVICE_UNAVAILABLE` | AI service temporarily unavailable |
| `GIT_OPERATION_FAILED` | Git operation failed |
| `INTEGRATION_ERROR` | External integration error |
| `INTERNAL_ERROR` | Unexpected server error |