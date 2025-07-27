import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler.js'
import { logger } from '../utils/logger.js'
import { authService } from '../services/authService.js'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization
 */

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters')
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             email: "john@example.com"
 *             name: "John Doe"
 *             password: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Registration failed (validation error or user exists)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "REGISTRATION_FAILED"
 *                 message: "User with this email already exists"
 */
// POST /api/auth/register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body)
  
  logger.info('User registration attempt', { email: validatedData.email })
  
  const result = await authService.register(
    validatedData.email,
    validatedData.name,
    validatedData.password
  )

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: result.error
      }
    })
  }

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      token: result.token
    },
    message: 'Registration successful'
  })
}))

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "john@example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Login failed (invalid credentials)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "LOGIN_FAILED"
 *                 message: "Invalid email or password"
 */
// POST /api/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body)
  
  logger.info('User login attempt', { email: validatedData.email })
  
  const result = await authService.login(
    validatedData.email,
    validatedData.password
  )

  if (!result.success) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: result.error
      }
    })
  }

  res.json({
    success: true,
    data: {
      user: result.user,
      token: result.token
    },
    message: 'Login successful'
  })
}))

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "UNAUTHORIZED"
 *                 message: "Access token required"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/auth/me
router.get('/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    })
  }

  const user = await authService.getUserById(req.user.userId)
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }
    })
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        stats: {
          prdsCreated: user._count.prds,
          collaborations: 0, // TODO: Implement collaborations count
          aiInteractions: 0  // TODO: Implement AI interactions count
        }
      }
    }
  })
}))

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// POST /api/auth/logout
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // TODO: Implement token blacklisting for enhanced security
  logger.info('User logout', { userId: req.user?.userId })
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
}))

export default router