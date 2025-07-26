# Software Design Specification - PRD Tool

## 1. Design Principles

### 1.1 Core Principles
- **AI-First**: Every interaction should be possible through natural language
- **Real-Time**: All changes visible immediately to all users
- **Version-Controlled**: Every change tracked and reversible
- **Collaborative**: Multiple users can work simultaneously without conflicts
- **Extensible**: Easy to add new features and integrations

### 1.2 Design Patterns
- **Event-Driven Architecture**: Loose coupling between services
- **CQRS**: Separate read and write models for performance
- **Repository Pattern**: Abstract data access layer
- **Observer Pattern**: Real-time updates
- **Strategy Pattern**: Pluggable AI providers

## 2. System Components

### 2.1 Frontend Components Architecture

```typescript
// Component Hierarchy
App
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   ├── UserPresence
│   │   └── VersionIndicator
│   ├── Sidebar
│   │   ├── ProjectTree
│   │   ├── AIAssistant
│   │   └── ActivityFeed
│   └── Main
│       ├── Editor
│       │   ├── MarkdownEditor
│       │   ├── PreviewPane
│       │   └── DiagramRenderer
│       └── VersionHistory
│           ├── VersionList
│           └── DiffViewer
```

### 2.2 Core Frontend Modules

```typescript
// State Management Structure
interface AppState {
  user: UserState
  prd: PRDState
  collaboration: CollaborationState
  ai: AIState
  ui: UIState
}

interface PRDState {
  currentPRD: PRD | null
  versions: Version[]
  unsavedChanges: Change[]
  isLoading: boolean
  error: Error | null
}

interface CollaborationState {
  users: Map<string, UserPresence>
  cursors: Map<string, CursorPosition>
  selections: Map<string, Selection>
  activities: Activity[]
}

interface AIState {
  isGenerating: boolean
  currentPrompt: string
  streamBuffer: string
  suggestions: Suggestion[]
  history: AIInteraction[]
}
```

### 2.3 Backend Service Architecture

```typescript
// Service Layer Design
class PRDService {
  constructor(
    private repository: IPRDRepository,
    private gitService: IGitService,
    private eventBus: IEventBus,
    private cache: ICacheService
  ) {}

  async createPRD(input: CreatePRDInput): Promise<PRD> {
    // Validation
    const validated = await this.validate(input)
    
    // Business logic
    const prd = await this.repository.create(validated)
    
    // Git integration
    await this.gitService.initRepository(prd.id)
    await this.gitService.commit(prd, 'Initial commit')
    
    // Event emission
    await this.eventBus.emit('prd.created', prd)
    
    // Cache invalidation
    await this.cache.invalidate(`project:${prd.projectId}`)
    
    return prd
  }
}

// Repository Interface
interface IPRDRepository {
  create(data: CreatePRDData): Promise<PRD>
  findById(id: string): Promise<PRD | null>
  update(id: string, data: UpdatePRDData): Promise<PRD>
  delete(id: string): Promise<void>
  findByProject(projectId: string): Promise<PRD[]>
}
```

## 3. Real-Time Collaboration Design

### 3.1 CRDT Implementation

```typescript
// Yjs Document Structure
class PRDDocument {
  private ydoc: Y.Doc
  private awareness: awarenessProtocol.Awareness
  
  constructor() {
    this.ydoc = new Y.Doc()
    this.awareness = new awarenessProtocol.Awareness(this.ydoc)
  }
  
  // Shared data types
  get content(): Y.Text {
    return this.ydoc.getText('content')
  }
  
  get metadata(): Y.Map {
    return this.ydoc.getMap('metadata')
  }
  
  get diagrams(): Y.Array {
    return this.ydoc.getArray('diagrams')
  }
  
  // Collaboration methods
  applyUpdate(update: Uint8Array) {
    Y.applyUpdate(this.ydoc, update)
  }
  
  getStateVector(): Uint8Array {
    return Y.encodeStateVector(this.ydoc)
  }
  
  getDiff(vector: Uint8Array): Uint8Array {
    return Y.encodeStateAsUpdate(this.ydoc, vector)
  }
}
```

### 3.2 WebSocket Protocol

```typescript
// WebSocket Message Types
enum MessageType {
  // Connection
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  
  // Document sync
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  DOCUMENT_UPDATE = 'document_update',
  
  // Presence
  PRESENCE_UPDATE = 'presence_update',
  CURSOR_UPDATE = 'cursor_update',
  SELECTION_UPDATE = 'selection_update',
  
  // AI interactions
  AI_PROMPT = 'ai_prompt',
  AI_STREAM = 'ai_stream',
  AI_COMPLETE = 'ai_complete',
  
  // Version control
  VERSION_CREATED = 'version_created',
  COMMIT_REQUESTED = 'commit_requested'
}

interface WebSocketMessage {
  type: MessageType
  payload: any
  timestamp: number
  userId: string
}
```

## 4. AI Integration Design

### 4.1 AI Service Architecture

```typescript
// AI Service Design
class AIService {
  private provider: AIProvider
  private promptTemplate: PromptTemplate
  private contextManager: ContextManager
  
  async processPrompt(
    prompt: string,
    context: PRDContext
  ): AsyncGenerator<string> {
    // Build context
    const enrichedPrompt = await this.buildPrompt(prompt, context)
    
    // Stream response
    const stream = await this.provider.generateStream(enrichedPrompt)
    
    for await (const chunk of stream) {
      // Process and validate chunk
      const processed = this.processChunk(chunk)
      yield processed
    }
  }
  
  private async buildPrompt(
    userPrompt: string,
    context: PRDContext
  ): Promise<string> {
    const template = this.promptTemplate.get(context.command)
    
    return template.render({
      userPrompt,
      currentContent: context.currentContent,
      section: context.section,
      history: context.history,
      teamGuidelines: context.guidelines
    })
  }
}

// AI Provider Interface
interface AIProvider {
  generateStream(prompt: string): AsyncGenerator<string>
  generateComplete(prompt: string): Promise<string>
  embedText(text: string): Promise<number[]>
}
```

### 4.2 Prompt Management

```typescript
// Prompt Templates
class PromptTemplate {
  private templates = {
    create: `
      You are helping create a Product Requirements Document (PRD).
      
      User request: {userPrompt}
      
      Generate a complete PRD with these sections:
      - Executive Summary
      - Problem Statement
      - User Stories
      - Technical Requirements
      - Success Metrics
      
      Follow these guidelines: {teamGuidelines}
    `,
    
    update: `
      You are updating a section of a PRD.
      
      Current content:
      {currentContent}
      
      User request: {userPrompt}
      
      Update the {section} section while maintaining consistency.
    `,
    
    diagram: `
      Generate a Mermaid diagram based on this description:
      {userPrompt}
      
      Context from PRD:
      {currentContent}
      
      Return only valid Mermaid syntax.
    `
  }
}
```

## 5. Data Models

### 5.1 Domain Models

```typescript
// Core Domain Models
interface PRD {
  id: string
  projectId: string
  title: string
  version: string
  content: string
  metadata: PRDMetadata
  createdAt: Date
  updatedAt: Date
  createdBy: string
  status: PRDStatus
}

interface PRDMetadata {
  template: string
  tags: string[]
  stakeholders: string[]
  targetDate?: Date
  priority: Priority
}

interface Version {
  id: string
  prdId: string
  version: string
  content: string
  changelog: string
  commitHash: string
  createdAt: Date
  createdBy: string
  changes: Change[]
}

interface UserPresence {
  userId: string
  userName: string
  avatar: string
  status: 'viewing' | 'editing' | 'ai-prompting'
  cursorPosition?: number
  selection?: TextSelection
  color: string
  lastSeen: Date
}
```

### 5.2 Database Schema Design

```sql
-- Optimized schema with indexes
CREATE TABLE prds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  title VARCHAR(255) NOT NULL,
  current_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  content TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Indexes for performance
  INDEX idx_prds_project_id (project_id),
  INDEX idx_prds_status (status),
  INDEX idx_prds_created_at (created_at DESC),
  INDEX idx_prds_metadata_gin (metadata) USING GIN
);

-- Full-text search
ALTER TABLE prds ADD COLUMN search_vector tsvector;
CREATE INDEX idx_prds_search ON prds USING GIN(search_vector);

-- Trigger to update search vector
CREATE TRIGGER update_prd_search_vector
  BEFORE INSERT OR UPDATE ON prds
  FOR EACH ROW
  EXECUTE FUNCTION tsvector_update_trigger(
    search_vector, 'pg_catalog.english', title, content
  );
```

## 6. Security Design

### 6.1 Authentication Flow

```typescript
// JWT Token Structure
interface JWTPayload {
  sub: string // User ID
  email: string
  roles: string[]
  permissions: string[]
  iat: number
  exp: number
  jti: string // Token ID for revocation
}

// Authentication Middleware
class AuthMiddleware {
  async authenticate(req: Request): Promise<User> {
    const token = this.extractToken(req)
    
    if (!token) {
      throw new UnauthorizedError('No token provided')
    }
    
    // Verify JWT
    const payload = await this.verifyToken(token)
    
    // Check token revocation
    if (await this.isRevoked(payload.jti)) {
      throw new UnauthorizedError('Token revoked')
    }
    
    // Load user with permissions
    const user = await this.userService.findById(payload.sub)
    
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive')
    }
    
    return user
  }
}
```

### 6.2 Authorization Design

```typescript
// Permission-based Authorization
class AuthorizationService {
  private policies: Map<string, Policy> = new Map()
  
  constructor() {
    this.registerPolicies()
  }
  
  async authorize(
    user: User,
    resource: string,
    action: string
  ): Promise<boolean> {
    const policy = this.policies.get(resource)
    
    if (!policy) {
      return false
    }
    
    return policy.evaluate(user, action)
  }
  
  private registerPolicies() {
    this.policies.set('prd', new PRDPolicy())
    this.policies.set('project', new ProjectPolicy())
    this.policies.set('ai', new AIPolicy())
  }
}

// Example Policy
class PRDPolicy implements Policy {
  evaluate(user: User, action: string): boolean {
    switch (action) {
      case 'read':
        return user.hasPermission('prd.read')
      case 'write':
        return user.hasPermission('prd.write')
      case 'delete':
        return user.hasPermission('prd.delete') && 
               user.hasRole('admin')
      case 'approve':
        return user.hasPermission('prd.approve')
      default:
        return false
    }
  }
}
```

## 7. Performance Optimization

### 7.1 Caching Strategy

```typescript
// Multi-layer Cache Implementation
class CacheService {
  private l1Cache: MemoryCache // In-process
  private l2Cache: RedisCache  // Distributed
  
  async get<T>(key: string): Promise<T | null> {
    // Check L1 cache
    let value = await this.l1Cache.get<T>(key)
    if (value) return value
    
    // Check L2 cache
    value = await this.l2Cache.get<T>(key)
    if (value) {
      // Populate L1
      await this.l1Cache.set(key, value, 60) // 1 min
      return value
    }
    
    return null
  }
  
  async set<T>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    // Set in both caches
    await Promise.all([
      this.l1Cache.set(key, value, ttl || 300),
      this.l2Cache.set(key, value, ttl || 3600)
    ])
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Clear from both caches
    await Promise.all([
      this.l1Cache.invalidate(pattern),
      this.l2Cache.invalidate(pattern)
    ])
  }
}
```

### 7.2 Query Optimization

```typescript
// Optimized Query Builder
class PRDQueryBuilder {
  private query: Knex.QueryBuilder
  
  constructor(private knex: Knex) {
    this.query = knex('prds')
  }
  
  forProject(projectId: string): this {
    this.query.where('project_id', projectId)
    return this
  }
  
  withVersions(): this {
    this.query.leftJoin(
      'prd_versions',
      'prds.id',
      'prd_versions.prd_id'
    )
    return this
  }
  
  withLatestActivity(): this {
    this.query.select(
      'prds.*',
      knex.raw(`
        COALESCE(
          MAX(prd_versions.created_at),
          prds.created_at
        ) as last_activity
      `)
    )
    .groupBy('prds.id')
    .orderBy('last_activity', 'desc')
    
    return this
  }
  
  paginate(page: number, limit: number): this {
    this.query
      .limit(limit)
      .offset((page - 1) * limit)
    
    return this
  }
  
  async execute(): Promise<PRD[]> {
    return this.query
  }
}
```

## 8. Error Handling

### 8.1 Error Types and Handling

```typescript
// Custom Error Classes
class DomainError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
  }
}

class ValidationError extends DomainError {
  constructor(
    message: string,
    public errors: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

class ConflictError extends DomainError {
  constructor(
    message: string,
    public conflictingResource: any
  ) {
    super(message, 'CONFLICT_ERROR', 409)
  }
}

// Global Error Handler
class ErrorHandler {
  handle(error: Error, req: Request, res: Response) {
    // Log error
    logger.error({
      error: error.message,
      stack: error.stack,
      request: {
        method: req.method,
        url: req.url,
        userId: req.user?.id
      }
    })
    
    // Send appropriate response
    if (error instanceof DomainError) {
      res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          ...(error instanceof ValidationError && {
            errors: error.errors
          })
        }
      })
    } else {
      // Generic error
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        }
      })
    }
  }
}
```

## 9. Testing Strategy

### 9.1 Test Structure

```typescript
// Unit Test Example
describe('PRDService', () => {
  let service: PRDService
  let mockRepository: jest.Mocked<IPRDRepository>
  let mockGitService: jest.Mocked<IGitService>
  
  beforeEach(() => {
    mockRepository = createMockRepository()
    mockGitService = createMockGitService()
    
    service = new PRDService(
      mockRepository,
      mockGitService,
      mockEventBus,
      mockCache
    )
  })
  
  describe('createPRD', () => {
    it('should create PRD with valid input', async () => {
      // Arrange
      const input = {
        title: 'Test PRD',
        projectId: 'project-123',
        content: '# Test Content'
      }
      
      mockRepository.create.mockResolvedValue({
        id: 'prd-123',
        ...input
      })
      
      // Act
      const result = await service.createPRD(input)
      
      // Assert
      expect(result).toMatchObject(input)
      expect(mockGitService.initRepository).toHaveBeenCalledWith('prd-123')
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'prd.created',
        expect.objectContaining({ id: 'prd-123' })
      )
    })
  })
})

// Integration Test Example
describe('PRD API Integration', () => {
  it('should handle complete PRD creation flow', async () => {
    // Create PRD
    const response = await request(app)
      .post('/api/prds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Integration Test PRD',
        projectId: testProject.id
      })
    
    expect(response.status).toBe(201)
    expect(response.body.data).toHaveProperty('id')
    
    // Verify Git repository created
    const gitExists = await gitService.repositoryExists(
      response.body.data.id
    )
    expect(gitExists).toBe(true)
    
    // Verify real-time notification sent
    expect(mockWebSocket.emit).toHaveBeenCalledWith(
      'prd.created',
      expect.any(Object)
    )
  })
})
```