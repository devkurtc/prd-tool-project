import type { editor } from 'monaco-editor'
import type { Socket } from 'socket.io-client'

// Simple operation interface for collaborative editing
interface SimpleOperation {
  type: 'insert' | 'delete' | 'retain'
  length?: number
  text?: string
}

interface CollaborativeEditorOptions {
  editor: editor.IStandaloneCodeEditor
  socket: Socket
  prdId: string
  userId: string
  onVersionChange?: (version: number) => void
}

export class CollaborativeEditor {
  private editor: editor.IStandaloneCodeEditor
  private socket: Socket
  private prdId: string
  private userId: string
  private version: number = 0
  private buffer: any[] = []
  private isApplyingOperation = false
  private onVersionChange?: (version: number) => void
  private disposables: any[] = []

  constructor(options: CollaborativeEditorOptions) {
    this.editor = options.editor
    this.socket = options.socket
    this.prdId = options.prdId
    this.userId = options.userId
    this.onVersionChange = options.onVersionChange

    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Listen for local changes
    const contentChangeDisposable = this.editor.onDidChangeModelContent((e) => {
      if (this.isApplyingOperation) return

      // Convert Monaco change to OT operation
      const operation = this.createOperationFromChange(e)
      if (operation) {
        this.sendOperation(operation)
      }
    })
    this.disposables.push(contentChangeDisposable)

    // Listen for cursor changes
    const cursorChangeDisposable = this.editor.onDidChangeCursorPosition((e) => {
      const position = e.position
      this.socket.emit('cursor-position', {
        prdId: this.prdId,
        position: {
          line: position.lineNumber,
          column: position.column
        }
      })
    })
    this.disposables.push(cursorChangeDisposable)

    // Listen for remote content updates
    this.socket.on('content-updated', (data: {
      content: string
      version: number
      user: { id: string; name: string }
    }) => {
      if (data.user.id !== this.userId) {
        this.applyRemoteContent(data.content, data.version)
      }
    })

    // Listen for document state
    this.socket.on('document-state', (data: { content: string; version: number }) => {
      this.version = data.version
      this.onVersionChange?.(this.version)
      
      // Set initial content
      this.isApplyingOperation = true
      this.editor.setValue(data.content)
      this.isApplyingOperation = false
    })
  }

  private createOperationFromChange(e: editor.IModelContentChangedEvent): any {
    // For now, send the entire content instead of operations
    // This is simpler but less efficient than OT
    const model = this.editor.getModel()
    if (!model) return null

    return {
      type: 'full_update',
      content: model.getValue(),
      changes: e.changes
    }
  }

  private sendOperation(operation: any) {
    // Simple content sync without OT for now
    this.socket.emit('content-change', {
      prdId: this.prdId,
      content: operation.content,
      version: this.version
    })
  }

  private applyRemoteContent(content: string, version: number) {
    try {
      const model = this.editor.getModel()
      if (!model) return

      this.isApplyingOperation = true
      
      // Simply replace the content for now
      model.setValue(content)
      
      this.version = version
      this.onVersionChange?.(this.version)
    } catch (error) {
      console.error('Failed to apply remote content:', error)
    } finally {
      this.isApplyingOperation = false
    }
  }

  private calculateMinimalEdits(
    _oldText: string, 
    newText: string
  ): any[] {
    // Simple implementation - replace entire content
    // TODO: Implement proper diff algorithm for minimal edits
    const model = this.editor.getModel()!
    const lastLine = model.getLineCount()
    const lastColumn = model.getLineMaxColumn(lastLine)
    
    return [{
      range: {
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: lastLine,
        endColumn: lastColumn
      },
      text: newText
    }]
  }

  public saveDocument() {
    this.socket.emit('save-document', { prdId: this.prdId })
  }

  public dispose() {
    // Clean up event listeners
    this.disposables.forEach(d => d.dispose())
    
    // Remove socket listeners
    this.socket.off('content-updated')
    this.socket.off('document-state')
  }
}