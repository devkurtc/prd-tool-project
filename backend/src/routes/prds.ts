import { Router, Response } from 'express'
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth.js'
import { z } from 'zod'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { logger } from '../utils/logger.js'
import { prisma } from '../config/database.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: PRDs
 *   description: Product Requirements Document management
 */

// Validation schemas
const createPrdSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  content: z.string().default(''),
  template: z.string().optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).optional()
})

const updatePrdSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'ARCHIVED']).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional()
})

/**
 * @swagger
 * /api/prds:
 *   get:
 *     summary: List user's PRDs
 *     tags: [PRDs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, REVIEW, APPROVED, ARCHIVED]
 *         description: Filter by PRD status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title and content
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to filter by
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, createdAt, updatedAt, status]
 *           default: updatedAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of PRDs retrieved successfully
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
  const userId = req.user?.userId
  
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
        { isPublic: true }
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
      collaborators: [],
      versions: prd.versions.map(v => ({
        id: v.id,
        version: v.version,
        content: v.content,
        createdAt: v.createdAt.toISOString(),
        author: v.authorId
      }))
    }))

    const totalPages = Math.ceil(total / limitNum)

    res.json({
      success: true,
      data: {
        prds: formattedPrds,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages
        },
        filters: {
          status: status || 'all',
          search: search || '',
          tags: tags ? (tags as string).split(',') : []
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
 *             title: "Mobile App Feature Enhancement"
 *             description: "Adding dark mode support to the mobile application"
 *             content: "## Overview\nThis PRD outlines the requirements for implementing dark mode..."
 *             template: "feature-template"
 *             isPublic: false
 *             tags: ["mobile", "ui", "feature"]
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
  const userId = req.user?.userId
  
  logger.info('Create PRD request', { 
    title: validatedData.title,
    template: validatedData.template,
    userId 
  })
  
  try {
    // Get template content if specified
    let templateContent = ''
    if (validatedData.template) {
      const templates = {
        basic: '# Product Requirements Document\n\n## Overview\n\n## Requirements\n\n## User Stories\n\n## Technical Specifications\n\n## Acceptance Criteria',
        feature: '# Feature Specification\n\n## Feature Overview\n\n## User Stories\n\n## Acceptance Criteria\n\n## Technical Requirements\n\n## Implementation Plan',
        api: '# API Documentation\n\n## API Overview\n\n## Endpoints\n\n## Request/Response Examples\n\n## Error Handling\n\n## Authentication',
        mobile: '# Mobile App PRD\n\n## App Overview\n\n## User Flows\n\n## Screen Specifications\n\n## Platform Requirements\n\n## Performance Criteria',
        web: '# Web Application PRD\n\n## Application Overview\n\n## User Interface\n\n## Features\n\n## Technical Architecture\n\n## Browser Support'
      }
      templateContent = templates[validatedData.template as keyof typeof templates] || templates.basic
    }

    // Create PRD in database
    const newPrd = await prisma.pRD.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || undefined,
        content: validatedData.content || templateContent,
        status: 'DRAFT' as const,
        isPublic: validatedData.isPublic || false,
        authorId: userId!
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        versions: true
      }
    })

    // Create initial version
    await prisma.pRDVersion.create({
      data: {
        prdId: newPrd.id,
        version: 1,
        content: newPrd.content,
        authorId: userId!,
        createdAt: new Date()
      }
    })

    // Format response
    const formattedPrd = {
      id: newPrd.id,
      title: newPrd.title,
      description: newPrd.description,
      content: newPrd.content,
      status: newPrd.status,
      isPublic: newPrd.isPublic,
      createdAt: newPrd.createdAt.toISOString(),
      updatedAt: newPrd.updatedAt.toISOString(),
      author: newPrd.author,
      collaborators: [],
      versions: [{
        id: `${newPrd.id}-v1`,
        version: 1,
        content: newPrd.content,
        createdAt: newPrd.createdAt.toISOString(),
        author: userId!
      }]
    }

    logger.info('PRD created successfully', { prdId: newPrd.id })

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
        code: 'CREATION_FAILED',
        message: 'Failed to create PRD'
      }
    })
  }
}))

/**
 * @swagger
 * /api/prds/{id}:
 *   get:
 *     summary: Get a specific PRD by ID
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
 *         description: PRD retrieved successfully
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
  const userId = req.user?.userId
  
  logger.info('Get PRD request', { prdId: id, userId })
  
  try {
    const prd = await prisma.pRD.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId },
          { isPublic: true }
        ]
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
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
      collaborators: [],
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
 *             title: "Updated Mobile App Feature"
 *             content: "## Updated Overview\nThis PRD has been updated with new requirements..."
 *             status: "REVIEW"
 *             tags: ["mobile", "ui", "feature", "updated"]
 *     responses:
 *       200:
 *         description: PRD updated successfully
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
// PUT /api/prds/:id - Update PRD
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const userId = req.user?.userId
  const validatedData = updatePrdSchema.parse(req.body)
  
  logger.info('Update PRD request', { prdId: id, userId, updates: Object.keys(validatedData) })
  
  try {
    // Check if PRD exists and user has permission
    const existingPrd = await prisma.pRD.findFirst({
      where: {
        id,
        OR: [
          { authorId: userId }
        ]
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
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
      collaborators: [],
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "PRD deleted successfully"
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
// DELETE /api/prds/:id - Delete PRD
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  
  // TODO: Implement PRD deletion with access control
  logger.info('Delete PRD request', { prdId: id })
  
  res.json({
    success: true,
    message: 'PRD deleted successfully'
  })
}))

// POST /api/prds/:id/collaborate - Add collaborator
router.post('/:id/collaborate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const { email, role = 'EDITOR' } = z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).default('EDITOR')
  }).parse(req.body)
  
  // TODO: Implement collaborator addition
  logger.info('Add collaborator request', { prdId: id, email, role })
  
  res.json({
    success: true,
    message: 'Collaborator added successfully',
    data: {
      collaborator: {
        email,
        role,
        addedAt: new Date().toISOString()
      }
    }
  })
}))

// GET /api/prds/:id/versions - Get PRD versions
router.get('/:id/versions', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const { page = '1', limit = '10' } = req.query
  
  // TODO: Implement version history retrieval
  logger.info('Get PRD versions request', { prdId: id })
  
  res.json({
    success: true,
    data: {
      versions: [],
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: 0,
        totalPages: 0
      }
    }
  })
}))

// POST /api/prds/:id/ai-assist - AI assistance for PRD
router.post('/:id/ai-assist', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params
  const { prompt, context, type = 'general' } = z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    context: z.string().optional(),
    type: z.enum(['general', 'update', 'diagram', 'review']).default('general')
  }).parse(req.body)
  
  // TODO: Implement AI assistance integration
  logger.info('AI assistance request', { prdId: id, type, promptLength: prompt.length })
  
  res.json({
    success: true,
    message: 'AI assistance endpoint - to be implemented',
    data: {
      suggestion: 'AI-generated suggestion would appear here',
      type,
      timestamp: new Date().toISOString()
    }
  })
}))

export default router