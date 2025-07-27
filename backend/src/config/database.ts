import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger.js'

// Global Prisma instance to prevent multiple connections
declare global {
  var __prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  // In development, use a global variable to prevent reinitializing Prisma on hot reload
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
  }
  prisma = globalThis.__prisma
}

// Handle graceful shutdown
let disconnected = false

// Only handle shutdown on explicit signals, not beforeExit
process.on('SIGINT', async () => {
  if (!disconnected) {
    disconnected = true
    logger.info('SIGINT received, disconnecting from database...')
    await prisma.$disconnect()
    process.exit(0)
  }
})

process.on('SIGTERM', async () => {
  if (!disconnected) {
    disconnected = true
    logger.info('SIGTERM received, disconnecting from database...')
    await prisma.$disconnect()
    process.exit(0)
  }
})

export { prisma }