import request from 'supertest'
import { app } from '../../src/app'
import { prisma } from '../../src/db/client'
import { authService } from '../../src/services/authService'
import bcrypt from 'bcryptjs'

describe('Authentication API', () => {
  let testUser: any
  let authToken: string

  beforeEach(async () => {
    // Clean database
    await prisma.aIInteraction.deleteMany()
    await prisma.activity.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.collaborator.deleteMany()
    await prisma.pRDVersion.deleteMany()
    await prisma.pRD.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    // Create test user
    const hashedPassword = await bcrypt.hash('testpass123', 10)
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword
      }
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'password123'
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toMatchObject({
        email: 'newuser@example.com',
        name: 'New User'
      })
      expect(response.body.data.token).toBeDefined()
    })

    it('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Another User',
          password: 'password123'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('REGISTRATION_FAILED')
    })

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'short@example.com',
          name: 'Short Pass',
          password: 'short'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          name: 'Invalid Email',
          password: 'password123'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User'
      })
      expect(response.body.data.token).toBeDefined()

      authToken = response.body.data.token
    })

    it('should fail with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('LOGIN_FAILED')
    })

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('LOGIN_FAILED')
    })

    it('should update lastLoginAt on successful login', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        })

      const updatedUser = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      })

      expect(updatedUser?.lastLoginAt).toBeDefined()
      expect(updatedUser?.lastLoginAt).toBeInstanceOf(Date)
    })
  })

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Login to get auth token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        })
      authToken = response.body.data.token
    })

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        isActive: true
      })
      expect(response.body.data.user.stats).toBeDefined()
    })

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('FORBIDDEN')
    })
  })

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        })
      authToken = response.body.data.token
    })

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Logged out successfully')
    })

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/change-password', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        })
      authToken = response.body.data.token
    })

    it('should change password successfully', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'testpass123',
          newPassword: 'newpassword123'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        })

      expect(loginResponse.status).toBe(200)
    })

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('PASSWORD_CHANGE_FAILED')
    })

    it('should validate new password length', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'testpass123',
          newPassword: 'short'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Session Management', () => {
    it('should create and validate session tokens', async () => {
      const sessionToken = await authService.createSession(testUser.id)
      expect(sessionToken).toBeDefined()

      const user = await authService.validateSession(sessionToken!)
      expect(user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name
      })
    })

    it('should logout and invalidate session', async () => {
      const sessionToken = await authService.createSession(testUser.id)
      expect(sessionToken).toBeDefined()

      const logoutSuccess = await authService.logout(sessionToken!)
      expect(logoutSuccess).toBe(true)

      const user = await authService.validateSession(sessionToken!)
      expect(user).toBeNull()
    })
  })
})