# User Flows - PRD Tool

## 1. Core User Journeys

### 1.1 First-Time User Flow
```mermaid
graph TD
    Start([User receives invite]) --> Login[Login/SSO]
    Login --> Welcome[Welcome screen]
    Welcome --> Tutorial{Take tutorial?}
    
    Tutorial -->|Yes| Guide[Interactive guide]
    Tutorial -->|No| Dashboard[Main dashboard]
    
    Guide --> CreateFirst[Create first PRD]
    CreateFirst --> AI[AI assists with content]
    AI --> Review[Review generated PRD]
    Review --> Save[Save PRD]
    Save --> Success[Success message]
    Success --> Dashboard
    
    Dashboard --> Browse[Browse projects]
    Browse --> Select[Select project]
    Select --> Action{Choose action}
    Action -->|Create| NewPRD[New PRD flow]
    Action -->|View| ViewPRD[View existing PRD]
```

### 1.2 PRD Creation Flow
```mermaid
graph TD
    Start([PO clicks New PRD]) --> Choose{Choose method}
    
    Choose -->|Blank| Template[Select template]
    Choose -->|AI Generate| Prompt[Enter description]
    Choose -->|Import| Upload[Upload document]
    
    Template --> Initialize[Initialize PRD]
    Prompt --> AIGen[AI generates structure]
    Upload --> Parse[Parse & convert]
    
    AIGen --> Review[Review AI output]
    Parse --> Review
    Initialize --> Edit[Edit mode]
    Review --> Edit
    
    Edit --> AIAssist{Need AI help?}
    AIAssist -->|Yes| AIPrompt[Type AI prompt]
    AIAssist -->|No| Continue[Continue editing]
    
    AIPrompt --> Stream[Stream AI response]
    Stream --> Accept{Accept changes?}
    Accept -->|Yes| Apply[Apply to document]
    Accept -->|No| Modify[Modify prompt]
    Modify --> AIPrompt
    
    Apply --> Continue
    Continue --> AutoSave[Auto-save]
    AutoSave --> Done{Finished?}
    Done -->|No| Edit
    Done -->|Yes| Commit[Commit version]
    Commit --> Notify[Notify team]
```

### 1.3 Real-Time Collaboration Flow
```mermaid
graph TD
    User1[User 1 opens PRD] --> Join1[Join session]
    User2[User 2 opens PRD] --> Join2[Join session]
    
    Join1 --> Presence[Update presence]
    Join2 --> Presence
    
    Presence --> Show[Show active users]
    
    Show --> Edit1[User 1 edits]
    Show --> View2[User 2 views]
    
    Edit1 --> Sync1[Sync changes]
    Sync1 --> Update2[Update User 2 view]
    Update2 --> See2[User 2 sees changes]
    
    View2 --> Comment[User 2 comments]
    Comment --> Notify1[Notify User 1]
    
    See2 --> AI2[User 2 AI prompt]
    AI2 --> Stream[Stream to all users]
    Stream --> Preview[Preview AI changes]
    
    Preview --> Discuss{Discuss changes}
    Discuss -->|Approve| Apply[Apply changes]
    Discuss -->|Reject| Discard[Discard changes]
    
    Apply --> Version[Create version]
    Version --> GitCommit[Git commit]
```

## 2. AI Interaction Flows

### 2.1 AI Content Generation Flow
```mermaid
stateDiagram-v2
    [*] --> Idle: PRD Open
    
    Idle --> Prompting: User types @command
    Prompting --> Validating: Submit prompt
    
    Validating --> Processing: Valid prompt
    Validating --> Error: Invalid prompt
    
    Processing --> Streaming: AI generates
    Streaming --> Displaying: Show chunks
    Displaying --> Streaming: More content
    
    Displaying --> Complete: Generation done
    Complete --> Reviewing: User reviews
    
    Reviewing --> Accepting: User approves
    Reviewing --> Modifying: User edits prompt
    Reviewing --> Rejecting: User cancels
    
    Accepting --> Applied: Changes saved
    Modifying --> Prompting: New prompt
    Rejecting --> Idle: No changes
    
    Applied --> Idle: Ready for next
    Error --> Idle: Show error
```

### 2.2 AI Command Flow
```mermaid
graph LR
    subgraph Commands
        Update[@update section]
        Diagram[@diagram description]
        Metrics[@metrics goals]
        Review[@review content]
        Suggest[@suggest improvements]
    end
    
    subgraph Processing
        Parse[Parse command]
        Context[Gather context]
        Generate[Generate content]
        Format[Format response]
    end
    
    subgraph Output
        Text[Text content]
        Mermaid[Mermaid diagram]
        List[Bullet list]
        Table[Table format]
    end
    
    Update --> Parse
    Diagram --> Parse
    Metrics --> Parse
    Review --> Parse
    Suggest --> Parse
    
    Parse --> Context
    Context --> Generate
    Generate --> Format
    
    Format --> Text
    Format --> Mermaid
    Format --> List
    Format --> Table
```

## 3. Version Control Flows

### 3.1 Version Management Flow
```mermaid
graph TD
    Edit[Edit PRD] --> Change{Significant change?}
    
    Change -->|Minor| AutoSave[Auto-save]
    Change -->|Major| Prompt[Prompt for version]
    
    AutoSave --> Draft[Update draft]
    Prompt --> Describe[Describe changes]
    
    Describe --> Commit[Create commit]
    Commit --> Version[New version]
    
    Version --> Changelog[Update changelog]
    Changelog --> Notify[Notify watchers]
    
    Draft --> Timer{5 min elapsed?}
    Timer -->|Yes| AutoCommit[Auto-commit]
    Timer -->|No| Draft
    
    AutoCommit --> Version
    
    Version --> History[Version history]
    History --> Compare{Compare versions?}
    Compare -->|Yes| Diff[Show differences]
    Compare -->|No| Continue[Continue editing]
```

### 3.2 Conflict Resolution Flow
```mermaid
graph TD
    Edit1[User 1 edits] --> Save1[Save attempt]
    Edit2[User 2 edits] --> Save2[Save attempt]
    
    Save1 --> Check1{Conflict?}
    Save2 --> Check2{Conflict?}
    
    Check1 -->|No| Success1[Save success]
    Check2 -->|Yes| Conflict[Conflict detected]
    
    Conflict --> Show[Show both versions]
    Show --> Choose{Resolution method}
    
    Choose -->|Manual| Compare[Compare changes]
    Choose -->|Auto| CRDT[Apply CRDT]
    Choose -->|AI| AIResolve[AI suggestion]
    
    Compare --> Select[Select changes]
    CRDT --> Merge[Auto-merge]
    AIResolve --> Review[Review suggestion]
    
    Select --> Apply[Apply resolution]
    Merge --> Apply
    Review --> Apply
    
    Apply --> Resolved[Conflict resolved]
    Resolved --> Continue[Continue editing]
```

## 4. Integration Flows

### 4.1 Jira Integration Flow
```mermaid
graph TD
    PRD[PRD with user stories] --> Export{Export to Jira?}
    
    Export -->|Yes| Auth[Check Jira auth]
    Export -->|No| Continue[Continue editing]
    
    Auth --> Valid{Valid auth?}
    Valid -->|No| Login[Jira login]
    Valid -->|Yes| Map[Map fields]
    
    Login --> Valid
    Map --> Preview[Preview issues]
    
    Preview --> Confirm{Confirm?}
    Confirm -->|No| Adjust[Adjust mapping]
    Confirm -->|Yes| Create[Create issues]
    
    Adjust --> Map
    Create --> Link[Link in PRD]
    
    Link --> Sync{Enable sync?}
    Sync -->|Yes| Watch[Watch for updates]
    Sync -->|No| Done[Complete]
    
    Watch --> Update[Sync changes]
    Update --> Notify[Notify users]
```

### 4.2 Slack Notification Flow
```mermaid
graph TD
    Event[PRD event] --> Check{Notifications enabled?}
    
    Check -->|No| Skip[Skip notification]
    Check -->|Yes| Filter{Match criteria?}
    
    Filter -->|No| Skip
    Filter -->|Yes| Format[Format message]
    
    Format --> Channel{Notification type}
    
    Channel -->|Mention| Direct[Direct message]
    Channel -->|Update| ChannelMsg[Channel message]
    Channel -->|Approval| Thread[Thread reply]
    
    Direct --> Send[Send to Slack]
    ChannelMsg --> Send
    Thread --> Send
    
    Send --> Track[Track delivery]
    Track --> Analytics[Update analytics]
```

## 5. Search and Discovery Flows

### 5.1 PRD Search Flow
```mermaid
graph TD
    Start[User enters search] --> Parse[Parse query]
    
    Parse --> Type{Search type}
    
    Type -->|Text| FullText[Full-text search]
    Type -->|Filter| Faceted[Faceted search]
    Type -->|AI| Semantic[AI semantic search]
    
    FullText --> Results[Get results]
    Faceted --> Filter[Apply filters]
    Semantic --> Embed[Generate embeddings]
    
    Filter --> Results
    Embed --> Similar[Find similar]
    Similar --> Results
    
    Results --> Rank[Rank by relevance]
    Rank --> Display[Display results]
    
    Display --> Select{Select result?}
    Select -->|Yes| Open[Open PRD]
    Select -->|No| Refine[Refine search]
    
    Refine --> Parse
```

### 5.2 Navigation Flow
```mermaid
graph LR
    Dashboard[Dashboard] --> Projects[Project list]
    Projects --> Project[Select project]
    
    Project --> PRDs[PRD list]
    PRDs --> PRD[Select PRD]
    
    PRD --> View{View mode}
    View -->|Read| Reader[Read-only view]
    View -->|Edit| Editor[Edit mode]
    View -->|History| Versions[Version history]
    
    subgraph "Quick Actions"
        Search[Global search]
        Recent[Recent items]
        Starred[Starred PRDs]
    end
    
    Dashboard --> Search
    Dashboard --> Recent
    Dashboard --> Starred
    
    Search --> PRD
    Recent --> PRD
    Starred --> PRD
```

## 6. Administrative Flows

### 6.1 Team Management Flow
```mermaid
graph TD
    Admin[Admin dashboard] --> Teams[Manage teams]
    
    Teams --> Action{Choose action}
    
    Action -->|Add| Invite[Invite member]
    Action -->|Remove| Remove[Remove member]
    Action -->|Edit| Permissions[Edit permissions]
    
    Invite --> Email[Send invite email]
    Email --> Accept{User accepts?}
    Accept -->|Yes| Onboard[Onboarding flow]
    Accept -->|No| Expire[Invite expires]
    
    Remove --> Confirm{Confirm removal?}
    Confirm -->|Yes| Transfer[Transfer ownership]
    Confirm -->|No| Cancel[Cancel action]
    
    Transfer --> Reassign[Reassign PRDs]
    Reassign --> Notify[Notify team]
    
    Permissions --> Roles[Select role]
    Roles --> Apply[Apply changes]
    Apply --> Log[Audit log]
```

### 6.2 Settings Configuration Flow
```mermaid
graph TD
    Settings[Settings page] --> Category{Select category}
    
    Category -->|General| General[General settings]
    Category -->|AI| AI[AI configuration]
    Category -->|Integrations| Int[Integrations]
    Category -->|Security| Sec[Security settings]
    
    General --> Theme[Theme selection]
    General --> Notifications[Notification prefs]
    
    AI --> Model[AI model selection]
    AI --> Prompts[Custom prompts]
    
    Int --> Connect[Connect services]
    Connect --> OAuth[OAuth flow]
    OAuth --> Test[Test connection]
    
    Sec --> MFA[Enable MFA]
    Sec --> API[API keys]
    
    Theme --> Save[Save settings]
    Notifications --> Save
    Model --> Save
    Prompts --> Save
    Test --> Save
    MFA --> Save
    API --> Save
    
    Save --> Reload[Reload app]
```

## 7. Error and Recovery Flows

### 7.1 Error Handling Flow
```mermaid
graph TD
    Action[User action] --> Process[Process request]
    
    Process --> Error{Error occurred?}
    
    Error -->|No| Success[Complete action]
    Error -->|Yes| Type{Error type}
    
    Type -->|Network| Offline[Offline mode]
    Type -->|Auth| Login[Re-authenticate]
    Type -->|Validation| Fix[Show errors]
    Type -->|Server| Retry[Retry mechanism]
    
    Offline --> Cache[Use cached data]
    Cache --> Queue[Queue changes]
    Queue --> Sync[Sync when online]
    
    Login --> Resume[Resume action]
    Fix --> Correct[User corrects]
    Retry --> Backoff[Exponential backoff]
    
    Correct --> Process
    Backoff --> Process
    Resume --> Process
    Sync --> Success
```

### 7.2 Recovery Flow
```mermaid
graph TD
    Crash[App crash/close] --> Detect[Detect unsaved work]
    
    Detect --> Found{Found unsaved?}
    
    Found -->|No| Normal[Normal startup]
    Found -->|Yes| Prompt[Recovery prompt]
    
    Prompt --> Choice{User choice}
    
    Choice -->|Restore| Load[Load from local]
    Choice -->|Discard| Clear[Clear local data]
    Choice -->|Compare| Diff[Show differences]
    
    Load --> Merge[Merge with server]
    Diff --> Select[Select version]
    Select --> Merge
    
    Merge --> Validate[Validate data]
    Validate --> Apply[Apply changes]
    Apply --> Continue[Continue editing]
    
    Clear --> Normal
    Normal --> Ready[App ready]
    Continue --> Ready
```

## 8. Mobile-Specific Flows

### 8.1 Mobile Editing Flow
```mermaid
graph TD
    Open[Open mobile app] --> Auth{Authenticated?}
    
    Auth -->|No| Login[Login screen]
    Auth -->|Yes| List[PRD list]
    
    Login --> List
    List --> Select[Select PRD]
    
    Select --> Mode{Edit mode?}
    
    Mode -->|View| Read[Read mode]
    Mode -->|Edit| Keyboard[Show keyboard]
    
    Read --> Gesture{Gesture}
    Gesture -->|Swipe| Navigate[Navigate sections]
    Gesture -->|Tap| Expand[Expand section]
    Gesture -->|Long press| Menu[Context menu]
    
    Keyboard --> Type[Type content]
    Type --> AIButton{AI assist?}
    
    AIButton -->|Yes| Voice[Voice input]
    AIButton -->|No| Continue[Continue typing]
    
    Voice --> Process[Process speech]
    Process --> Suggest[AI suggestions]
    Suggest --> Apply[Apply edits]
    
    Apply --> Save[Auto-save]
    Continue --> Save
```

### 8.2 Offline Mobile Flow
```mermaid
graph TD
    Start[Open app offline] --> Check[Check cached data]
    
    Check --> Available{PRDs cached?}
    
    Available -->|No| Empty[Show empty state]
    Available -->|Yes| List[Show cached PRDs]
    
    Empty --> Info[Offline message]
    List --> Select[Select PRD]
    
    Select --> Edit[Edit locally]
    Edit --> Queue[Queue changes]
    
    Queue --> Indicator[Show sync pending]
    
    Indicator --> Online{Come online?}
    
    Online -->|Yes| Sync[Sync changes]
    Online -->|No| Continue[Continue offline]
    
    Sync --> Conflict{Conflicts?}
    
    Conflict -->|Yes| Resolve[Resolve conflicts]
    Conflict -->|No| Success[Sync complete]
    
    Resolve --> Success
    Success --> Update[Update UI]
```