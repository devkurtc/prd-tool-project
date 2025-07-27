import { TextOperation } from 'ot'
import type { editor } from 'monaco-editor'
import type { Socket } from 'socket.io-client'

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
  private buffer: TextOperation[] = []
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

    // Listen for remote operations
    this.socket.on('operation', (data: {
      operation: any
      version: number
      user: { id: string; name: string }
    }) => {
      if (data.user.id !== this.userId) {
        this.applyRemoteOperation(data.operation, data.version)
      }
    })

    // Listen for operation acknowledgments
    this.socket.on('operation-ack', (data: { version: number }) => {
      this.version = data.version
      this.onVersionChange?.(this.version)
      
      // Send buffered operations if any
      if (this.buffer.length > 0) {
        const op = this.buffer.shift()!
        this.sendOperation(op)
      }
    })

    // Listen for operation errors
    this.socket.on('operation-error', (data: { message: string; version: number }) => {
      console.error('Operation error:', data.message)
      // TODO: Handle operation error (e.g., resync with server)
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

  private createOperationFromChange(e: editor.IModelContentChangedEvent): TextOperation | null {
    const model = this.editor.getModel()
    if (!model) return null

    let operation = new TextOperation()
    let lastIndex = 0

    // Sort changes by range start
    const changes = [...e.changes].sort((a, b) => 
      a.rangeOffset - b.rangeOffset
    )

    for (const change of changes) {
      const startOffset = change.rangeOffset
      const endOffset = startOffset + change.rangeLength
      
      // Retain unchanged text before this change
      if (startOffset > lastIndex) {
        operation = operation.retain(startOffset - lastIndex)
      }
      
      // Delete removed text
      if (change.rangeLength > 0) {
        operation = operation.delete(change.rangeLength)
      }
      
      // Insert new text
      if (change.text.length > 0) {
        operation = operation.insert(change.text)
      }
      
      lastIndex = endOffset
    }

    // Retain remaining text
    const totalLength = model.getValue().length
    if (lastIndex < totalLength) {
      operation = operation.retain(totalLength - lastIndex)
    }

    return operation
  }

  private sendOperation(operation: TextOperation) {
    // Buffer operation if waiting for acknowledgment
    if (this.buffer.length > 0) {
      this.buffer.push(operation)
      return
    }

    this.socket.emit('operation', {
      prdId: this.prdId,
      operation: operation.toJSON(),
      version: this.version
    })

    // Add to buffer to track pending operations
    this.buffer.push(operation)
  }

  private applyRemoteOperation(operationData: any, version: number) {
    try {
      const operation = TextOperation.fromJSON(operationData)
      const model = this.editor.getModel()
      if (!model) return

      this.isApplyingOperation = true
      
      // Apply operation to editor
      const currentContent = model.getValue()
      const newContent = operation.apply(currentContent)
      
      // Calculate minimal edit to preserve cursor position
      const edits = this.calculateMinimalEdits(currentContent, newContent)
      model.pushEditOperations([], edits, () => null)
      
      this.version = version
      this.onVersionChange?.(this.version)
    } catch (error) {
      console.error('Failed to apply remote operation:', error)
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
    this.socket.off('operation')
    this.socket.off('operation-ack')
    this.socket.off('operation-error')
    this.socket.off('document-state')
  }
}