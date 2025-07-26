import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../utils/logger.js'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export class AppError extends Error implements ApiError {
  public statusCode: number
  public code: string
  public isOperational: boolean

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500
  let message = error.message || 'Internal Server Error'
  let code = error.code || 'INTERNAL_ERROR'
  let details: any = undefined

  // Handle different types of errors
  if (error instanceof ZodError) {
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = 'Validation failed'
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      received: err.received
    }))
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    code = 'INVALID_TOKEN'
    message = 'Invalid authentication token'
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401
    code = 'TOKEN_EXPIRED'
    message = 'Authentication token has expired'
  } else if (error.name === 'PrismaClientKnownRequestError') {
    // Handle Prisma errors
    const prismaError = error as any
    
    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409
        code = 'DUPLICATE_ENTRY'
        message = 'A record with this information already exists'
        break
      case 'P2025':
        statusCode = 404
        code = 'RECORD_NOT_FOUND'
        message = 'The requested record was not found'
        break
      case 'P2003':
        statusCode = 400
        code = 'FOREIGN_KEY_CONSTRAINT'
        message = 'Cannot delete or update due to related records'
        break
      default:
        statusCode = 500
        code = 'DATABASE_ERROR'
        message = 'Database operation failed'
    }
  } else if (error.name === 'MulterError') {
    // Handle file upload errors
    const multerError = error as any
    
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        statusCode = 413
        code = 'FILE_TOO_LARGE'
        message = 'File size exceeds the maximum allowed limit'
        break
      case 'LIMIT_UNEXPECTED_FILE':
        statusCode = 400
        code = 'UNEXPECTED_FILE'
        message = 'Unexpected file field'
        break
      default:
        statusCode = 400
        code = 'FILE_UPLOAD_ERROR'
        message = 'File upload failed'
    }
  }

  // Log error details
  const logLevel = statusCode >= 500 ? 'error' : 'warn'
  const userId = (req as any).user?.id

  logger.log(logLevel, `${req.method} ${req.path} - ${statusCode} ${code}`, {
    userId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      message: error.message,
      stack: statusCode >= 500 ? error.stack : undefined,
      code: error.code
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query,
      params: req.params
    }
  })

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'Internal Server Error'
    details = undefined
  }

  // Send error response
  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: error.stack })
    },
    timestamp: new Date().toISOString(),
    path: req.path
  }

  res.status(statusCode).json(errorResponse)
}

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// Create specific error types
export const createError = {
  badRequest: (message = 'Bad Request', code = 'BAD_REQUEST') => 
    new AppError(message, 400, code),
  
  unauthorized: (message = 'Unauthorized', code = 'UNAUTHORIZED') => 
    new AppError(message, 401, code),
  
  forbidden: (message = 'Forbidden', code = 'FORBIDDEN') => 
    new AppError(message, 403, code),
  
  notFound: (message = 'Not Found', code = 'NOT_FOUND') => 
    new AppError(message, 404, code),
  
  conflict: (message = 'Conflict', code = 'CONFLICT') => 
    new AppError(message, 409, code),
  
  tooManyRequests: (message = 'Too Many Requests', code = 'TOO_MANY_REQUESTS') => 
    new AppError(message, 429, code),
  
  internal: (message = 'Internal Server Error', code = 'INTERNAL_ERROR') => 
    new AppError(message, 500, code)
}