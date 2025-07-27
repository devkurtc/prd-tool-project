import { createServer } from 'http'
import { logger } from './utils/logger.js'
import { validateEnv } from './utils/validateEnv.js'
import { SocketManager } from './websocket/socketManager.js'
import { app } from './app.js'

// Validate environment variables
validateEnv()

const httpServer = createServer(app)

// Socket.IO setup with SocketManager
const socketManager = new SocketManager(httpServer)
const io = socketManager.getIO()

// Socket.IO connection handling is now managed by SocketManager

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`)
  logger.info(`📊 Health check: http://localhost:${PORT}/health`)
  logger.info(`🔌 Socket.IO enabled for real-time features`)
  logger.info(`🛡️  Security headers enabled`)
  logger.info(`⚡ Environment: ${process.env.NODE_ENV}`)
  
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
    logger.info(`📄 OpenAPI Spec: http://localhost:${PORT}/api-docs.json`)
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  httpServer.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

export { app, io }