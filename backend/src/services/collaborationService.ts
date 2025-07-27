import { logger } from '../utils/logger.js'
import { prisma } from '../db/client.js'

interface DocumentState {
  content: string
  version: number
  lastUpdated: Date
}

export interface CollaborationPermission {
  userId: string
  prdId: string
  role: 'VIEWER' | 'EDITOR' | 'ADMIN'
}

export interface PresenceInfo {
  userId: string
  userName: string
  avatarUrl?: string | null
  lastSeen: Date
  isOnline: boolean
  cursor?: { line: number; column: number }
  selection?: { start: number; end: number }
}

class CollaborationService {
  private documents: Map<string, DocumentState> = new Map()

  async initializeDocument(prdId: string): Promise<DocumentState> {
    try {
      // Check if already initialized
      if (this.documents.has(prdId)) {
        return this.documents.get(prdId)!
      }

      // Load from database
      const prd = await prisma.pRD.findUnique({
        where: { id: prdId },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1
          }
        }
      })

      if (!prd) {
        throw new Error('PRD not found')
      }

      const state: DocumentState = {
        content: prd.content,
        version: prd.versions[0]?.version || 1,
        lastUpdated: new Date()
      }

      this.documents.set(prdId, state)
      return state
    } catch (error) {
      logger.error('Failed to initialize document', { prdId, error })
      throw error
    }
  }

  updateContent(prdId: string, content: string): { 
    content: string
    version: number
  } {
    const doc = this.documents.get(prdId)
    if (!doc) {
      throw new Error('Document not initialized')
    }

    // Simple content replacement for now
    doc.content = content
    doc.version++
    doc.lastUpdated = new Date()

    return {
      content: doc.content,
      version: doc.version
    }
  }

  async saveToDatabase(prdId: string, userId: string): Promise<void> {
    const doc = this.documents.get(prdId)
    if (!doc) {
      throw new Error('Document not initialized')
    }

    try {
      // Update PRD content
      await prisma.pRD.update({
        where: { id: prdId },
        data: {
          content: doc.content,
          updatedAt: new Date()
        }
      })

      // Create new version
      await prisma.pRDVersion.create({
        data: {
          prdId,
          version: doc.version,
          content: doc.content,
          authorId: userId
        }
      })

      logger.info('Document saved to database', { prdId, version: doc.version })
    } catch (error) {
      logger.error('Failed to save document', { prdId, error })
      throw error
    }
  }

  getDocument(prdId: string): DocumentState | undefined {
    return this.documents.get(prdId)
  }

  clearDocument(prdId: string): void {
    this.documents.delete(prdId)
  }

  async checkAccess(userId: string, prdId: string): Promise<{ hasAccess: boolean; role?: string }> {
    try {
      const prd = await prisma.pRD.findFirst({
        where: {
          id: prdId,
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
          collaborators: {
            where: { userId },
            select: { role: true }
          }
        }
      })

      if (!prd) {
        return { hasAccess: false }
      }

      // Determine role
      let role = 'VIEWER'
      if (prd.authorId === userId) {
        role = 'ADMIN'
      } else if (prd.collaborators.length > 0) {
        role = prd.collaborators[0].role
      }

      return { hasAccess: true, role }
    } catch (error) {
      logger.error('Error checking access:', error)
      return { hasAccess: false }
    }
  }

  async addCollaborator(prdId: string, userId: string, role: 'VIEWER' | 'EDITOR' | 'ADMIN' = 'VIEWER', addedBy: string) {
    try {
      // Check if the person adding has permission
      const access = await this.checkAccess(addedBy, prdId)
      if (!access.hasAccess || access.role !== 'ADMIN') {
        throw new Error('Insufficient permissions to add collaborators')
      }

      // Check if already a collaborator
      const existing = await prisma.collaborator.findUnique({
        where: {
          userId_prdId: {
            userId,
            prdId
          }
        }
      })

      if (existing) {
        // Update existing role
        await prisma.collaborator.update({
          where: { id: existing.id },
          data: { role }
        })
      } else {
        // Add new collaborator
        await prisma.collaborator.create({
          data: {
            userId,
            prdId,
            role
          }
        })
      }

      // Track activity
      await prisma.activity.create({
        data: {
          type: 'COLLABORATOR_ADDED',
          userId: addedBy,
          prdId,
          metadata: {
            collaboratorId: userId,
            role
          }
        }
      })

      return { success: true }
    } catch (error) {
      logger.error('Error adding collaborator:', error)
      throw error
    }
  }

  async getCollaborators(prdId: string) {
    try {
      const collaborators = await prisma.collaborator.findMany({
        where: { prdId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              lastLoginAt: true
            }
          }
        }
      })

      return collaborators.map(collab => ({
        id: collab.user.id,
        name: collab.user.name,
        email: collab.user.email,
        avatarUrl: collab.user.avatarUrl,
        role: collab.role,
        lastLoginAt: collab.user.lastLoginAt,
        addedAt: collab.createdAt
      }))
    } catch (error) {
      logger.error('Error getting collaborators:', error)
      return []
    }
  }

  async createComment(prdId: string, content: string, authorId: string) {
    try {
      // Check access
      const access = await this.checkAccess(authorId, prdId)
      if (!access.hasAccess) {
        throw new Error('No access to this PRD')
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          authorId,
          prdId
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          }
        }
      })

      // Track activity
      await prisma.activity.create({
        data: {
          type: 'COMMENTED',
          userId: authorId,
          prdId,
          metadata: {
            commentId: comment.id,
            commentPreview: content.substring(0, 100)
          }
        }
      })

      return comment
    } catch (error) {
      logger.error('Error creating comment:', error)
      throw error
    }
  }
}

export const collaborationService = new CollaborationService()