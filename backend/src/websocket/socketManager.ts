import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
// Removed OT dependency for now - using simple content sync
import { logger } from '../utils/logger.js'
// Removed collaboration service for now - using simple sync

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

        // Send initial document state (simplified)
        socket.emit('document-state', {
          content: '',
          version: 1
        })

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

      socket.on('content-change', (data: { prdId: string; content: string; version: number }) => {
        const { prdId, content } = data
        const user = socket.data.user
        const roomName = `prd-${prdId}`

        if (!user || !socket.rooms.has(roomName)) {
          return
        }

        // Simple broadcast - no OT for now
        socket.to(roomName).emit('content-updated', {
          user,
          content: content,
          version: data.version
        })
      })

      socket.on('save-document', async (data: { prdId: string }) => {
        const { prdId } = data
        const user = socket.data.user
        const roomName = `prd-${prdId}`

        if (!user || !socket.rooms.has(roomName)) {
          return
        }

        // Simplified save - just notify for now
        this.io.to(roomName).emit('document-saved', {
          user,
          timestamp: new Date().toISOString()
        })
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