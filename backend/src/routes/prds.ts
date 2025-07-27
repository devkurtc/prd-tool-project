import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { logger } from '../utils/logger.js'
import { mockPRDs, getPRDById, getPRDsByUser, searchPRDs, getCurrentUser } from '../data/mockData.js'

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
router.get('/', asyncHandler(async (req: Request, res: Response) => {
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
  const currentUser = getCurrentUser()
  
  logger.info('List PRDs request', { 
    page: pageNum, 
    limit: limitNum, 
    status, 
    search,
    sortBy,
    sortOrder
  })
  
  // Get user's PRDs with search
  let prds = search ? searchPRDs(search as string, currentUser.id) : getPRDsByUser(currentUser.id)
  
  // Filter by status if specified
  if (status && status !== 'all') {
    prds = prds.filter(prd => prd.status === status)
  }
  
  // Filter by tags if specified
  if (tags) {
    const tagList = (tags as string).split(',')
    prds = prds.filter(prd => 
      tagList.some(tag => prd.tags.includes(tag))
    )
  }
  
  // Sort PRDs
  prds.sort((a, b) => {
    const aValue = sortBy === 'title' ? a.title : a.updatedAt
    const bValue = sortBy === 'title' ? b.title : b.updatedAt
    
    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : 1
    } else {
      return aValue < bValue ? -1 : 1
    }
  })
  
  // Paginate results
  const total = prds.length
  const totalPages = Math.ceil(total / limitNum)
  const startIndex = (pageNum - 1) * limitNum
  const paginatedPRDs = prds.slice(startIndex, startIndex + limitNum)
  
  res.json({
    success: true,
    data: {
      prds: paginatedPRDs,
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
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createPrdSchema.parse(req.body)
  
  // TODO: Implement PRD creation with Prisma
  logger.info('Create PRD request', { 
    title: validatedData.title,
    template: validatedData.template 
  })
  
  const newPrd = {
    id: 'temp-prd-id',
    title: validatedData.title,
    description: validatedData.description,
    content: validatedData.content,
    status: 'DRAFT',
    isPublic: validatedData.isPublic,
    tags: validatedData.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  res.status(201).json({
    success: true,
    message: 'PRD created successfully',
    data: { prd: newPrd }
  })
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
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  logger.info('Get PRD request', { prdId: id })
  
  const prd = getPRDById(id)
  
  if (!prd) {
    throw createError.notFound('PRD not found')
  }
  
  res.json({
    success: true,
    data: { prd }
  })
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
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const validatedData = updatePrdSchema.parse(req.body)
  
  // TODO: Implement PRD update with version control
  logger.info('Update PRD request', { prdId: id, updates: Object.keys(validatedData) })
  
  res.json({
    success: true,
    message: 'PRD updated successfully',
    data: {
      prd: {
        id,
        ...validatedData,
        updatedAt: new Date().toISOString()
      }
    }
  })
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
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  
  // TODO: Implement PRD deletion with access control
  logger.info('Delete PRD request', { prdId: id })
  
  res.json({
    success: true,
    message: 'PRD deleted successfully'
  })
}))

// POST /api/prds/:id/collaborate - Add collaborator
router.post('/:id/collaborate', asyncHandler(async (req: Request, res: Response) => {
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
router.get('/:id/versions', asyncHandler(async (req: Request, res: Response) => {
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
router.post('/:id/ai-assist', asyncHandler(async (req: Request, res: Response) => {
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