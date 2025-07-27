import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { logger } from '../utils/logger.js'
import { authService } from '../services/authService.js'
import { prisma } from '../db/client.js'
import { env } from '../config/env.js'

interface UserInfo {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
}

interface RoomUser {
  socketId: string
  user: UserInfo
  cursor?: { line: number; column: number }
  lastSeen: Date
  isTyping: boolean
}

interface DocumentOperation {
  type: 'insert' | 'delete' | 'retain'
  position: number
  content?: string
  length?: number
  userId: string
  timestamp: Date
}

interface TypingIndicator {
  userId: string
  userName: string
  isTyping: boolean
  timestamp: Date
}

export class SocketManager {
  private io: SocketIOServer
  private rooms: Map<string, Map<string, RoomUser>> = new Map()
  private documentStates: Map<string, { content: string; version: number }> = new Map()
  private typingTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: env.FRONTEND_URL,
        credentials: true
      }
    })

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
        
        if (!token) {
          return next(new Error('Authentication required'))
        }

        // Try JWT first, then session token
        let user = null
        if (token.length < 100) {
          const decoded = await authService.verifyToken(token)
          if (decoded) {
            user = await authService.getUserById(decoded.userId)
          }
        } else {
          user = await authService.validateSession(token)
        }

        if (!user || !user.isActive) {
          return next(new Error('Invalid or expired token'))
        }

        socket.data.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl
        }

        next()
      } catch (error) {
        logger.error('Socket authentication error:', error)
        next(new Error('Authentication failed'))
      }
    })

    this.setupEventHandlers()
    logger.info('WebSocket server initialized with authentication')
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user as UserInfo
      logger.info(`New WebSocket connection: ${socket.id} (${user.email})`)

      socket.on('join-prd', async (data: { prdId: string }) => {
        const { prdId } = data
        const user = socket.data.user as UserInfo

        try {
          // Check if user has access to this PRD
          const prd = await prisma.pRD.findFirst({
            where: {
              id: prdId,
              OR: [
                { authorId: user.id },
                { isPublic: true },
                {
                  collaborators: {
                    some: {
                      userId: user.id
                    }
                  }
                }
              ]
            },
            include: {
              author: true,
              collaborators: {
                include: {
                  user: true
                }
              }
            }
          })

          if (!prd) {
            socket.emit('error', { 
              code: 'ACCESS_DENIED',
              message: 'You do not have access to this PRD' 
            })
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
            user,
            lastSeen: new Date(),
            isTyping: false
          })

          // Load or initialize document state
          let documentState = this.documentStates.get(prdId)
          if (!documentState) {
            documentState = {
              content: prd.content || '',
              version: 1
            }
            this.documentStates.set(prdId, documentState)
          }

          // Notify others in the room
          socket.to(roomName).emit('user-joined', {
            user,
            activeUsers: Array.from(roomUsers.values()).map(ru => ({
              ...ru.user,
              isTyping: ru.isTyping,
              cursor: ru.cursor
            }))
          })

          // Send current users to the new joiner
          socket.emit('room-users', {
            users: Array.from(roomUsers.values()).map(ru => ({
              ...ru.user,
              isTyping: ru.isTyping,
              cursor: ru.cursor
            }))
          })

          // Send current document state
          socket.emit('document-state', {
            content: documentState.content,
            version: documentState.version,
            prdInfo: {
              id: prd.id,
              title: prd.title,
              description: prd.description,
              status: prd.status,
              author: {
                id: prd.author.id,
                name: prd.author.name,
                email: prd.author.email
              }
            }
          })

          // Track activity
          await prisma.activity.create({
            data: {
              type: 'JOINED',
              userId: user.id,
              prdId: prdId,
              metadata: {
                socketId: socket.id
              }
            }
          })

          logger.info(`User ${user.email} joined PRD ${prdId}`)
        } catch (error) {
          logger.error('Error joining PRD:', error)
          socket.emit('error', { 
            code: 'JOIN_FAILED',
            message: 'Failed to join PRD' 
          })
        }
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

      // Typing indicators
      socket.on('typing-start', (data: { prdId: string }) => {
        const { prdId } = data
        const user = socket.data.user as UserInfo
        const roomName = `prd-${prdId}`

        if (!socket.rooms.has(roomName)) return

        const roomUsers = this.rooms.get(roomName)
        if (roomUsers) {
          const roomUser = roomUsers.get(socket.id)
          if (roomUser) {
            roomUser.isTyping = true
          }
        }

        socket.to(roomName).emit('user-typing-start', {
          userId: user.id,
          userName: user.name
        })

        // Clear existing timer
        const timerKey = `${socket.id}-${prdId}`
        if (this.typingTimers.has(timerKey)) {
          clearTimeout(this.typingTimers.get(timerKey)!)
        }

        // Set auto-stop typing after 3 seconds
        this.typingTimers.set(timerKey, setTimeout(() => {
          this.handleTypingStop(socket, prdId)
        }, 3000))
      })

      socket.on('typing-stop', (data: { prdId: string }) => {
        this.handleTypingStop(socket, data.prdId)
      })

      socket.on('content-change', async (data: { 
        prdId: string; 
        operation: DocumentOperation;
        version: number 
      }) => {
        const { prdId, operation, version } = data
        const user = socket.data.user as UserInfo
        const roomName = `prd-${prdId}`

        if (!socket.rooms.has(roomName)) {
          return
        }

        try {
          // Get current document state
          const documentState = this.documentStates.get(prdId)
          if (!documentState) {
            socket.emit('error', { 
              code: 'DOCUMENT_NOT_FOUND',
              message: 'Document state not found' 
            })
            return
          }

          // Version conflict check
          if (version !== documentState.version) {
            socket.emit('version-conflict', {
              expectedVersion: version,
              currentVersion: documentState.version,
              content: documentState.content
            })
            return
          }

          // Apply operation (simplified OT)
          const newContent = this.applyOperation(documentState.content, operation)
          const newVersion = documentState.version + 1

          // Update document state
          documentState.content = newContent
          documentState.version = newVersion
          
          // Broadcast operation to other users
          socket.to(roomName).emit('operation-applied', {
            operation: {
              ...operation,
              userId: user.id,
              timestamp: new Date()
            },
            version: newVersion,
            authorName: user.name
          })

          // Confirm to sender
          socket.emit('operation-acknowledged', {
            version: newVersion
          })

        } catch (error) {
          logger.error('Error applying operation:', error)
          socket.emit('error', { 
            code: 'OPERATION_FAILED',
            message: 'Failed to apply operation' 
          })
        }
      })

      socket.on('save-document', async (data: { prdId: string }) => {
        const { prdId } = data
        const user = socket.data.user as UserInfo
        const roomName = `prd-${prdId}`

        if (!socket.rooms.has(roomName)) {
          return
        }

        try {
          const documentState = this.documentStates.get(prdId)
          if (!documentState) {
            socket.emit('error', { 
              code: 'DOCUMENT_NOT_FOUND',
              message: 'Document state not found' 
            })
            return
          }

          // Save to database
          await prisma.pRD.update({
            where: { id: prdId },
            data: { 
              content: documentState.content,
              updatedAt: new Date()
            }
          })

          // Create new version
          await prisma.pRDVersion.create({
            data: {
              prdId: prdId,
              version: documentState.version,
              content: documentState.content,
              changeLog: 'Auto-save',
              authorId: user.id
            }
          })

          // Track activity
          await prisma.activity.create({
            data: {
              type: 'UPDATED',
              userId: user.id,
              prdId: prdId,
              metadata: {
                version: documentState.version,
                autoSave: true
              }
            }
          })

          // Notify all users in the room
          this.io.to(roomName).emit('document-saved', {
            user: {
              id: user.id,
              name: user.name
            },
            version: documentState.version,
            timestamp: new Date().toISOString()
          })

          logger.info(`Document ${prdId} saved by ${user.email}`)
        } catch (error) {
          logger.error('Error saving document:', error)
          socket.emit('error', { 
            code: 'SAVE_FAILED',
            message: 'Failed to save document' 
          })
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

  private handleTypingStop(socket: Socket, prdId: string) {
    const user = socket.data.user as UserInfo
    const roomName = `prd-${prdId}`
    const timerKey = `${socket.id}-${prdId}`

    if (!socket.rooms.has(roomName)) return

    const roomUsers = this.rooms.get(roomName)
    if (roomUsers) {
      const roomUser = roomUsers.get(socket.id)
      if (roomUser) {
        roomUser.isTyping = false
      }
    }

    socket.to(roomName).emit('user-typing-stop', {
      userId: user.id,
      userName: user.name
    })

    // Clear timer
    if (this.typingTimers.has(timerKey)) {
      clearTimeout(this.typingTimers.get(timerKey)!)
      this.typingTimers.delete(timerKey)
    }
  }

  private applyOperation(content: string, operation: DocumentOperation): string {
    // Simplified operational transform implementation
    // In production, use a proper OT library like ShareJS
    
    switch (operation.type) {
      case 'insert':
        if (operation.content && operation.position >= 0) {
          return content.slice(0, operation.position) + 
                 operation.content + 
                 content.slice(operation.position)
        }
        break
      case 'delete':
        if (operation.position >= 0 && operation.length && operation.length > 0) {
          return content.slice(0, operation.position) + 
                 content.slice(operation.position + operation.length)
        }
        break
      case 'retain':
        // No change for retain operations
        return content
    }
    
    return content
  }

  public getIO(): SocketIOServer {
    return this.io
  }

  public getRoomUsers(prdId: string): UserInfo[] {
    const roomName = `prd-${prdId}`
    const roomUsers = this.rooms.get(roomName)
    if (!roomUsers) return []
    
    return Array.from(roomUsers.values()).map(ru => ru.user)
  }

  public getDocumentState(prdId: string) {
    return this.documentStates.get(prdId)
  }

  public broadcastToRoom(prdId: string, event: string, data: any) {
    const roomName = `prd-${prdId}`
    this.io.to(roomName).emit(event, data)
  }
}