import { z } from 'zod'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Environment schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Server
  PORT: z.string().default('3001').transform(Number),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Email
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().default('1025').transform(Number),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().default('noreply@prdtool.local'),
  
  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
})

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ')
      console.error(`❌ Invalid environment variables: ${missingVars}`)
      console.error('Please check your .env file')
      process.exit(1)
    }
    throw error
  }
}

export const env = parseEnv()

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>