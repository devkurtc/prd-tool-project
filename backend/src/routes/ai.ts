import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { asyncHandler, createError } from '../middleware/errorHandler.js'
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth.js'
import { logger } from '../utils/logger.js'
import { prisma } from '../config/database.js'
import { aiService } from '../services/aiService.js'

const router = Router()

// Apply authentication middleware to all AI routes
router.use(authenticateToken)

// Validation schemas
const aiSuggestionSchema = z.object({
  prdId: z.string().min(1, 'PRD ID is required'),
  command: z.string().min(1, 'Command is required'),
  context: z.string().optional(),
  selection: z.object({
    startLine: z.number(),
    endLine: z.number(),
    text: z.string()
  }).optional()
})

const aiGenerateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  type: z.enum(['content', 'section', 'improvement', 'analysis']),
  context: z.string().optional()
})

// POST /api/ai/suggestion - Get AI suggestions for PRD content
router.post('/suggestion', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = aiSuggestionSchema.safeParse(req.body)
  
  if (!validation.success) {
    throw createError.badRequest('Invalid request data')
  }

  const { prdId, command, context, selection } = validation.data
  const userId = req.user!.userId
  
  // Get the PRD to provide context
  const prd = await prisma.pRD.findUnique({
    where: { id: prdId },
    select: {
      id: true,
      title: true,
      content: true,
      authorId: true,
      isPublic: true
    }
  })
  
  if (!prd) {
    throw createError.notFound('PRD not found')
  }

  // Check if user has access to this PRD
  if (!prd.isPublic && prd.authorId !== userId) {
    throw createError.forbidden('Access denied')
  }

  logger.info('AI suggestion request', { 
    prdId, 
    command, 
    userId,
    hasSelection: !!selection 
  })

  // Parse the command
  const commandMatch = command.match(/^@(\w+)(?:\s+(.+))?$/)
  if (!commandMatch) {
    throw createError.badRequest('Invalid command format. Use @command or @command description')
  }

  const [, commandType, description] = commandMatch
  
  // Generate AI suggestions using the AI service
  const suggestions = await aiService.generateSuggestion({
    command: commandType,
    description: description || '',
    prdContent: prd.content,
    context: context || '',
    selection: selection?.text || '',
    prdTitle: prd.title
  })

  res.json({
    success: true,
    data: {
      suggestions,
      command: commandType,
      description,
      timestamp: new Date().toISOString()
    }
  })
}))

// POST /api/ai/generate - Generate new content
router.post('/generate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const validation = aiGenerateSchema.safeParse(req.body)
  
  if (!validation.success) {
    throw createError.badRequest('Invalid request data')
  }

  const { prompt, type, context } = validation.data
  const userId = req.user!.userId
  
  logger.info('AI generation request', { 
    type, 
    promptLength: prompt.length,
    userId 
  })

  const content = await aiService.generateContent(prompt, {
    type,
    context: context || ''
  })

  res.json({
    success: true,
    data: {
      content,
      type,
      timestamp: new Date().toISOString()
    }
  })
}))

// GET /api/ai/commands - Get available AI commands
router.get('/commands', asyncHandler(async (req: Request, res: Response) => {
  const commands = [
    {
      command: 'update',
      description: 'Update or improve the selected content',
      examples: ['@update make this more technical', '@update add metrics']
    },
    {
      command: 'expand',
      description: 'Expand on the selected content with more details',
      examples: ['@expand with examples', '@expand technical details']
    },
    {
      command: 'summarize',
      description: 'Create a summary of the selected content',
      examples: ['@summarize in bullet points', '@summarize key points']
    },
    {
      command: 'rewrite',
      description: 'Rewrite the content in a different style or tone',
      examples: ['@rewrite more formally', '@rewrite for executives']
    },
    {
      command: 'suggest',
      description: 'Get suggestions for improving the content',
      examples: ['@suggest improvements', '@suggest best practices']
    },
    {
      command: 'analyze',
      description: 'Analyze the content for issues or improvements',
      examples: ['@analyze completeness', '@analyze technical accuracy']
    }
  ]

  res.json({
    success: true,
    data: { 
      commands,
      provider: aiService.getCurrentProvider(),
      availableProviders: aiService.getAvailableProviders()
    }
  })
}))

// GET /api/ai/status - Get AI service status
router.get('/status', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      currentProvider: aiService.getCurrentProvider(),
      availableProviders: aiService.getAvailableProviders(),
      timestamp: new Date().toISOString()
    }
  })
}))

export default router