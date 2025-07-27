import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.DATABASE_URL = 'file:./test.db'

const prisma = new PrismaClient()

// Setup test database
beforeAll(async () => {
  // Clean the database before running tests - only clean tables that exist
  try {
    await prisma.user.deleteMany()
  } catch (error) {
    // Table might not exist yet, which is fine
  }
})

// Clean up after each test
afterEach(async () => {
  try {
    await prisma.user.deleteMany()
  } catch (error) {
    // Table might not exist yet, which is fine
  }
})

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect()
})