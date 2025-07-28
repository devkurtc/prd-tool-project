import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { logger } from '../utils/logger.js'
import { prisma } from '../db/client.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: PRDs
 *   description: Product Requirements Document management
 */

// Validation schemas
const createPrdSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  content: z.string().optional(),
  template: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([])
})

const updatePrdSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED']).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional()
})

const addCollaboratorSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).default('VIEWER')
})

/**
 * @swagger
 * /api/prds:
 *   get:
 *     summary: List all PRDs accessible to the user
 *     tags: [PRDs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, DRAFT, REVIEW, APPROVED, ARCHIVED]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title]
 *           default: updatedAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of PRDs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PRDListResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/prds - List user's PRDs
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    page = '1', 
    limit = '20', 
    status, 
    search, 
    tags,
    sortBy = 'updatedAt',
    sortOrder = 'desc'
  } = req.query
  
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const userId = req.user?.id
  
  logger.info('List PRDs request', { 
    page: pageNum, 
    limit: limitNum, 
    status, 
    search,
    sortBy,
    sortOrder,
    userId
  })
  
  try {
    logger.info('Fetching PRDs for user', { userId })
    
    // Build where clause - simplified for current schema
    const where: any = {
      OR: [
        { authorId: userId },
        { isPublic: true },
        {
          collaborators: {
            some: {
              userId: userId
            }
          }
        }
      ]
    }
    
    logger.info('Where clause built', { where })

    // Add status filter
    if (status && status !== 'all') {
      where.status = status
    }

    // Add search filter (SQLite compatible)
    if (search) {
      where.OR.push({
        title: { contains: search }
      })
      where.OR.push({
        description: { contains: search }
      })
    }

    // Get total count for pagination
    const total = await prisma.pRD.count({ where })

    // Get PRDs with pagination
    const prds = await prisma.pRD.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      },
      orderBy: sortBy === 'title' 
        ? { title: sortOrder as 'asc' | 'desc' }
        : { updatedAt: sortOrder as 'asc' | 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum
    })

    // Format PRDs
    const formattedPrds = prds.map(prd => ({
      id: prd.id,
      title: prd.title,
      description: prd.description,
      content: prd.content,
      status: prd.status,
      isPublic: prd.isPublic,
      tags: [],
      createdAt: prd.createdAt.toISOString(),
      updatedAt: prd.updatedAt.toISOString(),
      author: prd.author,
      collaborators: prd.collaborators.map(c => ({
        id: c.user.id,
        name: c.user.name,
        email: c.user.email,
        role: c.role
      })),
      versions: prd.versions.map(v => ({
        id: v.id,
        version: v.version,
        content: v.content,
        createdAt: v.createdAt.toISOString(),
        author: v.authorId
      }))
    }))

    res.json({
      success: true,
      data: {
        prds: formattedPrds,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        filters: {
          status: status || 'all',
          search: search || '',
          tags: tags ? (Array.isArray(tags) ? tags : [tags]) : []
        }
      }
    })

  } catch (error) {
    logger.error('Error fetching PRDs:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch PRDs'
      }
    })
  }
}))

/**
 * @swagger
 * /api/prds:
 *   post:
 *     summary: Create a new PRD
 *     tags: [PRDs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePRDRequest'
 *           example:
 *             title: "Mobile App Redesign"
 *             description: "Complete redesign of the mobile application"
 *             template: "basic"
 *             isPublic: false
 *             tags: ["mobile", "ux", "redesign"]
 *     responses:
 *       201:
 *         description: PRD created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PRDResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// POST /api/prds - Create new PRD
router.post('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validatedData = createPrdSchema.parse(req.body)
  const userId = req.user?.id
  
  logger.info('Create PRD request', { userId, title: validatedData.title, template: validatedData.template })
  
  try {
    // Create PRD
    const prd = await prisma.pRD.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        content: validatedData.content || getDefaultTemplate(validatedData.template),
        status: 'DRAFT',
        isPublic: validatedData.isPublic || false,
        authorId: userId!,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Create initial version
    await prisma.pRDVersion.create({
      data: {
        prdId: prd.id,
        version: 1,
        content: prd.content,
        authorId: userId!,
        createdAt: new Date()
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'CREATED',
        prdId: prd.id,
        userId: userId!,
        metadata: { title: prd.title }
      }
    })

    logger.info('PRD created successfully', { prdId: prd.id })

    // Format response
    const formattedPrd = {
      id: prd.id,
      title: prd.title,
      description: prd.description,
      content: prd.content,
      status: prd.status,
      isPublic: prd.isPublic,
      tags: [],
      createdAt: prd.createdAt.toISOString(),
      updatedAt: prd.updatedAt.toISOString(),
      author: prd.author,
      collaborators: [],
      versions: [{
        id: prd.id + '-v1',
        version: 1,
        content: prd.content,
        createdAt: prd.createdAt.toISOString(),
        author: userId!
      }]
    }

    res.status(201).json({
      success: true,
      message: 'PRD created successfully',
      data: { prd: formattedPrd }
    })

  } catch (error) {
    logger.error('Error creating PRD:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: 'Failed to create PRD'
      }
    })
  }
}))

/**
 * @swagger
 * /api/prds/{id}:
 *   get:
 *     summary: Get a specific PRD
 *     tags: [PRDs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PRD unique identifier
 *     responses:
 *       200:
 *         description: PRD details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PRDResponse'
 *       404:
 *         description: PRD not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/prds/:id - Get specific PRD
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id
  
  logger.info('Get PRD request', { prdId: id, userId })
  
  try {
    const prd = await prisma.pRD.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId },
          { isPublic: true },
          {
            collaborators: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 5
        }
      }
    })

    if (!prd) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRD_NOT_FOUND',
          message: 'PRD not found or access denied'
        }
      })
    }

    // Format response
    const formattedPrd = {
      id: prd.id,
      title: prd.title,
      description: prd.description,
      content: prd.content,
      status: prd.status,
      isPublic: prd.isPublic,
      tags: [],
      createdAt: prd.createdAt.toISOString(),
      updatedAt: prd.updatedAt.toISOString(),
      author: prd.author,
      collaborators: prd.collaborators.map(c => ({
        id: c.user.id,
        name: c.user.name,
        email: c.user.email,
        role: c.role
      })),
      versions: prd.versions.map(v => ({
        id: v.id,
        version: v.version,
        content: v.content,
        createdAt: v.createdAt.toISOString(),
        author: v.authorId
      }))
    }

    res.json({
      success: true,
      data: { prd: formattedPrd }
    })

  } catch (error) {
    logger.error('Error fetching PRD:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch PRD'
      }
    })
  }
}))

/**
 * @swagger
 * /api/prds/{id}:
 *   put:
 *     summary: Update an existing PRD
 *     tags: [PRDs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PRD unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePRDRequest'
 *           example:
 *             title: "Updated Mobile App Redesign"
 *             content: "# Updated PRD content..."
 *             status: "REVIEW"
 *     responses:
 *       200:
 *         description: PRD updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PRDResponse'
 *       404:
 *         description: PRD not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// PUT /api/prds/:id - Update PRD
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id
  const validatedData = updatePrdSchema.parse(req.body)
  
  logger.info('Update PRD request', { prdId: id, userId, updates: Object.keys(validatedData) })
  
  try {
    // Check if PRD exists and user has permission
    const existingPrd = await prisma.pRD.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId },
          {
            collaborators: {
              some: {
                userId: userId,
                role: { in: ['EDITOR', 'ADMIN'] }
              }
            }
          }
        ]
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    })

    if (!existingPrd) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRD_NOT_FOUND',
          message: 'PRD not found or access denied'
        }
      })
    }

    // Create new version if content changed
    const currentVersion = existingPrd.versions[0]?.version || 0
    const needsNewVersion = validatedData.content && validatedData.content !== existingPrd.content
    
    // Update PRD
    const updatedPrd = await prisma.pRD.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        content: validatedData.content,
        status: validatedData.status,
        isPublic: validatedData.isPublic,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 5
        }
      }
    })

    // Create version record if content changed
    if (needsNewVersion && validatedData.content) {
      await prisma.pRDVersion.create({
        data: {
          prdId: id!,
          version: currentVersion + 1,
          content: validatedData.content!,
          authorId: userId!,
          createdAt: new Date()
        }
      })
    }

    // Format response
    const formattedPrd = {
      id: updatedPrd.id,
      title: updatedPrd.title,
      description: updatedPrd.description,
      content: updatedPrd.content,
      status: updatedPrd.status,
      isPublic: updatedPrd.isPublic,
      tags: [],
      createdAt: updatedPrd.createdAt.toISOString(),
      updatedAt: updatedPrd.updatedAt.toISOString(),
      author: updatedPrd.author,
      collaborators: updatedPrd.collaborators.map(c => ({
        id: c.user.id,
        name: c.user.name,
        email: c.user.email,
        role: c.role
      })),
      versions: (updatedPrd.versions || []).map(v => ({
        id: v.id,
        version: v.version,
        content: v.content,
        createdAt: v.createdAt.toISOString(),
        author: v.authorId
      }))
    }

    logger.info('PRD updated successfully', { prdId: id, needsNewVersion })

    res.json({
      success: true,
      message: 'PRD updated successfully',
      data: { prd: formattedPrd }
    })

  } catch (error) {
    logger.error('Error updating PRD:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: 'Failed to update PRD'
      }
    })
  }
}))

/**
 * @swagger
 * /api/prds/{id}:
 *   delete:
 *     summary: Delete a PRD
 *     tags: [PRDs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PRD unique identifier
 *     responses:
 *       200:
 *         description: PRD deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "PRD deleted successfully"
 *       404:
 *         description: PRD not found or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// DELETE /api/prds/:id - Delete PRD
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id
  
  logger.info('Delete PRD request', { prdId: id, userId })
  
  try {
    // Check if PRD exists and user has permission
    const existingPrd = await prisma.pRD.findFirst({
      where: {
        id,
        authorId: userId // Only author can delete
      }
    })

    if (!existingPrd) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRD_NOT_FOUND',
          message: 'PRD not found or access denied'
        }
      })
    }

    // Delete related records first (cascade delete)
    await prisma.$transaction(async (tx) => {
      // Delete AI interactions
      await tx.aIInteraction.deleteMany({
        where: { prdId: id }
      })
      
      // Delete activities
      await tx.activity.deleteMany({
        where: { prdId: id }
      })
      
      // Delete comments
      await tx.comment.deleteMany({
        where: { prdId: id }
      })
      
      // Delete collaborators
      await tx.collaborator.deleteMany({
        where: { prdId: id }
      })
      
      // Delete versions
      await tx.pRDVersion.deleteMany({
        where: { prdId: id }
      })
      
      // Finally delete the PRD
      await tx.pRD.delete({
        where: { id }
      })
    })

    logger.info('PRD deleted successfully', { prdId: id })

    res.json({
      success: true,
      message: 'PRD deleted successfully'
    })

  } catch (error) {
    logger.error('Error deleting PRD:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED', 
        message: 'Failed to delete PRD'
      }
    })
  }
}))

/**
 * @swagger
 * /api/prds/{id}/collaborators:
 *   post:
 *     summary: Add a collaborator to a PRD
 *     tags: [PRDs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PRD unique identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [VIEWER, EDITOR, ADMIN]
 *                 default: VIEWER
 *     responses:
 *       200:
 *         description: Collaborator added successfully
 *       400:
 *         description: User already a collaborator
 *       404:
 *         description: PRD or user not found
 */
router.post('/:id/collaborators', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.id
  const validatedData = addCollaboratorSchema.parse(req.body)
  
  logger.info('Add collaborator request', { prdId: id, userId, email: validatedData.email })
  
  try {
    // Check if user has permission (author or admin collaborator)
    const prd = await prisma.pRD.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId },
          {
            collaborators: {
              some: {
                userId: userId,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    })

    if (!prd) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRD_NOT_FOUND',
          message: 'PRD not found or insufficient permissions'
        }
      })
    }

    // Find the user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      })
    }

    // Check if already a collaborator
    const existing = await prisma.collaborator.findUnique({
      where: {
        userId_prdId: {
          userId: userToAdd.id,
          prdId: id
        }
      }
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_COLLABORATOR',
          message: 'User is already a collaborator'
        }
      })
    }

    // Add collaborator
    const collaborator = await prisma.collaborator.create({
      data: {
        userId: userToAdd.id,
        prdId: id,
        role: validatedData.role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'COLLABORATOR_ADDED',
        prdId: id,
        userId: userId!,
        metadata: {
          collaboratorEmail: validatedData.email,
          role: validatedData.role
        }
      }
    })

    res.json({
      success: true,
      message: 'Collaborator added successfully',
      data: {
        collaborator: {
          id: collaborator.user.id,
          name: collaborator.user.name,
          email: collaborator.user.email,
          role: collaborator.role
        }
      }
    })

  } catch (error) {
    logger.error('Error adding collaborator:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_COLLABORATOR_FAILED',
        message: 'Failed to add collaborator'
      }
    })
  }
}))

/**
 * @swagger
 * /api/prds/{id}/collaborators/{userId}:
 *   delete:
 *     summary: Remove a collaborator from a PRD
 *     tags: [PRDs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PRD unique identifier
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: Collaborator removed successfully
 *       404:
 *         description: PRD or collaborator not found
 */
router.delete('/:id/collaborators/:collaboratorId', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id, collaboratorId } = req.params
  const userId = req.user?.id
  
  logger.info('Remove collaborator request', { prdId: id, userId, collaboratorId })
  
  try {
    // Check if user has permission
    const prd = await prisma.pRD.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId },
          {
            collaborators: {
              some: {
                userId: userId,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    })

    if (!prd) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRD_NOT_FOUND',
          message: 'PRD not found or insufficient permissions'
        }
      })
    }

    // Remove collaborator
    const deleted = await prisma.collaborator.deleteMany({
      where: {
        prdId: id,
        userId: collaboratorId
      }
    })

    if (deleted.count === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COLLABORATOR_NOT_FOUND',
          message: 'Collaborator not found'
        }
      })
    }

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'COLLABORATOR_REMOVED',
        prdId: id,
        userId: userId!,
        metadata: {
          removedUserId: collaboratorId
        }
      }
    })

    res.json({
      success: true,
      message: 'Collaborator removed successfully'
    })

  } catch (error) {
    logger.error('Error removing collaborator:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'REMOVE_COLLABORATOR_FAILED',
        message: 'Failed to remove collaborator'
      }
    })
  }
}))

/**
 * @swagger
 * /api/prds/{id}/versions:
 *   get:
 *     summary: Get version history of a PRD
 *     tags: [PRDs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PRD unique identifier
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of PRD versions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VersionHistoryResponse'
 *       404:
 *         description: PRD not found or access denied
 *       401:
 *         description: Authentication required
 */
// GET /api/prds/:id/versions - Get version history
router.get('/:id/versions', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const { page = '1', limit = '10' } = req.query
  const userId = req.user?.id
  
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum
  
  logger.info('Get PRD versions request', { prdId: id, userId, page: pageNum, limit: limitNum })
  
  try {
    // Check access
    const prd = await prisma.pRD.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId },
          { isPublic: true }
        ]
      }
    })
    
    if (!prd) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRD_NOT_FOUND',
          message: 'PRD not found or access denied'
        }
      })
    }
    
    // Get total count
    const total = await prisma.pRDVersion.count({
      where: { prdId: id }
    })
    
    // Get versions
    const versions = await prisma.pRDVersion.findMany({
      where: { prdId: id },
      orderBy: { version: 'desc' },
      skip,
      take: limitNum
    })
    
    res.json({
      success: true,
      data: {
        versions: versions.map(v => ({
          id: v.id,
          version: v.version,
          content: v.content,
          changeLog: v.changeLog,
          createdAt: v.createdAt.toISOString(),
          author: {
            id: v.authorId
          }
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
    
  } catch (error) {
    logger.error('Error fetching versions:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch versions'
      }
    })
  }
}))

/**
 * @swagger
 * /api/prds/{id}/activity:
 *   get:
 *     summary: Get activity log for a PRD
 *     tags: [PRDs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PRD unique identifier
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of activities
 *       404:
 *         description: PRD not found or access denied
 *       401:
 *         description: Authentication required
 */
// GET /api/prds/:id/activity - Get activity log
router.get('/:id/activity', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const { page = '1', limit = '20' } = req.query
  const userId = req.user?.id
  
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  const skip = (pageNum - 1) * limitNum
  
  logger.info('Get PRD activity request', { prdId: id, userId, page: pageNum, limit: limitNum })
  
  try {
    // Check access
    const prd = await prisma.pRD.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId },
          { isPublic: true }
        ]
      }
    })
    
    if (!prd) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRD_NOT_FOUND',
          message: 'PRD not found or access denied'
        }
      })
    }
    
    // Get total count
    const total = await prisma.activity.count({
      where: { prdId: id }
    })

    // Get activities
    const activities = await prisma.activity.findMany({
      where: { prdId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    })

    res.json({
      success: true,
      data: {
        activities: activities.map(a => ({
          id: a.id,
          type: a.type,
          metadata: a.metadata,
          createdAt: a.createdAt.toISOString(),
          user: a.user
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    })
    
  } catch (error) {
    logger.error('Error fetching activity:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch activity'
      }
    })
  }
}))

// Helper function to get default template content
function getDefaultTemplate(template?: string): string {
  const templates: Record<string, string> = {
    basic: `# Product Requirements Document

## Overview
[Provide a brief overview of the product]

## Goals & Objectives
- Goal 1
- Goal 2

## User Stories
### As a [user type]
I want to [action]
So that [benefit]

## Requirements
### Functional Requirements
- Requirement 1
- Requirement 2

### Non-Functional Requirements
- Performance
- Security
- Usability

## Success Metrics
- Metric 1
- Metric 2

## Timeline
- Phase 1: [Date]
- Phase 2: [Date]
`,
    technical: `# Technical Specification

## Architecture Overview
[Describe the system architecture]

## Technology Stack
- Frontend: 
- Backend: 
- Database: 

## API Design
### Endpoints
- GET /api/resource
- POST /api/resource

## Data Models
\`\`\`json
{
  "model": "definition"
}
\`\`\`

## Security Considerations
- Authentication
- Authorization
- Data encryption

## Deployment
- Environment setup
- CI/CD pipeline
`,
    design: `# Design Document

## Design Principles
- Principle 1
- Principle 2

## User Interface
### Screens
- Screen 1
- Screen 2

### Components
- Component 1
- Component 2

## User Flows
1. Flow step 1
2. Flow step 2

## Visual Design
- Color palette
- Typography
- Iconography

## Accessibility
- WCAG compliance
- Screen reader support
`
  }

  return templates[template || 'basic'] || templates.basic
}

export default router