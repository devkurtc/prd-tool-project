import winston from 'winston'
import path from 'path'

const logLevel = process.env.LOG_LEVEL || 'info'
const logFile = process.env.LOG_FILE || './logs/app.log'

// Ensure logs directory exists
import { existsSync, mkdirSync } from 'fs'
const logDir = path.dirname(logFile)
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true })
}

// Custom format for development
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`
    }
    
    return log
  })
)

// Custom format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// Create transports
const transports: winston.transport[] = [
  // File transport for all logs
  new winston.transports.File({
    filename: logFile,
    level: logLevel,
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: productionFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
]

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: logLevel,
      format: developmentFormat
    })
  )
}

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      format: productionFormat
    })
  ],
  
  // Handle unhandled rejections
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      format: productionFormat
    })
  ]
})

// Create a stream object for Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim())
  }
}

// Helper functions for structured logging
export const loggerHelpers = {
  // Log with user context
  logWithUser: (level: string, message: string, userId?: string, meta?: any) => {
    logger.log(level, message, { userId, ...meta })
  },
  
  // Log API requests
  logApiRequest: (method: string, url: string, userId?: string, duration?: number) => {
    logger.info('API Request', {
      method,
      url,
      userId,
      duration: duration ? `${duration}ms` : undefined
    })
  },
  
  // Log database operations
  logDbOperation: (operation: string, table: string, duration?: number, error?: Error) => {
    if (error) {
      logger.error('Database Error', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined,
        error: error.message,
        stack: error.stack
      })
    } else {
      logger.debug('Database Operation', {
        operation,
        table,
        duration: duration ? `${duration}ms` : undefined
      })
    }
  },
  
  // Log AI interactions
  logAiInteraction: (provider: string, model: string, tokens: number, cost?: number, userId?: string) => {
    logger.info('AI Interaction', {
      provider,
      model,
      tokens,
      cost: cost ? `$${cost.toFixed(4)}` : undefined,
      userId
    })
  }
}