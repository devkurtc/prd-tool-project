# Enhanced WebSocket API Documentation - PRD Tool

## 1. WebSocket-First Architecture

### 1.1 Connection Overview
- **Primary URL**: `wss://api.prdtool.com/ws`
- **Authentication**: JWT token via query parameter or Authorization header
- **Protocol**: Socket.io with custom events
- **Fallback**: Long polling for older browsers

### 1.2 Connection Flow
```typescript
// Client connection
const socket = io('wss://api.prdtool.com/ws', {
  auth: {
    token: 'jwt_token_here'
  },
  transports: ['websocket', 'polling']
});
```

## 2. Real-Time Document Editing

### 2.1 Document Session Management

#### Join Document Session
```typescript
// Client -> Server
socket.emit('document:join', {
  prdId: 'prd_123',
  mode: 'edit', // 'view' | 'edit' | 'comment'
  lastKnownVersion: '1.2.0'
});

// Server -> Client
socket.on('document:joined', {
  prdId: 'prd_123',
  currentContent: 'markdown content...',
  version: '1.2.1',
  activeSessions: [
    {
      userId: 'user_456',
      userName: 'Sarah Smith',
      mode: 'edit',
      cursor: { line: 10, ch: 25 },
      selection: { start: { line: 10, ch: 20 }, end: { line: 10, ch: 30 } },
      color: '#8B5CF6'
    }
  ],
  vectorClock: { 'user_123': 5, 'user_456': 3 }
});
```

#### Leave Document Session
```typescript
// Client -> Server
socket.emit('document:leave', {
  prdId: 'prd_123'
});
```

### 2.2 CRDT Operations

#### Send Edit Operation
```typescript
// Client -> Server
socket.emit('operation:edit', {
  prdId: 'prd_123',
  operation: {
    type: 'insert',
    position: 245,
    content: 'New content here',
    vectorClock: { 'user_123': 6, 'user_456': 3 },
    attributes: { bold: true }
  }
});

// Server -> All Clients (except sender)
socket.broadcast.to(prdId).emit('operation:applied', {
  prdId: 'prd_123',
  operation: {
    userId: 'user_123',
    type: 'insert',
    position: 245,
    content: 'New content here',
    vectorClock: { 'user_123': 6, 'user_456': 3 },
    attributes: { bold: true }
  },
  newVectorClock: { 'user_123': 6, 'user_456': 3 }
});
```

#### Operation Types
```typescript
interface CRDTOperation {
  type: 'insert' | 'delete' | 'retain' | 'format';
  position: number;
  length?: number; // For delete/retain
  content?: string; // For insert
  attributes?: Record<string, any>; // For formatting
  vectorClock: Record<string, number>;
}
```

### 2.3 Presence and Cursors

#### Update Cursor Position
```typescript
// Client -> Server
socket.emit('presence:cursor', {
  prdId: 'prd_123',
  cursor: { line: 10, ch: 25 },
  selection: { 
    start: { line: 10, ch: 20 }, 
    end: { line: 10, ch: 30 } 
  }
});

// Server -> Other Clients
socket.broadcast.to(prdId).emit('presence:updated', {
  userId: 'user_123',
  cursor: { line: 10, ch: 25 },
  selection: { start: { line: 10, ch: 20 }, end: { line: 10, ch: 30 } },
  lastActivity: '2024-01-26T10:30:00Z'
});
```

#### User Status Updates
```typescript
// Client -> Server
socket.emit('presence:status', {
  prdId: 'prd_123',
  status: 'typing' | 'idle' | 'away'
});
```

## 3. AI Integration via WebSocket

### 3.1 AI Content Generation

#### Request AI Generation
```typescript
// Client -> Server
socket.emit('ai:generate', {
  prdId: 'prd_123',
  prompt: 'Add OAuth2 technical requirements',
  section: 'technical-requirements',
  context: {
    previousContent: 'Current requirements...',
    relatedSections: ['security', 'user-stories']
  },
  streamId: 'stream_123' // Client-generated ID
});

// Server -> Client (Stream start)
socket.on('ai:stream-start', {
  streamId: 'stream_123',
  estimatedTokens: 200
});

// Server -> Client (Content chunks)
socket.on('ai:stream-chunk', {
  streamId: 'stream_123',
  chunk: '## OAuth2 Integration\n\n',
  position: 0
});

socket.on('ai:stream-chunk', {
  streamId: 'stream_123',
  chunk: 'The system shall implement OAuth2',
  position: 25
});

// Server -> Client (Stream complete)
socket.on('ai:stream-complete', {
  streamId: 'stream_123',
  totalTokens: 156,
  content: 'Full generated content...',
  suggestedOperations: [
    {
      type: 'insert',
      position: 1245,
      content: 'Generated content here'
    }
  ]
});
```

#### AI Stream Management
```typescript
// Pause streaming
socket.emit('ai:stream-pause', { streamId: 'stream_123' });

// Resume streaming
socket.emit('ai:stream-resume', { streamId: 'stream_123' });

// Cancel streaming
socket.emit('ai:stream-cancel', { streamId: 'stream_123' });
```

### 3.2 AI Suggestions

#### Real-time Suggestions
```typescript
// Server -> Client (Proactive suggestions)
socket.on('ai:suggestion', {
  prdId: 'prd_123',
  suggestionId: 'sug_123',
  type: 'improvement',
  section: 'user-stories',
  title: 'Add accessibility requirements',
  description: 'Consider adding screen reader support',
  priority: 'medium',
  suggestedContent: 'As a visually impaired user...',
  position: 567
});

// Client -> Server (Apply suggestion)
socket.emit('ai:suggestion-apply', {
  suggestionId: 'sug_123',
  prdId: 'prd_123'
});

// Client -> Server (Dismiss suggestion)
socket.emit('ai:suggestion-dismiss', {
  suggestionId: 'sug_123',
  reason: 'not_relevant'
});
```

## 4. Collaboration Features

### 4.1 Comments and Annotations

#### Add Comment
```typescript
// Client -> Server
socket.emit('comment:add', {
  prdId: 'prd_123',
  content: 'This section needs clarification',
  position: { line: 15, ch: 0 },
  selection: { start: { line: 15, ch: 0 }, end: { line: 17, ch: 50 } },
  mentions: ['user_456']
});

// Server -> All Clients
socket.on('comment:added', {
  commentId: 'comment_123',
  prdId: 'prd_123',
  author: {
    id: 'user_123',
    name: 'John Doe',
    avatar: 'avatar_url'
  },
  content: 'This section needs clarification',
  position: { line: 15, ch: 0 },
  selection: { start: { line: 15, ch: 0 }, end: { line: 17, ch: 50 } },
  mentions: ['user_456'],
  createdAt: '2024-01-26T10:30:00Z'
});
```

### 4.2 Approval Workflow

#### Request Approval
```typescript
// Client -> Server
socket.emit('approval:request', {
  prdId: 'prd_123',
  version: '1.3.0',
  approvers: ['user_456', 'user_789'],
  message: 'Please review the OAuth2 requirements'
});

// Server -> Approvers
socket.to(approverIds).emit('approval:requested', {
  prdId: 'prd_123',
  version: '1.3.0',
  requester: {
    id: 'user_123',
    name: 'John Doe'
  },
  message: 'Please review the OAuth2 requirements'
});
```

## 5. Version Control Events

### 5.1 Version Management

#### Version Created
```typescript
// Server -> All Watchers
socket.on('version:created', {
  prdId: 'prd_123',
  version: '1.3.0',
  changelog: 'Added OAuth2 requirements',
  author: {
    id: 'user_123',
    name: 'John Doe'
  },
  commitHash: 'abc123def456',
  createdAt: '2024-01-26T10:30:00Z'
});
```

### 5.2 Conflict Resolution

#### Conflict Detection
```typescript
// Server -> Client
socket.on('conflict:detected', {
  prdId: 'prd_123',
  conflictId: 'conflict_123',
  operations: [
    {
      userId: 'user_123',
      operation: { type: 'insert', position: 100, content: 'Version A' }
    },
    {
      userId: 'user_456', 
      operation: { type: 'insert', position: 100, content: 'Version B' }
    }
  ],
  resolutionOptions: ['manual', 'auto', 'ai']
});

// Client -> Server (Resolve conflict)
socket.emit('conflict:resolve', {
  conflictId: 'conflict_123',
  resolution: 'manual',
  chosenOperations: ['operation_1'], // Keep user_123's version
  mergedContent: 'Final merged content'
});
```

## 6. Integration Events

### 6.1 External Sync Events

#### Jira Sync Status
```typescript
// Server -> Client
socket.on('integration:sync-status', {
  type: 'jira',
  prdId: 'prd_123',
  status: 'in_progress' | 'completed' | 'failed',
  progress: 75,
  message: 'Syncing 3 of 4 user stories'
});
```

### 6.2 Notification Relay

#### Chat Platform Notifications
```typescript
// Server -> Client
socket.on('notification:sent', {
  platform: 'mattermost',
  channel: 'product-team',
  message: 'PRD "User Authentication" has been updated',
  success: true
});
```

## 7. Performance and Monitoring

### 7.1 Performance Metrics

#### Real-time Performance Data
```typescript
// Server -> Client (Admin users only)
socket.on('metrics:realtime', {
  activeConnections: 245,
  operationsPerSecond: 12,
  averageLatency: 45, // milliseconds
  memoryUsage: 78.5, // percentage
  timestamp: '2024-01-26T10:30:00Z'
});
```

### 7.2 Health Status

#### System Health Updates
```typescript
// Server -> All Clients
socket.on('system:health', {
  status: 'healthy' | 'degraded' | 'down',
  services: {
    database: 'healthy',
    ai: 'degraded',
    git: 'healthy'
  },
  message: 'AI service experiencing high latency'
});
```

## 8. Error Handling

### 8.1 Error Events

#### Operation Errors
```typescript
// Server -> Client
socket.on('error:operation', {
  operation: 'document:edit',
  code: 'CONFLICT_DETECTED',
  message: 'Operation conflicts with recent changes',
  data: {
    conflictingOperation: { ... },
    suggestedResolution: 'retry_with_latest'
  }
});
```

### 8.2 Connection Recovery

#### Reconnection Handling
```typescript
// Client connection recovery
socket.on('connect', () => {
  // Rejoin all active sessions
  socket.emit('session:recover', {
    activeSessions: ['prd_123', 'prd_456'],
    lastVectorClocks: {
      'prd_123': { 'user_123': 15, 'user_456': 8 },
      'prd_456': { 'user_123': 5 }
    }
  });
});

// Server -> Client (Recovery response)
socket.on('session:recovered', {
  sessions: [
    {
      prdId: 'prd_123',
      missedOperations: [
        { type: 'insert', position: 100, content: 'New content' }
      ],
      currentVectorClock: { 'user_123': 15, 'user_456': 9 }
    }
  ]
});
```

## 9. Rate Limiting and Security

### 9.1 Rate Limiting
```typescript
// Server -> Client (Rate limit warning)
socket.on('rate_limit:warning', {
  endpoint: 'ai:generate',
  remaining: 5,
  resetAt: '2024-01-26T11:00:00Z'
});

// Server -> Client (Rate limit exceeded)
socket.on('rate_limit:exceeded', {
  endpoint: 'ai:generate',
  retryAfter: 300 // seconds
});
```

### 9.2 Security Events
```typescript
// Server -> Client (Security alert)
socket.on('security:alert', {
  type: 'suspicious_activity',
  message: 'Multiple failed authentication attempts detected',
  action: 'session_terminated'
});
```

## 10. Event Namespace Organization

### 10.1 Namespace Structure
```typescript
// Document operations
'document:join'
'document:leave'
'document:update'

// Real-time operations
'operation:edit'
'operation:applied'
'operation:conflict'

// Presence
'presence:cursor'
'presence:status'
'presence:updated'

// AI operations
'ai:generate'
'ai:stream-start'
'ai:stream-chunk'
'ai:stream-complete'
'ai:suggestion'

// Collaboration
'comment:add'
'comment:added'
'approval:request'
'approval:granted'

// Versioning
'version:created'
'version:updated'

// Integration
'integration:sync-status'
'integration:notification'

// System
'system:health'
'metrics:realtime'
'error:*'
'rate_limit:*'
```

This enhanced WebSocket API provides comprehensive real-time functionality while maintaining clear separation of concerns and robust error handling.