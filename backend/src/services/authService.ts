import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger.js'

const prisma = new PrismaClient()

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string
  }
  token?: string
  error?: string
}

export class AuthService {
  private jwtSecret: string
  private jwtExpiry: string

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key'
    this.jwtExpiry = process.env.JWT_EXPIRES_IN || '7d'
  }

  async register(email: string, name: string, password: string): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      })

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        this.jwtSecret,
        { expiresIn: this.jwtExpiry }
      )

      logger.info('User registered successfully', { email, userId: user.id })

      return {
        success: true,
        user,
        token
      }
    } catch (error) {
      logger.error('Registration error:', error)
      return {
        success: false,
        error: 'Registration failed'
      }
    }
  }

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password)
      
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        this.jwtSecret,
        { expiresIn: this.jwtExpiry }
      )

      logger.info('User logged in successfully', { email, userId: user.id })

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      }
    } catch (error) {
      logger.error('Login error:', error)
      return {
        success: false,
        error: 'Login failed'
      }
    }
  }

  async verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any
      return {
        userId: decoded.userId,
        email: decoded.email
      }
    } catch (error) {
      logger.warn('Invalid token:', error)
      return null
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              prds: true
            }
          }
        }
      })

      return user
    } catch (error) {
      logger.error('Error fetching user:', error)
      return null
    }
  }
}

export const authService = new AuthService()