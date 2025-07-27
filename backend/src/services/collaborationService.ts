// Simplified collaboration service without OT for now
import { logger } from '../utils/logger.js'
import { prisma } from '../config/database.js'

interface DocumentState {
  content: string
  version: number
  lastUpdated: Date
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
}

export const collaborationService = new CollaborationService()