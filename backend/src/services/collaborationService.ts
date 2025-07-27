import { TextOperation } from 'ot'
import { logger } from '../utils/logger.js'
import { prisma } from '../config/database.js'

interface DocumentState {
  content: string
  version: number
  operations: TextOperation[]
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
        operations: []
      }

      this.documents.set(prdId, state)
      return state
    } catch (error) {
      logger.error('Failed to initialize document', { prdId, error })
      throw error
    }
  }

  applyOperation(prdId: string, operation: TextOperation, clientVersion: number): { 
    content: string
    version: number
    transformedOp?: TextOperation 
  } {
    const doc = this.documents.get(prdId)
    if (!doc) {
      throw new Error('Document not initialized')
    }

    // Check if operation is based on current version
    if (clientVersion === doc.version) {
      // Apply operation directly
      doc.content = operation.apply(doc.content)
      doc.version++
      doc.operations.push(operation)

      return {
        content: doc.content,
        version: doc.version
      }
    } else if (clientVersion < doc.version) {
      // Transform operation against missed operations
      let transformedOp = operation
      const missedOps = doc.operations.slice(clientVersion - 1)
      
      for (const missedOp of missedOps) {
        const [op1Prime, op2Prime] = TextOperation.transform(transformedOp, missedOp)
        transformedOp = op1Prime
      }

      // Apply transformed operation
      doc.content = transformedOp.apply(doc.content)
      doc.version++
      doc.operations.push(transformedOp)

      return {
        content: doc.content,
        version: doc.version,
        transformedOp
      }
    } else {
      throw new Error('Client version ahead of server')
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