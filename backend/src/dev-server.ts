import 'dotenv/config'
import { createServer } from 'http'
import { logger } from './utils/logger.js'
import { app } from './app.js'

// Minimal environment setup for development
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret-key-must-be-at-least-32-characters-long-for-security'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db'

const httpServer = createServer(app)
const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  logger.info(`🚀 Development server running on port ${PORT}`)
  logger.info(`📊 Health check: http://localhost:${PORT}/health`)
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
  logger.info(`📄 OpenAPI Spec: http://localhost:${PORT}/api-docs.json`)
  logger.info(`🛡️  Security headers enabled`)
  logger.info(`⚡ Environment: ${process.env.NODE_ENV}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  httpServer.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

export { app }