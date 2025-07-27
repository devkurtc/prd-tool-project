import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

describe('Database Models', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.aIInteraction.deleteMany()
    await prisma.activity.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.collaborator.deleteMany()
    await prisma.pRDVersion.deleteMany()
    await prisma.pRD.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('User Model', () => {
    it('should create a user successfully', async () => {
      const hashedPassword = await bcrypt.hash('testpass', 10)
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password: hashedPassword,
        },
      })

      expect(user).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')
      expect(user.isActive).toBe(true)
    })

    it('should enforce unique email constraint', async () => {
      const hashedPassword = await bcrypt.hash('testpass', 10)
      await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          name: 'User 1',
          password: hashedPassword,
        },
      })

      await expect(
        prisma.user.create({
          data: {
            email: 'duplicate@example.com',
            name: 'User 2',
            password: hashedPassword,
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('PRD Model', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'prd-test@example.com',
          name: 'PRD Test User',
          password: 'hashed',
        },
      })
    })

    it('should create a PRD with author', async () => {
      const prd = await prisma.pRD.create({
        data: {
          title: 'Test PRD',
          description: 'Test Description',
          content: '# Test Content',
          authorId: testUser.id,
        },
        include: {
          author: true,
        },
      })

      expect(prd).toBeDefined()
      expect(prd.title).toBe('Test PRD')
      expect(prd.status).toBe('DRAFT')
      expect(prd.author.email).toBe('prd-test@example.com')
    })

    it('should cascade delete PRDs when user is deleted', async () => {
      const prd = await prisma.pRD.create({
        data: {
          title: 'Test PRD',
          authorId: testUser.id,
        },
      })

      await prisma.user.delete({
        where: { id: testUser.id },
      })

      const deletedPRD = await prisma.pRD.findUnique({
        where: { id: prd.id },
      })

      expect(deletedPRD).toBeNull()
    })
  })

  describe('Collaboration', () => {
    let owner: any
    let collaborator: any
    let prd: any

    beforeEach(async () => {
      owner = await prisma.user.create({
        data: {
          email: 'owner@example.com',
          name: 'Owner',
          password: 'hashed',
        },
      })

      collaborator = await prisma.user.create({
        data: {
          email: 'collaborator@example.com',
          name: 'Collaborator',
          password: 'hashed',
        },
      })

      prd = await prisma.pRD.create({
        data: {
          title: 'Collaborative PRD',
          authorId: owner.id,
        },
      })
    })

    it('should add collaborators to PRD', async () => {
      const collab = await prisma.collaborator.create({
        data: {
          userId: collaborator.id,
          prdId: prd.id,
          role: 'EDITOR',
        },
        include: {
          user: true,
          prd: true,
        },
      })

      expect(collab.role).toBe('EDITOR')
      expect(collab.user.email).toBe('collaborator@example.com')
      expect(collab.prd.title).toBe('Collaborative PRD')
    })

    it('should enforce unique user-prd collaboration', async () => {
      await prisma.collaborator.create({
        data: {
          userId: collaborator.id,
          prdId: prd.id,
          role: 'EDITOR',
        },
      })

      await expect(
        prisma.collaborator.create({
          data: {
            userId: collaborator.id,
            prdId: prd.id,
            role: 'VIEWER',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Activity Tracking', () => {
    let user: any
    let prd: any

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          email: 'activity-test@example.com',
          name: 'Activity User',
          password: 'hashed',
        },
      })

      prd = await prisma.pRD.create({
        data: {
          title: 'Activity Test PRD',
          authorId: user.id,
        },
      })
    })

    it('should track activities with metadata', async () => {
      const activity = await prisma.activity.create({
        data: {
          type: 'UPDATED',
          userId: user.id,
          prdId: prd.id,
          metadata: {
            changes: ['title', 'content'],
            version: 2,
          },
        },
      })

      expect(activity.type).toBe('UPDATED')
      expect(activity.metadata).toEqual({
        changes: ['title', 'content'],
        version: 2,
      })
    })
  })

  describe('AI Interactions', () => {
    let prd: any
    let user: any

    beforeEach(async () => {
      user = await prisma.user.create({
        data: {
          email: 'ai-test@example.com',
          name: 'AI Test User',
          password: 'hashed',
        },
      })

      prd = await prisma.pRD.create({
        data: {
          title: 'AI Test PRD',
          authorId: user.id,
        },
      })
    })

    it('should track AI interactions with cost', async () => {
      const interaction = await prisma.aIInteraction.create({
        data: {
          prompt: '@expand Add more technical details',
          response: 'Here are additional technical details...',
          model: 'gpt-4',
          tokens: 250,
          costCents: 0.75,
          prdId: prd.id,
        },
      })

      expect(interaction.tokens).toBe(250)
      expect(interaction.costCents).toBe(0.75)
      expect(interaction.model).toBe('gpt-4')
    })
  })
})