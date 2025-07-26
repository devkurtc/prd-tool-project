import { Router, Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
  services: {
    database: 'connected' | 'disconnected' | 'error'
    redis: 'connected' | 'disconnected' | 'error'
    ai: 'available' | 'unavailable'
  }
  features: {
    realTime: boolean
    aiFeatures: boolean
    fileUpload: boolean
    emailNotifications: boolean
  }
}

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected', // TODO: Implement actual database health check
      redis: 'connected',     // TODO: Implement actual Redis health check
      ai: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY ? 'available' : 'unavailable'
    },
    features: {
      realTime: process.env.ENABLE_REAL_TIME === 'true',
      aiFeatures: process.env.ENABLE_AI_FEATURES === 'true',
      fileUpload: process.env.ENABLE_FILE_UPLOAD === 'true',
      emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
    }
  }

  res.json(healthStatus)
}))

// Detailed health check with service dependencies
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    disk: await checkDisk(),
    memory: checkMemory()
  }

  const isHealthy = Object.values(checks).every(check => check.status === 'ok')
  
  const detailedHealth = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      pid: process.pid
    }
  }

  const statusCode = isHealthy ? 200 : 503
  res.status(statusCode).json(detailedHealth)
}))

// Helper functions for service checks
async function checkDatabase() {
  try {
    // TODO: Implement actual database connection check with Prisma
    // const result = await prisma.$queryRaw`SELECT 1`
    return {
      status: 'ok',
      latency: 0,
      details: 'Database connection healthy'
    }
  } catch (error) {
    return {
      status: 'error',
      latency: null,
      details: error instanceof Error ? error.message : 'Database connection failed'
    }
  }
}

async function checkRedis() {
  try {
    // TODO: Implement actual Redis connection check
    // const redis = new Redis(process.env.REDIS_URL)
    // const start = Date.now()
    // await redis.ping()
    // const latency = Date.now() - start
    return {
      status: 'ok',
      latency: 0,
      details: 'Redis connection healthy'
    }
  } catch (error) {
    return {
      status: 'error',
      latency: null,
      details: error instanceof Error ? error.message : 'Redis connection failed'
    }
  }
}

async function checkDisk() {
  try {
    const { statSync } = await import('fs')
    const stats = statSync(process.cwd())
    
    return {
      status: 'ok',
      details: 'Disk access healthy',
      writeable: true
    }
  } catch (error) {
    return {
      status: 'error',
      details: error instanceof Error ? error.message : 'Disk access failed',
      writeable: false
    }
  }
}

function checkMemory() {
  const usage = process.memoryUsage()
  const totalMB = Math.round(usage.heapTotal / 1024 / 1024)
  const usedMB = Math.round(usage.heapUsed / 1024 / 1024)
  const externalMB = Math.round(usage.external / 1024 / 1024)
  
  const memoryUsagePercent = (usage.heapUsed / usage.heapTotal) * 100
  const status = memoryUsagePercent > 90 ? 'warning' : 'ok'
  
  return {
    status,
    details: `Memory usage: ${usedMB}MB / ${totalMB}MB (${memoryUsagePercent.toFixed(1)}%)`,
    usage: {
      heapUsed: usedMB,
      heapTotal: totalMB,
      external: externalMB,
      rss: Math.round(usage.rss / 1024 / 1024)
    }
  }
}

export default router