import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

import { logger } from './utils/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { validateEnv } from './utils/validateEnv.js'

// Import routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import prdRoutes from './routes/prds.js'
import healthRoutes from './routes/health.js'

// Validate environment variables
validateEnv()

const app = express()
const httpServer = createServer(app)

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
})

// Trust proxy if behind reverse proxy
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}))

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// General middleware
app.use(compression())
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check (before other routes)
app.use('/health', healthRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/prds', prdRoutes)

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`)
  
  // Join PRD room for collaboration
  socket.on('join-prd', (prdId: string) => {
    socket.join(`prd:${prdId}`)
    socket.to(`prd:${prdId}`).emit('user-joined', { socketId: socket.id })
    logger.debug(`Socket ${socket.id} joined PRD room: ${prdId}`)
  })

  // Leave PRD room
  socket.on('leave-prd', (prdId: string) => {
    socket.leave(`prd:${prdId}`)
    socket.to(`prd:${prdId}`).emit('user-left', { socketId: socket.id })
    logger.debug(`Socket ${socket.id} left PRD room: ${prdId}`)
  })

  // Handle real-time editing operations
  socket.on('prd-operation', (data) => {
    const { prdId, operation } = data
    socket.to(`prd:${prdId}`).emit('prd-operation', {
      operation,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    })
  })

  // Handle cursor position updates
  socket.on('cursor-update', (data) => {
    const { prdId, position, user } = data
    socket.to(`prd:${prdId}`).emit('cursor-update', {
      position,
      user,
      socketId: socket.id
    })
  })

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`)
  })
})

// Error handling middleware (must be last)
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`)
  logger.info(`📊 Health check: http://localhost:${PORT}/health`)
  logger.info(`🔌 Socket.IO enabled for real-time features`)
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

export { app, io }