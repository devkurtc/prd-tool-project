import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { TextOperation } from 'ot'
import { logger } from '../utils/logger.js'
import { collaborationService } from '../services/collaborationService.js'

interface UserInfo {
  id: string
  name: string
  email: string
}

interface RoomUser {
  socketId: string
  user: UserInfo
  cursor?: { line: number; column: number }
}

export class SocketManager {
  private io: SocketIOServer
  private rooms: Map<string, Map<string, RoomUser>> = new Map()

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
      }
    })

    this.setupEventHandlers()
    logger.info('WebSocket server initialized')
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`New WebSocket connection: ${socket.id}`)

      socket.on('auth', (data: { user: UserInfo }) => {
        socket.data.user = data.user
        logger.info(`User authenticated: ${data.user.email}`)
      })

      socket.on('join-prd', async (data: { prdId: string }) => {
        const { prdId } = data
        const user = socket.data.user

        if (!user) {
          socket.emit('error', { message: 'Not authenticated' })
          return
        }

        // Leave any previous rooms
        const rooms = Array.from(socket.rooms)
        rooms.forEach(room => {
          if (room !== socket.id && room.startsWith('prd-')) {
            this.handleLeaveRoom(socket, room)
          }
        })

        // Join new room
        const roomName = `prd-${prdId}`
        socket.join(roomName)

        // Add user to room tracking
        if (!this.rooms.has(roomName)) {
          this.rooms.set(roomName, new Map())
        }
        
        const roomUsers = this.rooms.get(roomName)!
        roomUsers.set(socket.id, {
          socketId: socket.id,
          user
        })

        // Notify others in the room
        socket.to(roomName).emit('user-joined', {
          user,
          activeUsers: Array.from(roomUsers.values()).map(ru => ru.user)
        })

        // Send current users to the new joiner
        socket.emit('room-users', {
          users: Array.from(roomUsers.values()).map(ru => ru.user)
        })

        // Initialize document state for collaboration
        try {
          const docState = await collaborationService.initializeDocument(prdId)
          socket.emit('document-state', {
            content: docState.content,
            version: docState.version
          })
        } catch (error) {
          logger.error('Failed to initialize document', { prdId, error })
          socket.emit('error', { message: 'Failed to load document' })
        }

        logger.info(`User ${user.email} joined PRD ${prdId}`)
      })

      socket.on('cursor-position', (data: { prdId: string; position: { line: number; column: number } }) => {
        const { prdId, position } = data
        const user = socket.data.user
        const roomName = `prd-${prdId}`

        if (!user || !socket.rooms.has(roomName)) {
          return
        }

        const roomUsers = this.rooms.get(roomName)
        if (roomUsers) {
          const roomUser = roomUsers.get(socket.id)
          if (roomUser) {
            roomUser.cursor = position
          }
        }

        // Broadcast cursor position to others in the room
        socket.to(roomName).emit('cursor-update', {
          user,
          position
        })
      })

      socket.on('operation', (data: { 
        prdId: string
        operation: any // Will be deserialized to TextOperation
        version: number 
      }) => {
        const { prdId, operation, version } = data
        const user = socket.data.user
        const roomName = `prd-${prdId}`

        if (!user || !socket.rooms.has(roomName)) {
          return
        }

        try {
          // Deserialize operation
          const textOp = TextOperation.fromJSON(operation)
          
          // Apply operation
          const result = collaborationService.applyOperation(prdId, textOp, version)
          
          // Send acknowledgment to sender
          socket.emit('operation-ack', {
            version: result.version
          })
          
          // Broadcast to others (send transformed operation if needed)
          const broadcastOp = result.transformedOp || textOp
          socket.to(roomName).emit('operation', {
            operation: broadcastOp.toJSON(),
            version: result.version,
            user
          })
          
        } catch (error) {
          logger.error('Failed to apply operation', { prdId, error })
          socket.emit('operation-error', { 
            message: 'Failed to apply operation',
            version 
          })
        }
      })

      socket.on('save-document', async (data: { prdId: string }) => {
        const { prdId } = data
        const user = socket.data.user
        const roomName = `prd-${prdId}`

        if (!user || !socket.rooms.has(roomName)) {
          return
        }

        try {
          await collaborationService.saveToDatabase(prdId, user.id)
          
          // Notify all users in the room
          this.io.to(roomName).emit('document-saved', {
            user,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          logger.error('Failed to save document', { prdId, error })
          socket.emit('save-error', { message: 'Failed to save document' })
        }
      })

      socket.on('leave-prd', (data: { prdId: string }) => {
        const roomName = `prd-${data.prdId}`
        this.handleLeaveRoom(socket, roomName)
      })

      socket.on('disconnect', () => {
        logger.info(`WebSocket disconnected: ${socket.id}`)
        
        // Clean up from all rooms
        const rooms = Array.from(socket.rooms)
        rooms.forEach(room => {
          if (room !== socket.id && room.startsWith('prd-')) {
            this.handleLeaveRoom(socket, room)
          }
        })
      })
    })
  }

  private handleLeaveRoom(socket: Socket, roomName: string) {
    const user = socket.data.user
    
    socket.leave(roomName)
    
    const roomUsers = this.rooms.get(roomName)
    if (roomUsers) {
      roomUsers.delete(socket.id)
      
      if (roomUsers.size === 0) {
        this.rooms.delete(roomName)
      } else {
        // Notify others that user left
        socket.to(roomName).emit('user-left', {
          user,
          activeUsers: Array.from(roomUsers.values()).map(ru => ru.user)
        })
      }
    }

    if (user) {
      logger.info(`User ${user.email} left room ${roomName}`)
    }
  }

  public getIO(): SocketIOServer {
    return this.io
  }
}