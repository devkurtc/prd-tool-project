# Enhanced Security Specifications - PRD Tool

## 1. Content Security Policy (CSP)

### 1.1 CSP Header Configuration
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.prdtool.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https://cdn.prdtool.com https://*.amazonaws.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' wss://api.prdtool.com https://api.openai.com https://api.anthropic.com;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

### 1.2 CSP Violation Handling
- Log all CSP violations to security monitoring system
- Alert security team for repeated violations from same source
- Implement CSP report endpoint: `/api/security/csp-report`

## 2. API Key Management

### 2.1 API Key Lifecycle
```typescript
interface ApiKey {
  id: string;
  name: string;
  keyHash: string; // SHA-256 hashed
  permissions: string[];
  expiresAt: Date;
  lastUsedAt: Date;
  rotationSchedule: 'manual' | '30d' | '60d' | '90d';
  organizationId: string;
  createdBy: string;
}
```

### 2.2 Automatic Key Rotation
```typescript
// Key rotation service
class ApiKeyRotationService {
  async rotateExpiredKeys(): Promise<void> {
    const expiredKeys = await this.findKeysNeedingRotation();
    
    for (const key of expiredKeys) {
      const newKey = await this.generateNewKey(key);
      await this.notifyKeyOwner(key, newKey);
      await this.scheduleOldKeyDeletion(key, '7d');
    }
  }
  
  private async findKeysNeedingRotation(): Promise<ApiKey[]> {
    return db.apiKey.findMany({
      where: {
        OR: [
          { expiresAt: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }, // 7 days
          { lastUsedAt: { lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } // 90 days unused
        ]
      }
    });
  }
}
```

## 3. Sensitive Data Detection in AI Prompts

### 3.1 PII Detection Patterns
```typescript
class SensitiveDataScanner {
  private readonly patterns = {
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phoneNumber: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    apiKey: /\b[A-Za-z0-9]{32,}\b/g,
    awsKey: /AKIA[0-9A-Z]{16}/g
  };

  async scanPrompt(prompt: string): Promise<ScanResult> {
    const violations: Violation[] = [];
    
    for (const [type, pattern] of Object.entries(this.patterns)) {
      const matches = prompt.match(pattern);
      if (matches) {
        violations.push({
          type,
          matches: matches.map(match => this.maskSensitiveData(match)),
          count: matches.length
        });
      }
    }
    
    return {
      hasSensitiveData: violations.length > 0,
      violations,
      sanitizedPrompt: this.sanitizePrompt(prompt, violations)
    };
  }
  
  private maskSensitiveData(data: string): string {
    if (data.length <= 4) return '***';
    return data.substring(0, 2) + '*'.repeat(data.length - 4) + data.substring(data.length - 2);
  }
}
```

### 3.2 AI Prompt Sanitization
```typescript
// Middleware for AI prompt processing
export async function sanitizeAIPrompt(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { prompt } = req.body;
  
  const scanner = new SensitiveDataScanner();
  const scanResult = await scanner.scanPrompt(prompt);
  
  if (scanResult.hasSensitiveData) {
    // Log security violation
    await securityLogger.log({
      type: 'SENSITIVE_DATA_IN_AI_PROMPT',
      userId: req.user.id,
      violations: scanResult.violations,
      originalPrompt: '[REDACTED]'
    });
    
    // Option 1: Block the request
    if (scanResult.violations.some(v => v.type === 'creditCard' || v.type === 'ssn')) {
      return res.status(400).json({
        error: 'Sensitive data detected in prompt',
        violations: scanResult.violations.map(v => ({ type: v.type, count: v.count }))
      });
    }
    
    // Option 2: Use sanitized version
    req.body.prompt = scanResult.sanitizedPrompt;
    req.body.wassanitized = true;
  }
  
  next();
}
```

## 4. WebSocket Security

### 4.1 WebSocket Rate Limiting
```typescript
class WebSocketRateLimiter {
  private userLimits = new Map<string, RateLimit>();
  
  private readonly limits = {
    'operation:edit': { maxRequests: 100, windowMs: 60000 }, // 100 edits per minute
    'ai:generate': { maxRequests: 10, windowMs: 60000 },     // 10 AI requests per minute
    'presence:cursor': { maxRequests: 200, windowMs: 60000 } // 200 cursor updates per minute
  };
  
  async checkRateLimit(userId: string, eventType: string): Promise<boolean> {
    const limit = this.limits[eventType];
    if (!limit) return true;
    
    const key = `${userId}:${eventType}`;
    const userLimit = this.userLimits.get(key) || {
      count: 0,
      resetTime: Date.now() + limit.windowMs
    };
    
    if (Date.now() > userLimit.resetTime) {
      userLimit.count = 0;
      userLimit.resetTime = Date.now() + limit.windowMs;
    }
    
    if (userLimit.count >= limit.maxRequests) {
      await this.logRateLimitViolation(userId, eventType);
      return false;
    }
    
    userLimit.count++;
    this.userLimits.set(key, userLimit);
    return true;
  }
}
```

### 4.2 WebSocket Authentication
```typescript
// Enhanced WebSocket authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    
    // Check if token is revoked
    const isRevoked = await tokenRevocationService.isRevoked(decoded.jti);
    if (isRevoked) {
      return next(new Error('Token has been revoked'));
    }
    
    // Rate limit authentication attempts
    const authAttempts = await redis.get(`auth_attempts:${socket.handshake.address}`);
    if (authAttempts && parseInt(authAttempts) > 5) {
      return next(new Error('Too many authentication attempts'));
    }
    
    socket.user = decoded;
    next();
  } catch (error) {
    // Log failed authentication attempt
    await securityLogger.log({
      type: 'WEBSOCKET_AUTH_FAILED',
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      error: error.message
    });
    
    // Increment auth attempts counter
    await redis.incr(`auth_attempts:${socket.handshake.address}`);
    await redis.expire(`auth_attempts:${socket.handshake.address}`, 300); // 5 minutes
    
    next(new Error('Authentication failed'));
  }
});
```

## 5. Data Breach Detection and Response

### 5.1 Anomaly Detection
```typescript
class SecurityAnomalyDetector {
  async detectAnomalies(userId: string, action: string, metadata: any): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    // Check for unusual data access patterns
    const recentAccess = await this.getUserRecentAccess(userId, '1h');
    if (recentAccess.uniquePrds > 20) {
      alerts.push({
        type: 'UNUSUAL_DATA_ACCESS',
        severity: 'HIGH',
        message: `User accessed ${recentAccess.uniquePrds} PRDs in 1 hour`,
        userId,
        metadata: { prdCount: recentAccess.uniquePrds }
      });
    }
    
    // Check for bulk export operations
    if (action === 'bulk_export' && metadata.count > 10) {
      alerts.push({
        type: 'BULK_DATA_EXPORT',
        severity: 'CRITICAL',
        message: `User attempting to export ${metadata.count} PRDs`,
        userId,
        metadata
      });
    }
    
    // Check for unusual login patterns
    const loginPattern = await this.analyzeLoginPattern(userId);
    if (loginPattern.isAnomalous) {
      alerts.push({
        type: 'UNUSUAL_LOGIN_PATTERN',
        severity: 'MEDIUM',
        message: loginPattern.reason,
        userId
      });
    }
    
    return alerts;
  }
  
  private async analyzeLoginPattern(userId: string): Promise<{ isAnomalous: boolean; reason?: string }> {
    const recentLogins = await db.activityLog.findMany({
      where: {
        userId,
        action: 'login',
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      select: { ipAddress: true, userAgent: true, createdAt: true }
    });
    
    // Check for logins from multiple countries
    const countries = new Set(await Promise.all(
      recentLogins.map(login => this.getCountryFromIP(login.ipAddress))
    ));
    
    if (countries.size > 3) {
      return { isAnomalous: true, reason: 'Logins from multiple countries detected' };
    }
    
    // Check for rapid login attempts
    const loginTimes = recentLogins.map(l => l.createdAt.getTime());
    const rapidLogins = loginTimes.filter((time, index) => 
      index > 0 && time - loginTimes[index - 1] < 60000 // 1 minute
    );
    
    if (rapidLogins.length > 5) {
      return { isAnomalous: true, reason: 'Rapid login attempts detected' };
    }
    
    return { isAnomalous: false };
  }
}
```

### 5.2 Automated Breach Response
```typescript
class BreachResponseService {
  async handleSecurityAlert(alert: SecurityAlert): Promise<void> {
    // Log the security event
    await securityLogger.log({
      type: 'SECURITY_ALERT',
      alert,
      timestamp: new Date()
    });
    
    switch (alert.severity) {
      case 'CRITICAL':
        await this.handleCriticalAlert(alert);
        break;
      case 'HIGH':
        await this.handleHighAlert(alert);
        break;
      case 'MEDIUM':
        await this.handleMediumAlert(alert);
        break;
    }
  }
  
  private async handleCriticalAlert(alert: SecurityAlert): Promise<void> {
    // Immediately suspend user account
    await userService.suspendUser(alert.userId, 'Security alert: ' + alert.type);
    
    // Revoke all active sessions
    await sessionService.revokeAllUserSessions(alert.userId);
    
    // Notify security team immediately
    await notificationService.sendSecurityAlert({
      type: 'CRITICAL_SECURITY_BREACH',
      userId: alert.userId,
      alert,
      actions: ['User suspended', 'Sessions revoked'],
      requiresImmediate: true
    });
    
    // Start automated investigation
    await this.startSecurityInvestigation(alert);
  }
  
  private async startSecurityInvestigation(alert: SecurityAlert): Promise<void> {
    const investigation = {
      id: generateId(),
      alertId: alert.id,
      userId: alert.userId,
      status: 'ACTIVE',
      findings: [],
      timeline: []
    };
    
    // Collect user activity data
    const userActivity = await this.collectUserActivity(alert.userId, '24h');
    investigation.findings.push({
      type: 'USER_ACTIVITY',
      data: userActivity,
      timestamp: new Date()
    });
    
    // Check for correlated alerts
    const correlatedAlerts = await this.findCorrelatedAlerts(alert);
    if (correlatedAlerts.length > 0) {
      investigation.findings.push({
        type: 'CORRELATED_ALERTS',
        data: correlatedAlerts,
        timestamp: new Date()
      });
    }
    
    await db.securityInvestigation.create({ data: investigation });
  }
}
```

## 6. Encryption and Key Management

### 6.1 Database Encryption
```sql
-- Enable transparent data encryption
ALTER DATABASE prd_tool SET encrypted = true;

-- Encrypt sensitive columns
ALTER TABLE users 
ALTER COLUMN email SET STORAGE encrypted,
ALTER COLUMN phone SET STORAGE encrypted;

ALTER TABLE integrations
ALTER COLUMN config SET STORAGE encrypted;

-- Create encryption key rotation schedule
CREATE EVENT rotate_encryption_keys
ON SCHEDULE EVERY 90 DAY
DO CALL rotate_database_encryption_keys();
```

### 6.2 Application-Level Encryption
```typescript
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivation = 'pbkdf2';
  
  async encryptSensitiveData(data: string, context: string): Promise<EncryptedData> {
    const key = await this.deriveKey(context);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from(context));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex'),
      algorithm: this.algorithm,
      context
    };
  }
  
  async decryptSensitiveData(encryptedData: EncryptedData): Promise<string> {
    const key = await this.deriveKey(encryptedData.context);
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from(encryptedData.context));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  private async deriveKey(context: string): Promise<Buffer> {
    const salt = crypto.createHash('sha256').update(context).digest();
    return crypto.pbkdf2Sync(process.env.ENCRYPTION_PASSWORD, salt, 100000, 32, 'sha256');
  }
}
```

## 7. Security Monitoring and Alerting

### 7.1 Real-time Security Dashboard
```typescript
class SecurityDashboardService {
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const [
      authFailures,
      rateLimitViolations,
      activeAlerts,
      suspiciousActivity
    ] = await Promise.all([
      this.getAuthFailures('1h'),
      this.getRateLimitViolations('1h'),
      this.getActiveSecurityAlerts(),
      this.getSuspiciousActivity('24h')
    ]);
    
    return {
      authFailures: {
        count: authFailures.length,
        trend: await this.calculateTrend(authFailures, '1h'),
        topSources: this.getTopSources(authFailures)
      },
      rateLimitViolations: {
        count: rateLimitViolations.length,
        byEndpoint: this.groupByEndpoint(rateLimitViolations)
      },
      activeAlerts: {
        critical: activeAlerts.filter(a => a.severity === 'CRITICAL').length,
        high: activeAlerts.filter(a => a.severity === 'HIGH').length,
        medium: activeAlerts.filter(a => a.severity === 'MEDIUM').length
      },
      suspiciousActivity: {
        events: suspiciousActivity.length,
        affectedUsers: new Set(suspiciousActivity.map(a => a.userId)).size
      }
    };
  }
}
```

This enhanced security specification provides comprehensive protection for the PRD Tool while maintaining usability and performance.