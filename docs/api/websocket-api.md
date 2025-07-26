# WebSocket API Documentation - PRD Tool

## 1. WebSocket Overview

### 1.1 Connection Details
- **Endpoint**: `wss://api.prdtool.com/ws`
- **Protocol**: Socket.io v4
- **Authentication**: JWT token in connection query
- **Namespaces**: `/prds`, `/notifications`

### 1.2 Connection Example
```javascript
import { io } from 'socket.io-client'

const socket = io('wss://api.prdtool.com', {
  auth: {
    token: 'your-jwt-token'
  },
  transports: ['websocket']
})
```

### 1.3 Connection States
```javascript
socket.on('connect', () => {
  console.log('Connected:', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason)
})

socket.on('connect_error', (error) => {
  console.log('Connection error:', error)
})
```

## 2. PRD Collaboration Events

### 2.1 Join PRD Session
**Client to Server:**
```javascript
socket.emit('join-prd', {
  prdId: 'prd_123',
  mode: 'edit' // 'view' | 'edit'
})
```

**Server Response:**
```javascript
socket.on('joined-prd', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   initialState: {
  //     content: 'PRD content...',
  //     version: '1.2.0',
  //     stateVector: [1, 2, 3, 4]
  //   },
  //   activeUsers: [
  //     {
  //       userId: 'user_456',
  //       name: 'Sarah Smith',
  //       avatar: 'https://avatar.url',
  //       status: 'viewing',
  //       color: '#8B5CF6'
  //     }
  //   ]
  // }
})
```

### 2.2 Leave PRD Session
**Client to Server:**
```javascript
socket.emit('leave-prd', {
  prdId: 'prd_123'
})
```

### 2.3 Real-time Content Updates
**Client to Server (Send Update):**
```javascript
socket.emit('content-update', {
  prdId: 'prd_123',
  operation: {
    type: 'insert',
    position: 1245,
    content: 'New text content',
    timestamp: Date.now()
  },
  stateVector: [1, 2, 3, 5] // CRDT state vector
})
```

**Server to Client (Receive Update):**
```javascript
socket.on('content-update', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   userId: 'user_456',
  //   userName: 'Sarah Smith',
  //   operation: {
  //     type: 'insert',
  //     position: 1245,
  //     content: 'New text content',
  //     timestamp: 1706265030000
  //   },
  //   stateVector: [1, 2, 3, 5]
  // }
})
```

### 2.4 CRDT Synchronization
**Request State Sync:**
```javascript
socket.emit('sync-request', {
  prdId: 'prd_123',
  stateVector: [1, 2, 3, 4]
})
```

**Receive State Sync:**
```javascript
socket.on('sync-response', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   missingUpdates: [
  //     {
  //       operation: { type: 'insert', position: 100, content: 'text' },
  //       timestamp: 1706265030000,
  //       userId: 'user_456'
  //     }
  //   ],
  //   stateVector: [1, 2, 3, 5]
  // }
})
```

## 3. Presence and Awareness Events

### 3.1 Update Presence
**Client to Server:**
```javascript
socket.emit('presence-update', {
  prdId: 'prd_123',
  status: 'editing', // 'viewing' | 'editing' | 'ai-prompting'
  cursorPosition: 1245,
  selection: {
    start: 1200,
    end: 1250
  }
})
```

### 3.2 Receive Presence Updates
**Server to Client:**
```javascript
socket.on('presence-update', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   userId: 'user_456',
  //   userName: 'Sarah Smith',
  //   avatar: 'https://avatar.url',
  //   status: 'editing',
  //   cursorPosition: 1245,
  //   selection: {
  //     start: 1200,
  //     end: 1250
  //   },
  //   color: '#8B5CF6',
  //   timestamp: 1706265030000
  // }
})
```

### 3.3 User Joined/Left Events
**User Joined:**
```javascript
socket.on('user-joined', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   user: {
  //     userId: 'user_789',
  //     name: 'Mike Johnson',
  //     avatar: 'https://avatar.url',
  //     status: 'viewing',
  //     color: '#EC4899'
  //   }
  // }
})
```

**User Left:**
```javascript
socket.on('user-left', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   userId: 'user_789',
  //   name: 'Mike Johnson'
  // }
})
```

## 4. AI Integration Events

### 4.1 AI Prompt Submission
**Client to Server:**
```javascript
socket.emit('ai-prompt', {
  prdId: 'prd_123',
  prompt: 'Add technical requirements for OAuth2 integration',
  section: 'technical-requirements',
  context: {
    currentContent: 'Existing content...',
    selectedText: 'OAuth2',
    cursorPosition: 1245
  }
})
```

**Server Response (Job Created):**
```javascript
socket.on('ai-job-created', (data) => {
  console.log(data)
  // {
  //   jobId: 'job_123',
  //   prdId: 'prd_123',
  //   userId: 'user_123',
  //   status: 'queued',
  //   estimatedTime: 30 // seconds
  // }
})
```

### 4.2 AI Streaming Response
**Streaming Started:**
```javascript
socket.on('ai-stream-start', (data) => {
  console.log(data)
  // {
  //   jobId: 'job_123',
  //   prdId: 'prd_123',
  //   userId: 'user_123',
  //   section: 'technical-requirements'
  // }
})
```

**Streaming Chunks:**
```javascript
socket.on('ai-stream-chunk', (data) => {
  console.log(data)
  // {
  //   jobId: 'job_123',
  //   chunk: '## OAuth2 Integration\n\nThe system shall support',
  //   position: 1245,
  //   isComplete: false
  // }
})
```

**Streaming Complete:**
```javascript
socket.on('ai-stream-complete', (data) => {
  console.log(data)
  // {
  //   jobId: 'job_123',
  //   fullResponse: 'Complete AI generated content...',
  //   tokensUsed: 150,
  //   duration: 25000, // milliseconds
  //   suggestions: [
  //     {
  //       type: 'diagram',
  //       description: 'Create sequence diagram for OAuth flow'
  //     }
  //   ]
  // }
})
```

### 4.3 AI Error Events
```javascript
socket.on('ai-error', (data) => {
  console.log(data)
  // {
  //   jobId: 'job_123',
  //   error: {
  //     code: 'RATE_LIMIT_EXCEEDED',
  //     message: 'AI request limit exceeded for this hour',
  //     retryAfter: 1800 // seconds
  //   }
  // }
})
```

### 4.4 AI Suggestion Events
```javascript
socket.on('ai-suggestion', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   suggestion: {
  //     type: 'improvement',
  //     section: 'user-stories',
  //     title: 'Consider edge cases',
  //     description: 'Add user stories for error scenarios',
  //     confidence: 0.85
  //   }
  // }
})
```

## 5. Version Control Events

### 5.1 Version Creation
**Trigger Version Creation:**
```javascript
socket.emit('create-version', {
  prdId: 'prd_123',
  changelog: 'Added OAuth2 technical requirements',
  versionType: 'minor' // 'major' | 'minor' | 'patch'
})
```

**Version Created:**
```javascript
socket.on('version-created', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   version: {
  //     id: 'ver_123',
  //     version: '1.3.0',
  //     changelog: 'Added OAuth2 technical requirements',
  //     commitHash: 'abc123def456',
  //     createdBy: {
  //       id: 'user_123',
  //       name: 'John Doe'
  //     },
  //     createdAt: '2024-01-26T10:30:00Z'
  //   }
  // }
})
```

### 5.2 Auto-save Events
**Auto-save Triggered:**
```javascript
socket.on('auto-save-start', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   changesSince: '2024-01-26T10:25:00Z'
  // }
})
```

**Auto-save Completed:**
```javascript
socket.on('auto-save-complete', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   savedAt: '2024-01-26T10:30:00Z',
  //   nextSaveIn: 300 // seconds
  // }
})
```

### 5.3 Conflict Detection
```javascript
socket.on('conflict-detected', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   conflicts: [
  //     {
  //       position: 1245,
  //       yourChange: 'Your content',
  //       theirChange: 'Other user content',
  //       conflictId: 'conflict_123'
  //     }
  //   ]
  // }
})
```

**Resolve Conflict:**
```javascript
socket.emit('resolve-conflict', {
  prdId: 'prd_123',
  conflictId: 'conflict_123',
  resolution: 'merge', // 'yours' | 'theirs' | 'merge'
  mergedContent: 'Final merged content'
})
```

## 6. Comment and Annotation Events

### 6.1 Add Comment
**Client to Server:**
```javascript
socket.emit('add-comment', {
  prdId: 'prd_123',
  position: 1245,
  content: 'Should we consider rate limiting here?',
  selection: {
    start: 1200,
    end: 1250,
    text: 'OAuth2 endpoint'
  }
})
```

**Server to Client:**
```javascript
socket.on('comment-added', (data) => {
  console.log(data)
  // {
  //   commentId: 'comment_123',
  //   prdId: 'prd_123',
  //   author: {
  //     id: 'user_456',
  //     name: 'Sarah Smith',
  //     avatar: 'https://avatar.url'
  //   },
  //   position: 1245,
  //   content: 'Should we consider rate limiting here?',
  //   selection: {
  //     start: 1200,
  //     end: 1250,
  //     text: 'OAuth2 endpoint'
  //   },
  //   createdAt: '2024-01-26T10:30:00Z'
  // }
})
```

### 6.2 Reply to Comment
```javascript
socket.emit('reply-comment', {
  commentId: 'comment_123',
  content: 'Yes, 100 requests per minute should be sufficient'
})

socket.on('comment-replied', (data) => {
  console.log(data)
  // {
  //   commentId: 'comment_123',
  //   reply: {
  //     id: 'reply_123',
  //     author: {
  //       id: 'user_123',
  //       name: 'John Doe'
  //     },
  //     content: 'Yes, 100 requests per minute should be sufficient',
  //     createdAt: '2024-01-26T10:32:00Z'
  //   }
  // }
})
```

### 6.3 Resolve Comment
```javascript
socket.emit('resolve-comment', {
  commentId: 'comment_123'
})

socket.on('comment-resolved', (data) => {
  console.log(data)
  // {
  //   commentId: 'comment_123',
  //   resolvedBy: {
  //     id: 'user_123',
  //     name: 'John Doe'
  //   },
  //   resolvedAt: '2024-01-26T10:35:00Z'
  // }
})
```

## 7. Notification Events

### 7.1 Real-time Notifications
```javascript
socket.on('notification', (data) => {
  console.log(data)
  // {
  //   id: 'notif_123',
  //   type: 'prd_approved',
  //   title: 'PRD Approved',
  //   message: 'Your PRD "User Authentication" has been approved',
  //   data: {
  //     prdId: 'prd_123',
  //     approver: 'Sarah Smith'
  //   },
  //   timestamp: '2024-01-26T10:30:00Z'
  // }
})
```

### 7.2 Activity Feed Updates
```javascript
socket.on('activity-update', (data) => {
  console.log(data)
  // {
  //   organizationId: 'org_123',
  //   activity: {
  //     id: 'activity_123',
  //     type: 'prd_created',
  //     actor: {
  //       id: 'user_456',
  //       name: 'Sarah Smith'
  //     },
  //     object: {
  //       type: 'prd',
  //       id: 'prd_123',
  //       title: 'New Feature PRD'
  //     },
  //     timestamp: '2024-01-26T10:30:00Z'
  //   }
  // }
})
```

## 8. Integration Events

### 8.1 Jira Sync Events
```javascript
socket.on('jira-sync-start', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   projectKey: 'PROJ',
  //   syncType: 'export' // 'export' | 'import' | 'bidirectional'
  // }
})

socket.on('jira-sync-complete', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   result: {
  //     created: 5,
  //     updated: 2,
  //     errors: 0,
  //     issues: [
  //       {
  //         key: 'PROJ-123',
  //         title: 'User Story 1',
  //         url: 'https://jira.company.com/browse/PROJ-123'
  //       }
  //     ]
  //   }
  // }
})
```

### 8.2 Git Events
```javascript
socket.on('git-commit', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   commit: {
  //     hash: 'abc123def456',
  //     message: 'Update PRD with OAuth2 requirements',
  //     author: 'John Doe',
  //     timestamp: '2024-01-26T10:30:00Z',
  //     files: ['prd_123.md']
  //   }
  // }
})
```

### 8.3 Mattermost Integration Events
```javascript
socket.on('mattermost-message-sent', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   channel: 'product-team',
  //   messageId: 'msg_123',
  //   type: 'prd_approved',
  //   timestamp: '2024-01-26T10:30:00Z'
  // }
})

socket.on('mattermost-connection-status', (data) => {
  console.log(data)
  // {
  //   status: 'connected', // 'connected' | 'disconnected' | 'error'
  //   serverUrl: 'https://mattermost.company.com',
  //   error: null
  // }
})
```

### 8.4 Craft.io Integration Events
```javascript
socket.on('craft-initiative-linked', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   initiative: {
  //     id: 'init_456',
  //     title: 'User Authentication Initiative',
  //     status: 'in_progress',
  //     objectives: ['Improve security', 'Reduce friction']
  //   },
  //   linkType: 'automatic' // 'manual' | 'automatic' | 'suggested'
  // }
})

socket.on('craft-initiative-updated', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   initiative: {
  //     id: 'init_456',
  //     changes: {
  //       status: { from: 'planned', to: 'in_progress' },
  //       objectives: { added: ['Reduce customer churn'] }
  //     }
  //   },
  //   affectedPRDs: ['prd_123', 'prd_456']
  // }
})

socket.on('craft-alignment-check', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   alignment: {
  //     score: 0.85,
  //     status: 'aligned', // 'aligned' | 'misaligned' | 'review_needed'
  //     suggestions: [
  //       'Consider adding KPI for user retention',
  //       'Align timeline with Q2 objectives'
  //     ]
  //   }
  // }
})
```

## 9. Error Handling

### 9.1 WebSocket Error Events
```javascript
socket.on('error', (error) => {
  console.log(error)
  // {
  //   code: 'AUTHENTICATION_FAILED',
  //   message: 'Invalid or expired token',
  //   timestamp: '2024-01-26T10:30:00Z'
  // }
})
```

### 9.2 Rate Limiting
```javascript
socket.on('rate-limit', (data) => {
  console.log(data)
  // {
  //   message: 'Rate limit exceeded',
  //   retryAfter: 60, // seconds
  //   limit: 100,
  //   remaining: 0,
  //   resetTime: '2024-01-26T11:00:00Z'
  // }
})
```

## 10. Connection Management

### 10.1 Heartbeat/Ping
```javascript
// Automatic ping/pong for connection health
socket.on('ping', () => {
  console.log('Ping received')
})

// Client can also send ping
socket.emit('ping')
socket.on('pong', () => {
  console.log('Pong received')
})
```

### 10.2 Reconnection Logic
```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts')
  
  // Re-join all active PRD sessions
  activeSessionIds.forEach(prdId => {
    socket.emit('join-prd', { prdId, mode: 'edit' })
  })
})

socket.on('reconnect_error', (error) => {
  console.log('Reconnection failed:', error)
})
```

### 10.3 Graceful Shutdown
```javascript
window.addEventListener('beforeunload', () => {
  // Leave all sessions gracefully
  activeSessionIds.forEach(prdId => {
    socket.emit('leave-prd', { prdId })
  })
  
  socket.disconnect()
})
```

## 11. Event Namespaces

### 11.1 PRD Namespace
```javascript
const prdSocket = io('/prds', {
  auth: { token: 'jwt-token' }
})

// All PRD-related events use this namespace
prdSocket.emit('join-prd', { prdId: 'prd_123' })
```

### 11.2 Notifications Namespace
```javascript
const notificationSocket = io('/notifications', {
  auth: { token: 'jwt-token' }
})

// Subscribe to organization notifications
notificationSocket.emit('subscribe', {
  organizationId: 'org_123'
})
```

## 12. Event Batching

For high-frequency events, the server may batch updates:

```javascript
socket.on('batch-update', (data) => {
  console.log(data)
  // {
  //   prdId: 'prd_123',
  //   updates: [
  //     { type: 'presence-update', userId: 'user_456', ... },
  //     { type: 'content-update', operation: { ... } },
  //     { type: 'presence-update', userId: 'user_789', ... }
  //   ],
  //   batchId: 'batch_123',
  //   timestamp: '2024-01-26T10:30:00Z'
  // }
})
```