import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../db/client.js'
import { logger } from '../utils/logger.js'
import { env } from '../config/env.js'

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
    this.jwtSecret = env.JWT_SECRET
    this.jwtExpiry = env.JWT_EXPIRES_IN
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

  async createSession(userId: string): Promise<string | null> {
    try {
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

      await prisma.session.create({
        data: {
          token,
          userId,
          expiresAt
        }
      })

      return token
    } catch (error) {
      logger.error('Error creating session:', error)
      return null
    }
  }

  async validateSession(token: string) {
    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
              isActive: true
            }
          }
        }
      })

      if (!session) {
        return null
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } })
        return null
      }

      // Check if user is active
      if (!session.user.isActive) {
        return null
      }

      return session.user
    } catch (error) {
      logger.error('Error validating session:', error)
      return null
    }
  }

  async logout(token: string): Promise<boolean> {
    try {
      await prisma.session.delete({
        where: { token }
      })
      return true
    } catch (error) {
      logger.error('Error logging out:', error)
      return false
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        }
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password)
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Current password is incorrect'
        }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12)

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      })

      // Invalidate all sessions
      await prisma.session.deleteMany({
        where: { userId }
      })

      return {
        success: true
      }
    } catch (error) {
      logger.error('Error changing password:', error)
      return {
        success: false,
        error: 'Failed to change password'
      }
    }
  }
}

export const authService = new AuthService()