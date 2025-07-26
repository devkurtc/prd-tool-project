# Process Flows - PRD Tool

## 1. System Process Flows

### 1.1 Real-Time Synchronization Process
```mermaid
sequenceDiagram
    participant Client1 as Client 1
    participant Client2 as Client 2
    participant WS as WebSocket Server
    participant Sync as Sync Engine
    participant Redis as Redis Pub/Sub
    participant Queue as Write Queue
    participant DB as PostgreSQL
    participant Git as Git Service
    
    Client1->>WS: Connect(prdId, userId)
    WS->>Sync: RegisterClient(client1)
    Sync->>Redis: Subscribe(prd:123)
    
    Client2->>WS: Connect(prdId, userId)
    WS->>Sync: RegisterClient(client2)
    Sync->>WS: BroadcastPresence(users)
    
    Client1->>WS: EditOperation(delta)
    WS->>Sync: ProcessOperation(delta)
    Sync->>Sync: ApplyCRDT(delta)
    Sync->>Redis: Publish(prd:123, delta)
    
    Redis-->>Sync: NotifySubscribers(delta)
    Sync->>WS: Broadcast(delta)
    WS->>Client2: UpdateContent(delta)
    
    Sync->>Queue: QueueWrite(prdId, content)
    
    Note over Queue: Batch writes every 5 seconds
    
    Queue->>DB: BatchUpdate(changes)
    Queue->>Git: CommitChanges(prdId)
    
    Git-->>Queue: CommitHash
    Queue->>DB: UpdateVersion(commitHash)
```

### 1.2 AI Content Generation Process
```mermaid
sequenceDiagram
    participant User
    participant API as API Server
    participant Auth as Auth Service
    participant Queue as Job Queue
    participant AI as AI Worker
    participant LLM as LLM Provider
    participant Stream as Stream Service
    participant DB as Database
    participant Git as Git Service
    
    User->>API: SubmitPrompt(prompt, context)
    API->>Auth: ValidateToken()
    Auth-->>API: UserContext
    
    API->>Queue: CreateJob(AIGenerationJob)
    Queue-->>API: JobId
    API-->>User: StreamEndpoint(jobId)
    
    Queue->>AI: ProcessJob(job)
    AI->>AI: BuildContext(prd, section)
    AI->>AI: EnrichPrompt(template)
    
    AI->>LLM: StreamCompletion(prompt)
    
    loop Streaming Response
        LLM-->>AI: TextChunk
        AI->>Stream: PublishChunk(chunk)
        Stream-->>User: ServerSentEvent(chunk)
    end
    
    AI->>DB: SaveInteraction(prompt, response)
    AI->>Git: StageChanges(content)
    
    User->>API: ApproveChanges(jobId)
    API->>Git: CommitChanges()
    Git-->>API: CommitHash
    API->>DB: UpdateVersion()
```

### 1.3 Version Control Process
```mermaid
graph TB
    subgraph "Change Detection"
        Edit[Content Edit] --> Debounce[Debounce 500ms]
        Debounce --> Significant{Significant?}
    end
    
    subgraph "Versioning Logic"
        Significant -->|Yes| Type{Change Type}
        Significant -->|No| Skip[Skip Version]
        
        Type -->|Structure| Major[Major Version]
        Type -->|Content| Minor[Minor Version]
        Type -->|Fix| Patch[Patch Version]
    end
    
    subgraph "Git Operations"
        Major --> Stage[Stage Changes]
        Minor --> Stage
        Patch --> Stage
        
        Stage --> Commit[Generate Commit]
        Commit --> Message[Auto Message]
        Message --> Push[Push to Remote]
    end
    
    subgraph "Database Updates"
        Push --> Record[Record Version]
        Record --> Changelog[Update Changelog]
        Changelog --> Notify[Notify Watchers]
    end
    
    subgraph "Cleanup"
        Record --> Archive{Old Versions?}
        Archive -->|>50| Compress[Compress Old]
        Archive -->|<=50| Done[Complete]
    end
```

### 1.4 Authentication & Authorization Process
```mermaid
sequenceDiagram
    participant Client
    participant API as API Gateway
    participant Auth as Auth Service
    participant SSO as SSO Provider
    participant Cache as Redis Cache
    participant DB as Database
    participant Resource as Resource Server
    
    Client->>API: Request(endpoint, token)
    API->>API: ExtractToken()
    
    API->>Cache: CheckToken(jti)
    alt Token in Cache
        Cache-->>API: CachedClaims
    else Token not Cached
        API->>Auth: VerifyToken(token)
        Auth->>Auth: ValidateJWT()
        Auth->>DB: CheckRevocation(jti)
        Auth-->>API: Claims
        API->>Cache: CacheToken(jti, claims, 5min)
    end
    
    API->>Auth: CheckPermissions(claims, resource)
    Auth->>DB: GetUserPermissions(userId)
    Auth->>Auth: EvaluatePolicy(permissions, action)
    Auth-->>API: Authorized/Denied
    
    alt Authorized
        API->>Resource: ForwardRequest()
        Resource-->>API: Response
        API-->>Client: Success(data)
    else Denied
        API-->>Client: Error(403)
    end
    
    Note over Cache: Token refresh flow
    Client->>API: RefreshToken(refreshToken)
    API->>SSO: ValidateRefresh()
    SSO-->>API: NewTokens
    API->>Cache: InvalidateOld(oldJti)
    API-->>Client: NewTokens
```

## 2. Data Processing Flows

### 2.1 Document Import Process
```mermaid
graph TB
    subgraph "Input Processing"
        Upload[File Upload] --> Validate{Valid Format?}
        Validate -->|No| Error[Return Error]
        Validate -->|Yes| Detect[Detect Type]
        
        Detect --> Parse{File Type}
        Parse -->|Word| WordParser[Word Parser]
        Parse -->|PDF| PDFParser[PDF Parser]
        Parse -->|Markdown| MDParser[MD Parser]
        Parse -->|HTML| HTMLParser[HTML Parser]
    end
    
    subgraph "Content Extraction"
        WordParser --> Extract[Extract Content]
        PDFParser --> Extract
        MDParser --> Extract
        HTMLParser --> Extract
        
        Extract --> Structure[Identify Structure]
        Structure --> Sections[Extract Sections]
        Sections --> Clean[Clean Formatting]
    end
    
    subgraph "AI Enhancement"
        Clean --> Analyze[AI Analysis]
        Analyze --> Missing{Missing Sections?}
        Missing -->|Yes| Suggest[AI Suggestions]
        Missing -->|No| Format[Format PRD]
        
        Suggest --> Review[User Review]
        Review --> Apply{Apply?}
        Apply -->|Yes| Merge[Merge Content]
        Apply -->|No| Format
        
        Merge --> Format
    end
    
    subgraph "Storage"
        Format --> Create[Create PRD]
        Create --> Version[Initial Version]
        Version --> Git[Git Commit]
        Git --> Index[Update Search]
    end
```

### 2.2 Search Indexing Process
```mermaid
sequenceDiagram
    participant PRD as PRD Service
    participant Queue as Index Queue
    participant Worker as Index Worker
    participant ES as Elasticsearch
    participant DB as PostgreSQL
    
    PRD->>DB: SavePRD(content)
    DB-->>PRD: Success
    
    PRD->>Queue: QueueIndexJob(prdId)
    
    Worker->>Queue: PollJobs()
    Queue-->>Worker: IndexJob(prdId)
    
    Worker->>DB: FetchPRD(prdId)
    DB-->>Worker: PRDData
    
    Worker->>Worker: ProcessContent()
    Note over Worker: Extract text, metadata, clean HTML
    
    Worker->>Worker: GenerateEmbeddings()
    Note over Worker: Create vector embeddings for semantic search
    
    Worker->>ES: IndexDocument({
        id: prdId,
        title: "...",
        content: "...",
        sections: [...],
        metadata: {...},
        embeddings: [...]
    })
    
    ES-->>Worker: Indexed
    
    Worker->>DB: UpdateIndexStatus(prdId)
```

### 2.3 Export Process
```mermaid
graph TB
    subgraph "Export Request"
        Request[Export PRD] --> Format{Select Format}
        Format -->|PDF| PDFGen[PDF Generator]
        Format -->|Word| WordGen[Word Generator]
        Format -->|HTML| HTMLGen[HTML Generator]
        Format -->|Confluence| ConfGen[Confluence Generator]
    end
    
    subgraph "Content Preparation"
        PDFGen --> Fetch[Fetch PRD Data]
        WordGen --> Fetch
        HTMLGen --> Fetch
        ConfGen --> Fetch
        
        Fetch --> Render[Render Markdown]
        Render --> Diagram[Process Diagrams]
        Diagram --> Assets[Gather Assets]
    end
    
    subgraph "Generation"
        Assets --> Template{Apply Template}
        
        Template -->|PDF| PDFEngine[Puppeteer PDF]
        Template -->|Word| DocxEngine[Docx Generator]
        Template -->|HTML| HTMLEngine[HTML Builder]
        Template -->|Confluence| APICall[Confluence API]
        
        PDFEngine --> File[Generate File]
        DocxEngine --> File
        HTMLEngine --> File
        APICall --> Link[Return Link]
    end
    
    subgraph "Delivery"
        File --> Store[Store Temp]
        Store --> URL[Generate URL]
        URL --> Notify[Notify User]
        Link --> Notify
        
        Notify --> Download[Download/View]
        
        Store --> Cleanup{After 24h}
        Cleanup --> Delete[Delete Temp]
    end
```

## 3. Integration Processes

### 3.1 Jira Synchronization Process
```mermaid
sequenceDiagram
    participant PRD as PRD System
    participant Sync as Sync Service
    participant Queue as Sync Queue
    participant Jira as Jira API
    participant DB as Database
    participant Notify as Notification Service
    
    PRD->>Sync: InitiateSync(prdId, projectKey)
    Sync->>DB: GetMappings(prdId)
    
    alt First Sync
        Sync->>PRD: ExtractUserStories()
        PRD-->>Sync: Stories[]
        
        loop Each Story
            Sync->>Jira: CreateIssue(story)
            Jira-->>Sync: IssueKey
            Sync->>DB: SaveMapping(storyId, issueKey)
        end
    else Update Sync
        DB-->>Sync: ExistingMappings[]
        
        Sync->>PRD: GetChanges(lastSync)
        PRD-->>Sync: ChangedStories[]
        
        loop Each Change
            Sync->>Jira: UpdateIssue(issueKey, changes)
            Jira-->>Sync: Success
        end
    end
    
    Sync->>Queue: ScheduleBackSync(30min)
    
    Note over Queue: Bidirectional Sync
    
    Queue->>Sync: ProcessBackSync()
    Sync->>Jira: GetUpdatedIssues(since)
    Jira-->>Sync: UpdatedIssues[]
    
    loop Each Issue
        Sync->>DB: GetStoryMapping(issueKey)
        Sync->>PRD: UpdateStoryStatus(storyId, status)
    end
    
    Sync->>Notify: SendSyncReport(changes)
```

### 3.2 Chat Platform Integration Process (Slack/Mattermost)
```mermaid
graph TB
    subgraph "Event Sources"
        PRDEvent[PRD Events] --> Filter[Event Filter]
        Comment[Comments] --> Filter
        Version[Versions] --> Filter
        Approval[Approvals] --> Filter
    end
    
    subgraph "Notification Rules"
        Filter --> Rules{Check Rules}
        Rules -->|Mention| Direct[Direct Message]
        Rules -->|Watch| Channel[Channel Post]
        Rules -->|Subscribe| Thread[Thread Update]
        Rules -->|None| Skip[Skip Notification]
    end
    
    subgraph "Message Formatting"
        Direct --> Format[Format Message]
        Channel --> Format
        Thread --> Format
        
        Format --> Rich[Rich Formatting]
        Rich --> Buttons[Add Actions]
        Buttons --> Preview[Add Preview]
    end
    
    subgraph "Delivery"
        Preview --> Queue[Queue Message]
        Queue --> RateLimit{Rate Limit?}
        
        RateLimit -->|OK| Send[Send to Platform]
        RateLimit -->|Exceeded| Batch[Batch Messages]
        
        Batch --> Digest[Create Digest]
        Digest --> Send
        
        Send --> Track[Track Delivery]
        Track --> Analytics[Update Analytics]
    end
```

### 3.3 Craft.io Integration Process
```mermaid
sequenceDiagram
    participant PRD as PRD System
    participant Craft as Craft.io API
    participant Sync as Sync Service
    participant DB as Database
    participant User
    
    User->>PRD: Create/Update PRD
    PRD->>Sync: CheckCraftMapping(prdId)
    
    alt PRD linked to Craft initiative
        Sync->>Craft: GetInitiative(initiativeId)
        Craft-->>Sync: InitiativeData
        
        Sync->>Sync: ValidateAlignment()
        
        alt Alignment Check
            Sync->>Craft: UpdateProgress(initiativeId, prdStatus)
            Craft-->>Sync: Success
            
            Sync->>Craft: LinkDocument(initiativeId, prdUrl)
            Craft-->>Sync: Success
        end
    else New PRD without mapping
        Sync->>Craft: SearchInitiatives(keywords)
        Craft-->>Sync: SuggestedInitiatives[]
        
        Sync->>User: SuggestMapping(suggestions)
        User->>Sync: ConfirmMapping(initiativeId)
        
        Sync->>DB: SaveMapping(prdId, initiativeId)
        Sync->>Craft: LinkDocument(initiativeId, prdUrl)
    end
    
    Note over Sync: Bidirectional Sync
    
    Craft->>Sync: WebhookUpdate(initiativeChanged)
    Sync->>PRD: UpdateMetadata(prdId, craftData)
    Sync->>User: NotifyStrategyChange()
```

## 4. Background Processes

### 4.1 Auto-Save Process
```mermaid
stateDiagram-v2
    [*] --> Idle: Document Loaded
    
    Idle --> Editing: User Types
    Editing --> Debouncing: Stop Typing
    
    Debouncing --> Saving: 2s Elapsed
    Debouncing --> Editing: Resume Typing
    
    Saving --> Validating: Check Changes
    Validating --> Significant: Has Changes
    Validating --> Idle: No Changes
    
    Significant --> LocalSave: Save Locally
    LocalSave --> ServerSave: Queue Server Save
    
    ServerSave --> Success: Save Complete
    ServerSave --> Retry: Save Failed
    
    Success --> Idle: Reset Timer
    Retry --> Backoff: Wait & Retry
    Backoff --> ServerSave: Retry Save
    
    note right of Editing
        Track all changes
        in CRDT structure
    end note
    
    note right of LocalSave
        IndexedDB for
        offline support
    end note
    
    note right of Retry
        Exponential backoff
        Max 5 retries
    end note
```

### 4.2 Garbage Collection Process
```mermaid
graph TB
    subgraph "Scheduled Tasks"
        Cron[Daily Cron] --> Tasks{Select Task}
        
        Tasks -->|Sessions| CleanSessions[Clean Sessions]
        Tasks -->|Versions| ArchiveVersions[Archive Versions]
        Tasks -->|Logs| RotateLogs[Rotate Logs]
        Tasks -->|Cache| ClearCache[Clear Cache]
    end
    
    subgraph "Session Cleanup"
        CleanSessions --> FindStale[Find Stale > 1h]
        FindStale --> RemoveSessions[Remove Records]
        RemoveSessions --> NotifyClients[Notify Clients]
    end
    
    subgraph "Version Archival"
        ArchiveVersions --> CountVersions[Count per PRD]
        CountVersions --> Excess{> 50 versions?}
        
        Excess -->|Yes| SelectOld[Select Oldest]
        Excess -->|No| SkipArchive[Skip]
        
        SelectOld --> Compress[Compress Data]
        Compress --> MoveArchive[Move to Cold Storage]
        MoveArchive --> UpdateRefs[Update References]
    end
    
    subgraph "Log Rotation"
        RotateLogs --> CheckSize{> 1GB?}
        CheckSize -->|Yes| Archive[Archive Current]
        CheckSize -->|No| SkipRotate[Skip]
        
        Archive --> Compress2[Gzip Logs]
        Compress2 --> S3Upload[Upload to S3]
        S3Upload --> DeleteLocal[Delete Local]
    end
    
    subgraph "Cache Management"
        ClearCache --> Expired[Find Expired]
        Expired --> Delete[Delete Entries]
        Delete --> Optimize[Optimize Memory]
    end
```

### 4.3 Analytics Processing
```mermaid
sequenceDiagram
    participant App as Application
    participant Queue as Analytics Queue
    participant Worker as Analytics Worker
    participant Process as Processing Engine
    participant Store as Data Warehouse
    participant Report as Reporting Service
    
    App->>Queue: TrackEvent(event)
    Note over Queue: Buffer events for batch processing
    
    Worker->>Queue: PollEvents(batchSize=1000)
    Queue-->>Worker: EventBatch[]
    
    Worker->>Process: ProcessBatch(events)
    
    Process->>Process: ValidateEvents()
    Process->>Process: EnrichData()
    Process->>Process: AggregateMetrics()
    
    Process->>Store: WriteMetrics(aggregated)
    Store-->>Process: Success
    
    Process->>Report: TriggerReports()
    
    Report->>Store: QueryMetrics()
    Store-->>Report: MetricData
    
    Report->>Report: GenerateReports()
    Report->>Report: UpdateDashboards()
    
    Note over Report: Real-time dashboard updates via WebSocket
    
    Report-->>App: DashboardUpdate
```

## 5. Security Processes

### 5.1 API Rate Limiting Process
```mermaid
graph TB
    subgraph "Request Flow"
        Request[API Request] --> Extract[Extract Identity]
        Extract --> Key{Identify Key}
        
        Key -->|User| UserKey[user:123]
        Key -->|IP| IPKey[ip:1.2.3.4]
        Key -->|API Key| APIKey[api:abc123]
    end
    
    subgraph "Rate Check"
        UserKey --> Check[Check Limits]
        IPKey --> Check
        APIKey --> Check
        
        Check --> Window{Time Window}
        Window -->|Minute| MinLimit[100 req/min]
        Window -->|Hour| HourLimit[1000 req/hr]
        Window -->|Day| DayLimit[10000 req/day]
    end
    
    subgraph "Decision"
        MinLimit --> Allow{Within Limit?}
        HourLimit --> Allow
        DayLimit --> Allow
        
        Allow -->|Yes| Increment[Increment Counter]
        Allow -->|No| Reject[429 Error]
        
        Increment --> Process[Process Request]
        Reject --> Headers[Add Headers]
        Headers --> Response[Return Response]
    end
    
    subgraph "Headers"
        Process --> AddHeaders[Add Rate Headers]
        AddHeaders --> Success[200 Response]
        
        Note over AddHeaders: X-RateLimit-Limit: 100
        Note over AddHeaders: X-RateLimit-Remaining: 67
        Note over AddHeaders: X-RateLimit-Reset: 1234567890
    end
```

### 5.2 Audit Logging Process
```mermaid
sequenceDiagram
    participant Client
    participant API as API Server
    participant MW as Audit Middleware
    participant Service as Business Logic
    participant Audit as Audit Service
    participant Queue as Audit Queue
    participant Store as Audit Store
    
    Client->>API: Request(action, data)
    API->>MW: ProcessRequest()
    
    MW->>MW: CaptureRequest({
        userId,
        action,
        resource,
        ip,
        userAgent,
        timestamp
    })
    
    MW->>Service: Forward()
    Service->>Service: ExecuteAction()
    Service-->>MW: Response
    
    MW->>MW: CaptureResponse({
        status,
        changes,
        duration
    })
    
    MW->>Audit: LogEvent(auditEntry)
    MW-->>Client: Response
    
    Note over Audit: Async processing
    
    Audit->>Queue: QueueEntry(auditEntry)
    Queue->>Store: BatchWrite(entries)
    
    Store->>Store: Partition by date
    Store->>Store: Index for search
    Store->>Store: Compress old data
```

## 6. Monitoring Processes

### 6.1 Health Check Process
```mermaid
graph TB
    subgraph "Health Monitors"
        Scheduler[Health Check Scheduler] --> Checks{Check Type}
        
        Checks -->|API| APICheck[API Health]
        Checks -->|DB| DBCheck[Database Health]
        Checks -->|Redis| RedisCheck[Redis Health]
        Checks -->|Git| GitCheck[Git Service]
    end
    
    subgraph "Health Checks"
        APICheck --> APIPing[Ping Endpoint]
        DBCheck --> DBQuery[Test Query]
        RedisCheck --> RedisPing[Ping Redis]
        GitCheck --> GitTest[Test Operation]
        
        APIPing --> APIResult{Healthy?}
        DBQuery --> DBResult{Healthy?}
        RedisPing --> RedisResult{Healthy?}
        GitTest --> GitResult{Healthy?}
    end
    
    subgraph "Status Aggregation"
        APIResult --> Aggregate[Aggregate Status]
        DBResult --> Aggregate
        RedisResult --> Aggregate
        GitResult --> Aggregate
        
        Aggregate --> Overall{Overall Health}
        Overall -->|Healthy| Green[Status: Healthy]
        Overall -->|Degraded| Yellow[Status: Degraded]
        Overall -->|Down| Red[Status: Down]
    end
    
    subgraph "Actions"
        Yellow --> Alert[Send Alerts]
        Red --> Page[Page On-Call]
        
        Alert --> Update[Update Status Page]
        Page --> Update
        
        Update --> Metrics[Update Metrics]
        Metrics --> Dashboard[Update Dashboard]
    end
```

### 6.2 Performance Monitoring Process
```mermaid
sequenceDiagram
    participant App as Application
    participant APM as APM Agent
    participant Collector as Metrics Collector
    participant Processor as Processing Service
    participant Storage as Time Series DB
    participant Alert as Alert Manager
    participant Dash as Dashboard
    
    App->>APM: StartTransaction()
    
    App->>App: Execute Operation
    Note over App: Track spans, DB queries, external calls
    
    App->>APM: EndTransaction()
    
    APM->>Collector: SendMetrics({
        duration,
        spans,
        errors,
        metadata
    })
    
    Collector->>Processor: ProcessMetrics()
    
    Processor->>Processor: Aggregate()
    Processor->>Processor: CalculatePercentiles()
    
    Processor->>Storage: StoreMetrics()
    
    Storage->>Alert: CheckThresholds()
    
    alt Threshold Exceeded
        Alert->>Alert: TriggerAlert()
        Alert-->>OnCall: SendNotification()
    end
    
    Storage->>Dash: StreamMetrics()
    Dash->>Dash: UpdateVisualizations()
    
    Note over Dash: Real-time dashboards with:
    Note over Dash: - Response times
    Note over Dash: - Error rates
    Note over Dash: - Throughput
    Note over Dash: - Resource usage
```