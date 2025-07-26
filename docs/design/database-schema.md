# Database Schema Design - PRD Tool

## 1. Overview

The PRD Tool uses PostgreSQL as its primary database with the following design principles:
- **Normalized structure** for data integrity
- **JSONB columns** for flexible metadata
- **Optimized indexes** for query performance
- **Audit trails** for compliance
- **Full-text search** capabilities

## 2. Core Tables

### 2.1 Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_users_email (email),
  INDEX idx_users_is_active (is_active),
  INDEX idx_users_role (role)
);

-- Audit trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 Organizations Table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  subscription_tier VARCHAR(50) DEFAULT 'free',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_organizations_slug (slug),
  INDEX idx_organizations_is_active (is_active)
);

-- Organization membership
CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (organization_id, user_id),
  INDEX idx_org_members_user_id (user_id)
);
```

### 2.3 Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  git_repo_url TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Composite unique constraint
  UNIQUE (organization_id, slug),
  
  -- Indexes
  INDEX idx_projects_organization_id (organization_id),
  INDEX idx_projects_is_archived (is_archived),
  INDEX idx_projects_created_by (created_by)
);
```

### 2.4 PRDs Table
```sql
CREATE TABLE prds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  current_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  content TEXT,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  template_id UUID REFERENCES prd_templates(id),
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Composite unique constraint
  UNIQUE (project_id, slug),
  
  -- Indexes
  INDEX idx_prds_project_id (project_id),
  INDEX idx_prds_status (status),
  INDEX idx_prds_created_at (created_at DESC),
  INDEX idx_prds_template_id (template_id),
  INDEX idx_prds_metadata_gin (metadata) USING GIN,
  
  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(content, '')), 'B')
  ) STORED,
  
  INDEX idx_prds_search ON prds USING GIN(search_vector)
);
```

### 2.5 PRD Versions Table
```sql
CREATE TABLE prd_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id UUID REFERENCES prds(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  changelog TEXT,
  metadata JSONB DEFAULT '{}',
  commit_hash VARCHAR(40),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique version per PRD
  UNIQUE (prd_id, version),
  
  -- Indexes
  INDEX idx_prd_versions_prd_id (prd_id),
  INDEX idx_prd_versions_created_at (created_at DESC),
  INDEX idx_prd_versions_commit_hash (commit_hash)
);
```

### 2.6 CRDT Operations Table
```sql
CREATE TABLE crdt_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id UUID REFERENCES prds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  operation_type VARCHAR(50) NOT NULL, -- insert, delete, retain, format
  vector_clock JSONB NOT NULL, -- Vector clock for operation ordering
  operation_data JSONB NOT NULL, -- Operation details
  position INT NOT NULL, -- Position in document
  length INT, -- Length for delete/retain operations
  content TEXT, -- Content for insert operations  
  attributes JSONB, -- Formatting attributes
  is_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_crdt_operations_prd_id (prd_id),
  INDEX idx_crdt_operations_created_at (created_at),
  INDEX idx_crdt_operations_position (prd_id, position),
  INDEX idx_crdt_operations_applied (prd_id, is_applied),
  INDEX idx_crdt_operations_vector_clock (prd_id, vector_clock) USING GIN
);

-- Function to apply CRDT operations in order
CREATE OR REPLACE FUNCTION apply_crdt_operations(target_prd_id UUID)
RETURNS TEXT AS $$
DECLARE
  operation RECORD;
  result_content TEXT := '';
BEGIN
  -- Apply operations in vector clock order
  FOR operation IN 
    SELECT * FROM crdt_operations 
    WHERE prd_id = target_prd_id AND is_applied = false
    ORDER BY (vector_clock->>'timestamp')::BIGINT
  LOOP
    -- Apply operation based on type
    CASE operation.operation_type
      WHEN 'insert' THEN
        result_content := overlay(result_content placing operation.content from operation.position);
      WHEN 'delete' THEN
        result_content := overlay(result_content placing '' from operation.position for operation.length);
      -- Add more operation types as needed
    END CASE;
    
    -- Mark as applied
    UPDATE crdt_operations SET is_applied = true WHERE id = operation.id;
  END LOOP;
  
  RETURN result_content;
END;
$$ LANGUAGE plpgsql;
```

### 2.7 PRD Templates Table
```sql
CREATE TABLE prd_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  structure JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_prd_templates_organization_id (organization_id),
  INDEX idx_prd_templates_is_default (is_default)
);
```

## 3. Collaboration Tables

### 3.1 Active Sessions Table
```sql
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prd_id UUID REFERENCES prds(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- viewing, editing, ai-prompting
  cursor_position INT,
  selection_start INT,
  selection_end INT,
  socket_id VARCHAR(255),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_active_sessions_prd_id (prd_id),
  INDEX idx_active_sessions_user_id (user_id),
  INDEX idx_active_sessions_last_activity (last_activity_at)
);

-- Auto-cleanup old sessions
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM active_sessions
  WHERE last_activity_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;
```

### 3.2 Collaboration Events Table
```sql
CREATE TABLE collaboration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id UUID REFERENCES prds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- edit, comment, ai_prompt, etc.
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_collab_events_prd_id (prd_id),
  INDEX idx_collab_events_user_id (user_id),
  INDEX idx_collab_events_created_at (created_at DESC),
  INDEX idx_collab_events_type (event_type)
);

-- Partition by month for performance
CREATE TABLE collaboration_events_2024_01 PARTITION OF collaboration_events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## 4. AI Integration Tables

### 4.1 AI Interactions Table
```sql
CREATE TABLE ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id UUID REFERENCES prds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  prompt_tokens INT,
  response TEXT,
  response_tokens INT,
  model VARCHAR(100),
  status VARCHAR(50) NOT NULL, -- pending, completed, failed
  error_message TEXT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Indexes
  INDEX idx_ai_interactions_prd_id (prd_id),
  INDEX idx_ai_interactions_user_id (user_id),
  INDEX idx_ai_interactions_status (status),
  INDEX idx_ai_interactions_created_at (created_at DESC)
);
```

### 4.2 AI Suggestions Table
```sql
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id UUID REFERENCES prds(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES ai_interactions(id) ON DELETE CASCADE,
  suggestion_type VARCHAR(50), -- content, diagram, metrics, etc.
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  accepted BOOLEAN,
  accepted_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_ai_suggestions_prd_id (prd_id),
  INDEX idx_ai_suggestions_interaction_id (interaction_id),
  INDEX idx_ai_suggestions_accepted (accepted)
);
```

## 5. Activity and Audit Tables

### 5.1 Activity Log Table
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL, -- prd, project, user, etc.
  resource_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- created, updated, deleted, etc.
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_activity_logs_organization_id (organization_id),
  INDEX idx_activity_logs_user_id (user_id),
  INDEX idx_activity_logs_resource (resource_type, resource_id),
  INDEX idx_activity_logs_created_at (created_at DESC)
);

-- Partition by month
CREATE TABLE activity_logs_2024_01 PARTITION OF activity_logs
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 5.2 Audit Trail Table
```sql
CREATE TABLE audit_trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_audit_trails_table_record (table_name, record_id),
  INDEX idx_audit_trails_changed_at (changed_at DESC)
);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_trails (table_name, record_id, operation, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_trails (table_name, record_id, operation, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), NEW.updated_by);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_trails (table_name, record_id, operation, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## 6. Integration Tables

### 6.1 Integrations Table
```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- jira, confluence, slack, mattermost, teams, craft, etc.
  config JSONB NOT NULL, -- encrypted sensitive data
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique integration per org
  UNIQUE (organization_id, type),
  
  -- Indexes
  INDEX idx_integrations_organization_id (organization_id),
  INDEX idx_integrations_type (type),
  INDEX idx_integrations_is_active (is_active)
);
```

### 6.2 Integration Mappings Table
```sql
CREATE TABLE integration_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  prd_id UUID REFERENCES prds(id) ON DELETE CASCADE,
  external_id VARCHAR(255) NOT NULL,
  external_type VARCHAR(50), -- issue, page, etc.
  sync_status VARCHAR(50) DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_integration_mappings_integration_id (integration_id),
  INDEX idx_integration_mappings_prd_id (prd_id),
  INDEX idx_integration_mappings_external_id (external_id)
);
```

## 7. Notification Tables

### 7.1 Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_is_read (is_read),
  INDEX idx_notifications_created_at (created_at DESC)
);
```

### 7.2 Notification Preferences Table
```sql
CREATE TABLE notification_preferences (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL, -- email, in-app, slack, mattermost, teams
  event_type VARCHAR(50) NOT NULL, -- prd_created, comment_added, etc.
  enabled BOOLEAN DEFAULT true,
  
  PRIMARY KEY (user_id, channel, event_type),
  INDEX idx_notification_prefs_user_id (user_id)
);
```

## 8. Performance Views

### 8.1 PRD Summary View
```sql
CREATE MATERIALIZED VIEW prd_summaries AS
SELECT 
  p.id,
  p.project_id,
  p.title,
  p.status,
  p.current_version,
  p.created_at,
  p.updated_at,
  u.name as created_by_name,
  u.avatar_url as created_by_avatar,
  COUNT(DISTINCT pv.id) as version_count,
  COUNT(DISTINCT ce.user_id) as collaborator_count,
  MAX(ce.created_at) as last_activity_at
FROM prds p
LEFT JOIN users u ON p.created_by = u.id
LEFT JOIN prd_versions pv ON p.id = pv.prd_id
LEFT JOIN collaboration_events ce ON p.id = ce.prd_id
GROUP BY p.id, u.name, u.avatar_url;

-- Refresh every hour
CREATE INDEX idx_prd_summaries_project_id ON prd_summaries(project_id);
CREATE INDEX idx_prd_summaries_status ON prd_summaries(status);
CREATE INDEX idx_prd_summaries_last_activity ON prd_summaries(last_activity_at DESC);
```

### 8.2 User Activity View
```sql
CREATE MATERIALIZED VIEW user_activity_summary AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT p.id) as prds_created,
  COUNT(DISTINCT pv.id) as versions_created,
  COUNT(DISTINCT ai.id) as ai_prompts,
  COUNT(DISTINCT ce.id) as collaboration_events,
  MAX(GREATEST(
    p.created_at,
    pv.created_at,
    ai.created_at,
    ce.created_at
  )) as last_active_at
FROM users u
LEFT JOIN prds p ON u.id = p.created_by
LEFT JOIN prd_versions pv ON u.id = pv.created_by
LEFT JOIN ai_interactions ai ON u.id = ai.user_id
LEFT JOIN collaboration_events ce ON u.id = ce.user_id
GROUP BY u.id;

CREATE INDEX idx_user_activity_user_id ON user_activity_summary(user_id);
CREATE INDEX idx_user_activity_last_active ON user_activity_summary(last_active_at DESC);
```

## 9. Database Functions

### 9.1 Version Increment Function
```sql
CREATE OR REPLACE FUNCTION increment_version(
  current_version VARCHAR(20),
  change_type VARCHAR(10) -- major, minor, patch
) RETURNS VARCHAR(20) AS $$
DECLARE
  parts TEXT[];
  major INT;
  minor INT;
  patch INT;
BEGIN
  parts := string_to_array(current_version, '.');
  major := parts[1]::INT;
  minor := parts[2]::INT;
  patch := parts[3]::INT;
  
  CASE change_type
    WHEN 'major' THEN
      major := major + 1;
      minor := 0;
      patch := 0;
    WHEN 'minor' THEN
      minor := minor + 1;
      patch := 0;
    WHEN 'patch' THEN
      patch := patch + 1;
  END CASE;
  
  RETURN major || '.' || minor || '.' || patch;
END;
$$ LANGUAGE plpgsql;
```

### 9.2 Search Function
```sql
CREATE OR REPLACE FUNCTION search_prds(
  search_query TEXT,
  project_id_filter UUID DEFAULT NULL,
  status_filter VARCHAR(50) DEFAULT NULL,
  limit_count INT DEFAULT 20,
  offset_count INT DEFAULT 0
) RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  content TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    ts_rank(p.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM prds p
  WHERE 
    p.search_vector @@ plainto_tsquery('english', search_query)
    AND (project_id_filter IS NULL OR p.project_id = project_id_filter)
    AND (status_filter IS NULL OR p.status = status_filter)
  ORDER BY rank DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
```

## 10. Maintenance Scripts

### 10.1 Regular Cleanup
```sql
-- Schedule these with pg_cron or external scheduler

-- Clean up old sessions
DELETE FROM active_sessions 
WHERE last_activity_at < NOW() - INTERVAL '1 hour';

-- Archive old collaboration events
INSERT INTO collaboration_events_archive
SELECT * FROM collaboration_events 
WHERE created_at < NOW() - INTERVAL '3 months';

DELETE FROM collaboration_events 
WHERE created_at < NOW() - INTERVAL '3 months';

-- Refresh materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY prd_summaries;
REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;

-- Vacuum and analyze
VACUUM ANALYZE prds;
VACUUM ANALYZE prd_versions;
VACUUM ANALYZE collaboration_events;
```