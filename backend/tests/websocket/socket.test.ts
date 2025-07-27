import { Server } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { io as ioClient, Socket } from 'socket.io-client'
import { SocketManager } from '../../src/websocket/socketManager'
import { prisma } from '../../src/db/client'
import { authService } from '../../src/services/authService'
import bcrypt from 'bcryptjs'

describe('WebSocket Collaboration', () => {
  let httpServer: Server
  let socketManager: SocketManager
  let testUser1: any
  let testUser2: any
  let testPRD: any
  let authToken1: string
  let authToken2: string
  let clientSocket1: Socket
  let clientSocket2: Socket

  beforeAll(async () => {
    // Create HTTP server for testing
    httpServer = new Server()
    socketManager = new SocketManager(httpServer)
    
    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        resolve()
      })
    })
  })

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

    // Create test users
    const hashedPassword = await bcrypt.hash('testpass123', 10)
    
    testUser1 = await prisma.user.create({
      data: {
        email: 'user1@example.com',
        name: 'User One',
        password: hashedPassword
      }
    })

    testUser2 = await prisma.user.create({
      data: {
        email: 'user2@example.com',
        name: 'User Two',
        password: hashedPassword
      }
    })

    // Create test PRD
    testPRD = await prisma.pRD.create({
      data: {
        title: 'Test PRD',
        description: 'Test PRD for collaboration',
        content: '# Test PRD\n\nThis is a test PRD for collaboration.',
        authorId: testUser1.id
      }
    })

    // Add user2 as collaborator
    await prisma.collaborator.create({
      data: {
        userId: testUser2.id,
        prdId: testPRD.id,
        role: 'EDITOR'
      }
    })

    // Get auth tokens
    const loginResult1 = await authService.login('user1@example.com', 'testpass123')
    const loginResult2 = await authService.login('user2@example.com', 'testpass123')
    
    authToken1 = loginResult1.token!
    authToken2 = loginResult2.token!
  })

  afterEach(async () => {
    // Disconnect clients
    if (clientSocket1?.connected) {
      clientSocket1.disconnect()
    }
    if (clientSocket2?.connected) {
      clientSocket2.disconnect()
    }
  })

  afterAll(async () => {
    httpServer.close()
    await prisma.$disconnect()
  })

  const connectClient = (token: string): Promise<Socket> => {
    return new Promise((resolve, reject) => {
      const address = httpServer.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Invalid server address'))
        return
      }

      const client = ioClient(`http://localhost:${address.port}`, {
        auth: { token },
        transports: ['websocket']
      })

      client.on('connect', () => resolve(client))
      client.on('connect_error', reject)
    })
  }

  describe('Authentication', () => {
    it('should connect with valid token', async () => {
      clientSocket1 = await connectClient(authToken1)
      expect(clientSocket1.connected).toBe(true)
    })

    it('should reject connection without token', async () => {
      await expect(connectClient('')).rejects.toThrow()
    })

    it('should reject connection with invalid token', async () => {
      await expect(connectClient('invalid-token')).rejects.toThrow()
    })
  })

  describe('Room Management', () => {
    beforeEach(async () => {
      clientSocket1 = await connectClient(authToken1)
      clientSocket2 = await connectClient(authToken2)
    })

    it('should join PRD room successfully', (done) => {
      clientSocket1.emit('join-prd', { prdId: testPRD.id })

      clientSocket1.on('document-state', (data) => {
        expect(data.content).toBe('# Test PRD\n\nThis is a test PRD for collaboration.')
        expect(data.version).toBe(1)
        expect(data.prdInfo.id).toBe(testPRD.id)
        done()
      })
    })

    it('should notify other users when joining', (done) => {
      let joinCount = 0

      const checkComplete = () => {
        joinCount++
        if (joinCount === 2) done()
      }

      clientSocket2.on('user-joined', (data) => {
        expect(data.user.email).toBe('user1@example.com')
        checkComplete()
      })

      clientSocket1.on('room-users', (data) => {
        expect(data.users).toHaveLength(1)
        expect(data.users[0].email).toBe('user1@example.com')
        checkComplete()
      })

      // User1 joins first
      clientSocket1.emit('join-prd', { prdId: testPRD.id })
      
      // User2 joins after a delay
      setTimeout(() => {
        clientSocket2.emit('join-prd', { prdId: testPRD.id })
      }, 100)
    })

    it('should deny access to unauthorized PRD', (done) => {
      // Create a private PRD for user1 only
      prisma.pRD.create({
        data: {
          title: 'Private PRD',
          authorId: testUser1.id,
          isPublic: false
        }
      }).then((privatePRD) => {
        clientSocket2.emit('join-prd', { prdId: privatePRD.id })

        clientSocket2.on('error', (error) => {
          expect(error.code).toBe('ACCESS_DENIED')
          done()
        })
      })
    })
  })

  describe('Real-time Collaboration', () => {
    beforeEach(async () => {
      clientSocket1 = await connectClient(authToken1)
      clientSocket2 = await connectClient(authToken2)

      // Both users join the PRD
      await Promise.all([
        new Promise<void>((resolve) => {
          clientSocket1.emit('join-prd', { prdId: testPRD.id })
          clientSocket1.on('document-state', () => resolve())
        }),
        new Promise<void>((resolve) => {
          clientSocket2.emit('join-prd', { prdId: testPRD.id })
          clientSocket2.on('document-state', () => resolve())
        })
      ])
    })

    it('should broadcast cursor position updates', (done) => {
      const cursorPosition = { line: 1, column: 5 }

      clientSocket2.on('cursor-update', (data) => {
        expect(data.user.email).toBe('user1@example.com')
        expect(data.position).toEqual(cursorPosition)
        done()
      })

      clientSocket1.emit('cursor-position', {
        prdId: testPRD.id,
        position: cursorPosition
      })
    })

    it('should handle typing indicators', (done) => {
      let eventsReceived = 0

      const checkComplete = () => {
        eventsReceived++
        if (eventsReceived === 2) done()
      }

      clientSocket2.on('user-typing-start', (data) => {
        expect(data.userId).toBe(testUser1.id)
        expect(data.userName).toBe('User One')
        checkComplete()
      })

      clientSocket2.on('user-typing-stop', (data) => {
        expect(data.userId).toBe(testUser1.id)
        checkComplete()
      })

      // Start typing
      clientSocket1.emit('typing-start', { prdId: testPRD.id })

      // Stop typing after delay
      setTimeout(() => {
        clientSocket1.emit('typing-stop', { prdId: testPRD.id })
      }, 100)
    })

    it('should apply content operations', (done) => {
      const operation = {
        type: 'insert' as const,
        position: 0,
        content: 'NEW: ',
        userId: testUser1.id,
        timestamp: new Date()
      }

      clientSocket2.on('operation-applied', (data) => {
        expect(data.operation.type).toBe('insert')
        expect(data.operation.content).toBe('NEW: ')
        expect(data.authorName).toBe('User One')
        expect(data.version).toBe(2)
        done()
      })

      clientSocket1.emit('content-change', {
        prdId: testPRD.id,
        operation,
        version: 1
      })
    })

    it('should handle version conflicts', (done) => {
      const operation = {
        type: 'insert' as const,
        position: 0,
        content: 'CONFLICT: ',
        userId: testUser1.id,
        timestamp: new Date()
      }

      clientSocket1.on('version-conflict', (data) => {
        expect(data.expectedVersion).toBe(5) // Wrong version
        expect(data.currentVersion).toBe(1) // Actual version
        done()
      })

      // Send operation with wrong version
      clientSocket1.emit('content-change', {
        prdId: testPRD.id,
        operation,
        version: 5 // Wrong version
      })
    })
  })

  describe('Document Persistence', () => {
    beforeEach(async () => {
      clientSocket1 = await connectClient(authToken1)
      
      await new Promise<void>((resolve) => {
        clientSocket1.emit('join-prd', { prdId: testPRD.id })
        clientSocket1.on('document-state', () => resolve())
      })
    })

    it('should save document to database', (done) => {
      clientSocket1.on('document-saved', async (data) => {
        expect(data.user.id).toBe(testUser1.id)
        expect(data.version).toBeDefined()

        // Verify saved in database
        const updatedPRD = await prisma.pRD.findUnique({
          where: { id: testPRD.id }
        })
        
        expect(updatedPRD?.content).toBeDefined()
        done()
      })

      clientSocket1.emit('save-document', { prdId: testPRD.id })
    })
  })

  describe('Presence Management', () => {
    beforeEach(async () => {
      clientSocket1 = await connectClient(authToken1)
      clientSocket2 = await connectClient(authToken2)
    })

    it('should track user presence in room', async () => {
      // Both users join
      await Promise.all([
        new Promise<void>((resolve) => {
          clientSocket1.emit('join-prd', { prdId: testPRD.id })
          clientSocket1.on('document-state', () => resolve())
        }),
        new Promise<void>((resolve) => {
          clientSocket2.emit('join-prd', { prdId: testPRD.id })
          clientSocket2.on('document-state', () => resolve())
        })
      ])

      // Check room users
      const roomUsers = socketManager.getRoomUsers(testPRD.id)
      expect(roomUsers).toHaveLength(2)
      expect(roomUsers.map(u => u.email)).toContain('user1@example.com')
      expect(roomUsers.map(u => u.email)).toContain('user2@example.com')
    })

    it('should notify when user leaves', (done) => {
      clientSocket1.emit('join-prd', { prdId: testPRD.id })
      clientSocket2.emit('join-prd', { prdId: testPRD.id })

      clientSocket2.on('user-left', (data) => {
        expect(data.user.email).toBe('user1@example.com')
        done()
      })

      // User1 leaves after delay
      setTimeout(() => {
        clientSocket1.emit('leave-prd', { prdId: testPRD.id })
      }, 100)
    })
  })
})