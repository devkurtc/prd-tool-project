import { z } from 'zod'
import { logger } from './logger.js'

const envSchema = z.object({
  // Required environment variables
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  
  // Redis
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // AI Services (optional for development)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().transform(Number).default('1025'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().default('noreply@prd-tool.dev'),
  
  // Security
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  UPLOAD_PATH: z.string().default('./uploads'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('./logs/app.log'),
  
  // Feature Flags
  ENABLE_AI_FEATURES: z.string().transform(val => val === 'true').default('true'),
  ENABLE_REAL_TIME: z.string().transform(val => val === 'true').default('true'),
  ENABLE_FILE_UPLOAD: z.string().transform(val => val === 'true').default('true'),
  ENABLE_EMAIL_NOTIFICATIONS: z.string().transform(val => val === 'true').default('false'),
  
  // Frontend URL
  FRONTEND_URL: z.string().url().default('http://localhost:5173')
})

export type EnvConfig = z.infer<typeof envSchema>

export function validateEnv(): EnvConfig {
  try {
    const parsed = envSchema.parse(process.env)
    
    // Additional validations
    if (parsed.NODE_ENV === 'production') {
      // Production-specific validations
      if (parsed.JWT_SECRET.length < 64) {
        throw new Error('JWT_SECRET should be at least 64 characters in production')
      }
      
      if (parsed.JWT_REFRESH_SECRET.length < 64) {
        throw new Error('JWT_REFRESH_SECRET should be at least 64 characters in production')
      }
      
      if (!parsed.OPENAI_API_KEY && !parsed.ANTHROPIC_API_KEY) {
        logger.warn('No AI API keys configured - AI features will be disabled')
      }
    }
    
    // Development warnings
    if (parsed.NODE_ENV === 'development') {
      if (!parsed.OPENAI_API_KEY && !parsed.ANTHROPIC_API_KEY) {
        logger.warn('No AI API keys configured - AI features will be disabled')
      }
    }
    
    logger.info('Environment validation successful', {
      nodeEnv: parsed.NODE_ENV,
      port: parsed.PORT,
      aiEnabled: !!(parsed.OPENAI_API_KEY || parsed.ANTHROPIC_API_KEY),
      realTimeEnabled: parsed.ENABLE_REAL_TIME,
      logLevel: parsed.LOG_LEVEL
    })
    
    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n')
      
      logger.error('Environment validation failed:', errorMessage)
      throw new Error(`Environment validation failed:\n${errorMessage}`)
    }
    
    logger.error('Unexpected error during environment validation:', error)
    throw error
  }
}

// Export validated environment for use in other modules
export const env = validateEnv()