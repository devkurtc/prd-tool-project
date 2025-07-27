import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/authService.js'
import { logger } from '../utils/logger.js'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    avatarUrl?: string | null
  }
  session?: string
}

export const authenticateToken = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token required'
        }
      })
    }

    // Try JWT first
    if (token.length < 100) { // JWT tokens are typically shorter
      const decoded = await authService.verifyToken(token)
      
      if (!decoded) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Invalid or expired token'
          }
        })
      }

      // Get full user info
      const user = await authService.getUserById(decoded.userId)
      if (!user || !user.isActive) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'User account is not active'
          }
        })
      }

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    } else {
      // Try session token
      const user = await authService.validateSession(token)
      
      if (!user) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Invalid or expired session'
          }
        })
      }

      req.user = user
      req.session = token
    }

    next()
  } catch (error) {
    logger.error('Authentication error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed'
      }
    })
  }
}

export const optionalAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = await authService.verifyToken(token)
      if (decoded) {
        req.user = decoded
      }
    }

    next()
  } catch (error) {
    // Continue without authentication for optional auth
    next()
  }
}