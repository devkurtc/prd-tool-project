# Enhanced Integration Specifications - PRD Tool

## 1. Mattermost Deep Integration

### 1.1 Rich PRD Previews in Chat
```typescript
interface MattermostPRDPreview {
  title: string;
  status: 'draft' | 'review' | 'approved';
  version: string;
  author: string;
  lastModified: string;
  sections: {
    summary: string; // First 200 chars
    userStories: number; // Count
    technicalReqs: boolean; // Has content
  };
  actions: MattermostAction[];
}

interface MattermostAction {
  id: string;
  text: string;
  url?: string;
  integration?: {
    url: string;
    context: any;
  };
}
```

### 1.2 Interactive Action Buttons
```typescript
class MattermostActionHandler {
  async handlePRDAction(actionId: string, userId: string, context: any): Promise<MattermostResponse> {
    switch (actionId) {
      case 'approve_prd':
        return await this.handleApproval(context.prdId, userId);
      case 'request_changes':
        return await this.handleChangeRequest(context.prdId, userId);
      case 'view_changes':
        return await this.handleViewChanges(context.prdId, context.fromVersion);
      case 'subscribe':
        return await this.handleSubscription(context.prdId, userId);
    }
  }
  
  private async handleApproval(prdId: string, userId: string): Promise<MattermostResponse> {
    const approval = await prdService.approve(prdId, userId);
    
    return {
      response_type: 'in_channel',
      text: `✅ PRD "${approval.prd.title}" has been approved by <@${userId}>`,
      attachments: [{
        color: 'good',
        text: `Version ${approval.version} is now ready for development.`,
        actions: [{
          name: 'view_prd',
          text: 'View PRD',
          type: 'button',
          url: `${process.env.APP_URL}/prds/${prdId}`
        }]
      }]
    };
  }
}
```

### 1.3 Threaded PRD Discussions
```typescript
interface MattermostThread {
  parentPostId: string;
  prdId: string;
  section?: string; // Optional section-specific discussion
  participants: string[];
  lastActivity: Date;
}

class MattermostThreadManager {
  async createPRDThread(prdId: string, section?: string): Promise<string> {
    const prd = await prdService.getPRD(prdId);
    
    const post = await mattermostClient.createPost({
      channel_id: this.getChannelId(prd.projectId),
      message: `🧵 Discussion thread for: **${prd.title}**${section ? ` - ${section}` : ''}`,
      props: {
        prd_id: prdId,
        section: section,
        type: 'prd_discussion_thread'
      }
    });
    
    // Store thread reference for future updates
    await db.mattermostThread.create({
      data: {
        postId: post.id,
        prdId,
        section,
        channelId: this.getChannelId(prd.projectId)
      }
    });
    
    return post.id;
  }
  
  async updateThreadOnPRDChange(prdId: string, change: PRDChange): Promise<void> {
    const threads = await db.mattermostThread.findMany({
      where: { prdId }
    });
    
    for (const thread of threads) {
      const message = this.formatChangeMessage(change);
      await mattermostClient.createPost({
        channel_id: thread.channelId,
        root_id: thread.postId,
        message
      });
    }
  }
}
```

## 2. Craft.io Bidirectional Sync

### 2.1 Strategy Alignment Scoring
```typescript
interface StrategyAlignment {
  score: number; // 0-1
  factors: AlignmentFactor[];
  recommendations: string[];
  initiatives: CraftInitiative[];
}

interface AlignmentFactor {
  type: 'keywords' | 'objectives' | 'timeline' | 'priority';
  weight: number;
  score: number;
  explanation: string;
}

class CraftAlignmentAnalyzer {
  async analyzeAlignment(prdId: string): Promise<StrategyAlignment> {
    const prd = await prdService.getPRD(prdId);
    const initiatives = await craftClient.getInitiatives({
      status: 'active',
      keywords: this.extractKeywords(prd.content)
    });
    
    const alignment = await this.calculateAlignment(prd, initiatives);
    
    return {
      score: alignment.overallScore,
      factors: alignment.factors,
      recommendations: await this.generateRecommendations(alignment),
      initiatives: initiatives.slice(0, 5) // Top 5 matches
    };
  }
  
  private async calculateAlignment(prd: PRD, initiatives: CraftInitiative[]): Promise<AlignmentCalculation> {
    const factors: AlignmentFactor[] = [];
    
    // Keyword matching
    const keywordAlignment = this.calculateKeywordAlignment(prd.content, initiatives);
    factors.push({
      type: 'keywords',
      weight: 0.3,
      score: keywordAlignment.score,
      explanation: `${keywordAlignment.matches} keyword matches found`
    });
    
    // Objective alignment
    const objectiveAlignment = await this.calculateObjectiveAlignment(prd, initiatives);
    factors.push({
      type: 'objectives',
      weight: 0.4,
      score: objectiveAlignment.score,
      explanation: objectiveAlignment.explanation
    });
    
    // Timeline alignment
    const timelineAlignment = this.calculateTimelineAlignment(prd.metadata.timeline, initiatives);
    factors.push({
      type: 'timeline',
      weight: 0.2,
      score: timelineAlignment.score,
      explanation: timelineAlignment.explanation
    });
    
    // Priority alignment
    const priorityAlignment = this.calculatePriorityAlignment(prd.metadata.priority, initiatives);
    factors.push({
      type: 'priority',
      weight: 0.1,
      score: priorityAlignment.score,
      explanation: priorityAlignment.explanation
    });
    
    const overallScore = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
    
    return { overallScore, factors };
  }
}
```

### 2.2 Automated Initiative Suggestions
```typescript
class CraftSuggestionEngine {
  async generateInitiativeSuggestions(prd: PRD): Promise<InitiativeSuggestion[]> {
    const aiAnalysis = await aiService.analyze({
      prompt: `Analyze this PRD and suggest strategic initiatives:
      
      PRD Title: ${prd.title}
      Content: ${prd.content}
      
      Generate 3-5 strategic initiative suggestions that would align with this PRD.`,
      context: 'craft_initiative_suggestion'
    });
    
    const suggestions = await this.parseAISuggestions(aiAnalysis.content);
    
    // Validate against existing Craft.io initiatives
    const validatedSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => {
        const similar = await craftClient.searchInitiatives({
          query: suggestion.title,
          threshold: 0.8
        });
        
        return {
          ...suggestion,
          existingInitiatives: similar,
          confidence: this.calculateConfidence(suggestion, similar)
        };
      })
    );
    
    return validatedSuggestions.sort((a, b) => b.confidence - a.confidence);
  }
}
```

### 2.3 Progress Synchronization
```typescript
class CraftProgressSync {
  async syncPRDProgress(prdId: string): Promise<void> {
    const mapping = await db.integrationMapping.findFirst({
      where: { prdId, integration: { type: 'craft' } }
    });
    
    if (!mapping) return;
    
    const prd = await prdService.getPRD(prdId);
    const progress = this.calculatePRDProgress(prd);
    
    await craftClient.updateInitiativeProgress(mapping.externalId, {
      progress: progress.percentage,
      status: this.mapPRDStatusToCraft(prd.status),
      lastUpdate: new Date(),
      deliverables: progress.deliverables,
      blockers: progress.blockers
    });
  }
  
  private calculatePRDProgress(prd: PRD): PRDProgress {
    const sections = this.analyzePRDSections(prd.content);
    const completedSections = sections.filter(s => s.isComplete).length;
    const totalSections = sections.length;
    
    return {
      percentage: Math.round((completedSections / totalSections) * 100),
      deliverables: sections
        .filter(s => s.isDeliverable)
        .map(s => ({
          name: s.title,
          status: s.isComplete ? 'completed' : 'in_progress',
          dueDate: s.dueDate
        })),
      blockers: sections
        .filter(s => s.hasBlockers)
        .map(s => s.blockers)
        .flat()
    };
  }
}
```

## 3. Multi-Platform Notification Intelligence

### 3.1 Smart Platform Selection
```typescript
interface NotificationContext {
  urgency: 'low' | 'medium' | 'high' | 'critical';
  userPreferences: UserNotificationPrefs;
  platformAvailability: PlatformStatus[];
  messageType: string;
  recipients: string[];
}

class IntelligentNotificationRouter {
  async routeNotification(notification: Notification, context: NotificationContext): Promise<DeliveryPlan> {
    const availablePlatforms = context.platformAvailability.filter(p => p.status === 'healthy');
    
    // Determine optimal platform based on urgency and user preferences
    const platformPriority = this.calculatePlatformPriority(context);
    
    const deliveryPlan: DeliveryPlan = {
      primary: platformPriority[0],
      fallbacks: platformPriority.slice(1),
      deliveryStrategy: this.determineDeliveryStrategy(context.urgency),
      estimatedDelivery: this.estimateDeliveryTime(platformPriority[0])
    };
    
    return deliveryPlan;
  }
  
  private calculatePlatformPriority(context: NotificationContext): Platform[] {
    const weights = {
      userPreference: 0.4,
      platformReliability: 0.3,
      messageTypeOptimization: 0.2,
      recipientActivity: 0.1
    };
    
    return context.platformAvailability
      .map(platform => ({
        platform,
        score: this.calculatePlatformScore(platform, context, weights)
      }))
      .sort((a, b) => b.score - a.score)
      .map(p => p.platform);
  }
}
```

### 3.2 Cross-Platform Message Formatting
```typescript
class MessageFormatter {
  formatForPlatform(notification: Notification, platform: Platform): FormattedMessage {
    switch (platform.type) {
      case 'mattermost':
        return this.formatMattermostMessage(notification);
      case 'slack':
        return this.formatSlackMessage(notification);
      case 'teams':
        return this.formatTeamsMessage(notification);
      default:
        return this.formatGenericMessage(notification);
    }
  }
  
  private formatMattermostMessage(notification: Notification): MattermostMessage {
    const baseMessage = this.createBaseMessage(notification);
    
    return {
      text: baseMessage.text,
      attachments: [{
        color: this.getColorForType(notification.type),
        author_name: baseMessage.author,
        author_icon: baseMessage.authorAvatar,
        title: baseMessage.title,
        title_link: baseMessage.url,
        text: baseMessage.description,
        fields: this.createMattermostFields(notification),
        actions: this.createMattermostActions(notification)
      }]
    };
  }
  
  private createMattermostActions(notification: Notification): MattermostAction[] {
    const actions: MattermostAction[] = [];
    
    switch (notification.type) {
      case 'prd_approval_request':
        actions.push(
          {
            name: 'approve',
            text: '✅ Approve',
            type: 'button',
            integration: {
              url: `${process.env.API_URL}/webhooks/mattermost/approve`,
              context: { prdId: notification.data.prdId }
            }
          },
          {
            name: 'request_changes',
            text: '📝 Request Changes',
            type: 'button',
            integration: {
              url: `${process.env.API_URL}/webhooks/mattermost/request-changes`,
              context: { prdId: notification.data.prdId }
            }
          }
        );
        break;
      
      case 'prd_updated':
        actions.push({
          name: 'view_changes',
          text: '👀 View Changes',
          type: 'button',
          url: `${process.env.APP_URL}/prds/${notification.data.prdId}/versions/compare`
        });
        break;
    }
    
    return actions;
  }
}
```

### 3.3 Delivery Analytics and Optimization
```typescript
class NotificationAnalytics {
  async trackDelivery(deliveryId: string, platform: Platform, result: DeliveryResult): Promise<void> {
    await db.notificationDelivery.create({
      data: {
        deliveryId,
        platform: platform.type,
        status: result.status,
        deliveredAt: result.deliveredAt,
        readAt: result.readAt,
        errorMessage: result.error?.message,
        latencyMs: result.latencyMs,
        recipientCount: result.recipientCount
      }
    });
    
    // Update platform reliability metrics
    await this.updatePlatformMetrics(platform, result);
  }
  
  async generateDeliveryReport(timeframe: string): Promise<DeliveryReport> {
    const deliveries = await db.notificationDelivery.findMany({
      where: {
        deliveredAt: {
          gte: this.parseTimeframe(timeframe)
        }
      }
    });
    
    return {
      totalDeliveries: deliveries.length,
      successRate: this.calculateSuccessRate(deliveries),
      platformPerformance: this.calculatePlatformPerformance(deliveries),
      averageLatency: this.calculateAverageLatency(deliveries),
      failureReasons: this.analyzeFailureReasons(deliveries),
      recommendations: await this.generateOptimizationRecommendations(deliveries)
    };
  }
  
  private async generateOptimizationRecommendations(deliveries: NotificationDelivery[]): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Analyze platform reliability
    const platformReliability = this.calculatePlatformPerformance(deliveries);
    const unreliablePlatforms = Object.entries(platformReliability)
      .filter(([_, perf]) => perf.successRate < 0.95)
      .map(([platform, _]) => platform);
    
    if (unreliablePlatforms.length > 0) {
      recommendations.push(
        `Consider reducing priority for unreliable platforms: ${unreliablePlatforms.join(', ')}`
      );
    }
    
    // Analyze delivery timing
    const hourlyDistribution = this.analyzeDeliveryTiming(deliveries);
    const optimalHours = Object.entries(hourlyDistribution)
      .filter(([_, metrics]) => metrics.readRate > 0.8)
      .map(([hour, _]) => hour);
    
    if (optimalHours.length > 0) {
      recommendations.push(
        `Schedule non-urgent notifications during optimal hours: ${optimalHours.join(', ')}`
      );
    }
    
    return recommendations;
  }
}
```

## 4. API Integration Framework

### 4.1 Generic Integration Template
```typescript
abstract class BaseIntegration {
  protected config: IntegrationConfig;
  protected rateLimiter: RateLimiter;
  protected retryPolicy: RetryPolicy;
  
  constructor(config: IntegrationConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.retryPolicy = new RetryPolicy(config.retry);
  }
  
  abstract async authenticate(): Promise<AuthResult>;
  abstract async testConnection(): Promise<boolean>;
  abstract async syncData(data: any): Promise<SyncResult>;
  abstract async handleWebhook(payload: any): Promise<void>;
  
  protected async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    await this.rateLimiter.waitForToken();
    
    return await this.retryPolicy.execute(async () => {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
          ...this.config.customHeaders
        },
        body: data ? JSON.stringify(data) : undefined
      });
      
      if (!response.ok) {
        throw new IntegrationError(
          `Request failed: ${response.status} ${response.statusText}`,
          response.status
        );
      }
      
      return await response.json();
    });
  }
}
```

### 4.2 Integration Health Monitoring
```typescript
class IntegrationHealthMonitor {
  private healthChecks = new Map<string, HealthCheck>();
  
  async monitorIntegration(integration: Integration): Promise<void> {
    const healthCheck: HealthCheck = {
      integrationId: integration.id,
      lastCheck: new Date(),
      status: 'checking',
      metrics: {
        responseTime: 0,
        errorRate: 0,
        requestCount: 0
      }
    };
    
    try {
      const startTime = Date.now();
      const isHealthy = await integration.testConnection();
      const responseTime = Date.now() - startTime;
      
      healthCheck.status = isHealthy ? 'healthy' : 'unhealthy';
      healthCheck.metrics.responseTime = responseTime;
      
      // Update metrics
      await this.updateIntegrationMetrics(integration.id, healthCheck.metrics);
      
      // Alert if unhealthy
      if (!isHealthy) {
        await this.alertUnhealthyIntegration(integration, healthCheck);
      }
      
    } catch (error) {
      healthCheck.status = 'error';
      healthCheck.error = error.message;
      
      await this.handleIntegrationError(integration, error);
    }
    
    this.healthChecks.set(integration.id, healthCheck);
  }
  
  async getIntegrationHealth(integrationId: string): Promise<IntegrationHealth> {
    const metrics = await db.integrationMetric.findMany({
      where: { integrationId },
      orderBy: { createdAt: 'desc' },
      take: 100 // Last 100 data points
    });
    
    return {
      currentStatus: this.healthChecks.get(integrationId)?.status || 'unknown',
      uptime: this.calculateUptime(metrics),
      averageResponseTime: this.calculateAverageResponseTime(metrics),
      errorRate: this.calculateErrorRate(metrics),
      lastIncident: await this.getLastIncident(integrationId),
      recommendations: await this.generateHealthRecommendations(integrationId, metrics)
    };
  }
}
```

This enhanced integration specification provides deep, intelligent integration capabilities that go beyond basic notification sending to create a truly connected ecosystem.