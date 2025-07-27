import request from 'supertest'
import { app } from '../src/app.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Authentication API', () => {
  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123'
  }

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user).toHaveProperty('email', testUser.email)
      expect(response.body.data.user).toHaveProperty('name', testUser.name)
      expect(response.body.data.user).not.toHaveProperty('password')
      expect(response.body).toHaveProperty('message', 'Registration successful')
    })

    it('should reject registration with invalid email', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' }
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject registration with short password', async () => {
      const invalidUser = { ...testUser, password: '123' }
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject registration with short name', async () => {
      const invalidUser = { ...testUser, name: 'A' }
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
    })

    it('should reject registration with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('code', 'REGISTRATION_FAILED')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(testUser)
    })

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user).toHaveProperty('email', testUser.email)
      expect(response.body.data.user).not.toHaveProperty('password')
      expect(response.body).toHaveProperty('message', 'Login successful')
    })

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('code', 'LOGIN_FAILED')
    })

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('code', 'LOGIN_FAILED')
    })

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: testUser.password
        })
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/auth/me', () => {
    let authToken: string

    beforeEach(async () => {
      // Register and login to get auth token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)

      authToken = registerResponse.body.data.token
    })

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data.user).toHaveProperty('email', testUser.email)
      expect(response.body.data.user).toHaveProperty('name', testUser.name)
      expect(response.body.data.user).toHaveProperty('stats')
      expect(response.body.data.user.stats).toHaveProperty('prdsCreated', 0)
      expect(response.body.data.user.stats).toHaveProperty('collaborations', 0)
      expect(response.body.data.user.stats).toHaveProperty('aiInteractions', 0)
      expect(response.body.data.user).not.toHaveProperty('password')
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED')
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN')
    })

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED')
    })
  })

  describe('POST /api/auth/logout', () => {
    let authToken: string

    beforeEach(async () => {
      // Register and login to get auth token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)

      authToken = registerResponse.body.data.token
    })

    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('message', 'Logged out successfully')
    })

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED')
    })

    it('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN')
    })
  })

  describe('Integration tests', () => {
    it('should complete full authentication flow', async () => {
      // 1. Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)

      const { token: registerToken } = registerResponse.body.data

      // 2. Verify profile access with registration token
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registerToken}`)
        .expect(200)

      // 3. Login with same credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200)

      const { token: loginToken } = loginResponse.body.data

      // 4. Verify profile access with login token
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200)

      // 5. Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200)

      // Note: Token should still work since we don't have blacklisting yet
      // This is mentioned as TODO in the logout endpoint
    })
  })
})