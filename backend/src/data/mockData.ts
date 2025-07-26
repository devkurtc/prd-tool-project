export interface User {
  id: string
  email: string
  name: string
  organization: string
  createdAt: string
  preferences: {
    theme: 'light' | 'dark' | 'system'
    notifications: {
      email: boolean
      push: boolean
      mentions: boolean
    }
    editor: {
      fontSize: number
      tabSize: number
      wordWrap: boolean
    }
  }
  stats: {
    prdsCreated: number
    collaborations: number
    aiInteractions: number
  }
}

export interface PRD {
  id: string
  title: string
  description: string
  content: string
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED'
  isPublic: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    email: string
  }
  collaborators: Array<{
    id: string
    name: string
    email: string
    role: 'VIEWER' | 'EDITOR' | 'ADMIN'
  }>
  versions: Array<{
    id: string
    version: number
    content: string
    createdAt: string
    author: string
  }>
}

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    organization: 'TechCorp Inc',
    createdAt: '2024-01-15T10:00:00Z',
    preferences: {
      theme: 'system',
      notifications: {
        email: true,
        push: false,
        mentions: true
      },
      editor: {
        fontSize: 14,
        tabSize: 2,
        wordWrap: true
      }
    },
    stats: {
      prdsCreated: 12,
      collaborations: 25,
      aiInteractions: 89
    }
  },
  {
    id: 'user-2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith',
    organization: 'InnovateLabs',
    createdAt: '2024-01-10T14:30:00Z',
    preferences: {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        mentions: true
      },
      editor: {
        fontSize: 16,
        tabSize: 4,
        wordWrap: false
      }
    },
    stats: {
      prdsCreated: 8,
      collaborations: 15,
      aiInteractions: 45
    }
  }
]

export const mockPRDs: PRD[] = [
  {
    id: 'prd-1',
    title: 'Mobile App Authentication System',
    description: 'Comprehensive authentication system for our mobile application including social logins and multi-factor authentication.',
    content: `# Mobile App Authentication System

## Problem Statement
Users need a secure, user-friendly way to authenticate with our mobile application. Current authentication is basic and lacks modern security features.

## Solution Overview
Implement a comprehensive authentication system with:
- Email/password authentication
- Social login integration (Google, Apple, Facebook)
- Multi-factor authentication (SMS, TOTP)
- Biometric authentication support

## User Stories

### Epic 1: Basic Authentication
- **US-001**: As a user, I want to create an account with email and password
- **US-002**: As a user, I want to log in with my credentials
- **US-003**: As a user, I want to reset my password if I forget it

### Epic 2: Social Authentication
- **US-004**: As a user, I want to sign up/login with Google
- **US-005**: As a user, I want to sign up/login with Apple ID
- **US-006**: As a user, I want to sign up/login with Facebook

### Epic 3: Enhanced Security
- **US-007**: As a user, I want to enable 2FA for additional security
- **US-008**: As a user, I want to use biometric authentication
- **US-009**: As a security admin, I want to enforce strong password policies

## Technical Requirements

### Frontend Requirements
- React Native compatible authentication flows
- Secure token storage using Keychain/Keystore
- Biometric prompt integration
- Social SDK integration

### Backend Requirements
- JWT token management with refresh tokens
- OAuth 2.0 integration for social providers
- Rate limiting for authentication endpoints
- Audit logging for security events

### Security Requirements
- Passwords must be hashed using bcrypt
- JWT tokens must be signed and verified
- All authentication endpoints must use HTTPS
- Session management with proper timeout

## Success Metrics
- **Security**: Zero successful brute force attacks
- **User Experience**: 90% login success rate
- **Adoption**: 60% of users enable 2FA within 30 days
- **Performance**: Authentication flow completes in <3 seconds

## Implementation Timeline
- **Week 1-2**: Basic email/password authentication
- **Week 3-4**: Social login integration
- **Week 5-6**: Multi-factor authentication
- **Week 7-8**: Biometric authentication and testing`,
    status: 'REVIEW',
    isPublic: false,
    tags: ['authentication', 'mobile', 'security', 'social-login'],
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-25T16:30:00Z',
    author: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john.doe@example.com'
    },
    collaborators: [
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'EDITOR'
      }
    ],
    versions: [
      {
        id: 'version-1',
        version: 1,
        content: 'Initial draft of authentication PRD',
        createdAt: '2024-01-20T09:00:00Z',
        author: 'John Doe'
      },
      {
        id: 'version-2',
        version: 2,
        content: 'Added social login requirements',
        createdAt: '2024-01-22T14:00:00Z',
        author: 'John Doe'
      },
      {
        id: 'version-3',
        version: 3,
        content: 'Enhanced security requirements with Jane feedback',
        createdAt: '2024-01-25T16:30:00Z',
        author: 'John Doe'
      }
    ]
  },
  {
    id: 'prd-2',
    title: 'AI-Powered Search Enhancement',
    description: 'Implement AI-powered search capabilities to improve user experience and search accuracy.',
    content: `# AI-Powered Search Enhancement

## Problem Statement
Current search functionality is limited to exact keyword matching, resulting in poor user experience and low search success rates.

## Solution Overview
Implement AI-powered search with:
- Natural language query processing
- Semantic search capabilities
- Intelligent auto-suggestions
- Personalized search results

## User Stories

### Epic 1: Smart Search
- **US-010**: As a user, I want to search using natural language
- **US-011**: As a user, I want relevant results even with typos
- **US-012**: As a user, I want search suggestions as I type

### Epic 2: Personalization
- **US-013**: As a user, I want personalized search results
- **US-014**: As a user, I want to see my search history
- **US-015**: As a user, I want saved search filters

## Technical Requirements

### AI Integration
- OpenAI/Anthropic API for query processing
- Vector embeddings for semantic search
- Machine learning model for ranking
- Real-time suggestion engine

### Performance Requirements
- Search results in <500ms
- Auto-suggestions in <100ms
- 99.9% uptime for search service
- Support for 1000 concurrent searches

## Success Metrics
- **Relevance**: 85% user satisfaction with results
- **Speed**: 95% of searches complete in <500ms
- **Usage**: 40% increase in search usage
- **Conversion**: 25% increase in successful searches`,
    status: 'DRAFT',
    isPublic: true,
    tags: ['ai', 'search', 'ml', 'user-experience'],
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-01-24T10:15:00Z',
    author: {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    },
    collaborators: [],
    versions: [
      {
        id: 'version-4',
        version: 1,
        content: 'Initial AI search PRD draft',
        createdAt: '2024-01-18T11:00:00Z',
        author: 'Jane Smith'
      }
    ]
  },
  {
    id: 'prd-3',
    title: 'Real-Time Collaboration Features',
    description: 'Enable real-time collaborative editing for documents with conflict resolution.',
    content: `# Real-Time Collaboration Features

## Problem Statement
Users cannot collaborate on documents simultaneously, leading to version conflicts and inefficient workflows.

## Solution Overview
Implement real-time collaboration with:
- Live cursor tracking
- Operational transforms for conflict resolution
- Real-time presence indicators
- Comment and suggestion system

## Technical Requirements
- WebSocket-based real-time communication
- CRDT (Conflict-free Replicated Data Types)
- Operational Transform algorithms
- Presence awareness system

## Success Metrics
- **Collaboration**: 90% conflict-free editing sessions
- **Performance**: <200ms latency for operations
- **Adoption**: 70% of teams use collaborative features`,
    status: 'APPROVED',
    isPublic: false,
    tags: ['collaboration', 'real-time', 'websockets'],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-26T12:00:00Z',
    author: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john.doe@example.com'
    },
    collaborators: [
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'ADMIN'
      }
    ],
    versions: []
  }
]

// Helper functions for mock data
export const getCurrentUser = (): User => mockUsers[0]

export const getPRDById = (id: string): PRD | undefined => {
  return mockPRDs.find(prd => prd.id === id)
}

export const getPRDsByUser = (userId: string): PRD[] => {
  return mockPRDs.filter(prd => 
    prd.author.id === userId || 
    prd.collaborators.some(c => c.id === userId)
  )
}

export const searchPRDs = (query: string, userId: string): PRD[] => {
  const userPRDs = getPRDsByUser(userId)
  if (!query) return userPRDs
  
  const searchTerm = query.toLowerCase()
  return userPRDs.filter(prd => 
    prd.title.toLowerCase().includes(searchTerm) ||
    prd.description.toLowerCase().includes(searchTerm) ||
    prd.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    prd.content.toLowerCase().includes(searchTerm)
  )
}