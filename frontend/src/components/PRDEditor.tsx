import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Save, FileText, Users, ChevronRight, Circle, Bot } from 'lucide-react'
import { apiClient, type PRD, type User, type AISuggestion, type Selection } from '../lib/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { AIAssistant } from './AIAssistant'

interface PRDEditorProps {
  prdId: string
  user: User
  onBack: () => void
}

export function PRDEditor({ prdId, user, onBack }: PRDEditorProps) {
  const [prd, setPrd] = useState<PRD | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showAI, setShowAI] = useState(false)
  const [currentSelection, setCurrentSelection] = useState<Selection | undefined>()
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const editorRef = useRef<any>(null)
  
  const { 
    isConnected, 
    activeUsers, 
    joinPRD, 
    leavePRD, 
    updateCursorPosition
  } = useWebSocket({ user })

  useEffect(() => {
    loadPRD()
    // Join the PRD room for real-time collaboration
    if (isConnected) {
      joinPRD(prdId)
    }
    return () => {
      if (isConnected) {
        leavePRD(prdId)
      }
    }
  }, [prdId, isConnected, joinPRD, leavePRD])

  useEffect(() => {
    if (content !== prd?.content && content !== '') {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        savePRD()
      }, 2000)
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [content])

  const loadPRD = async () => {
    try {
      const response = await apiClient.getPRD(prdId)
      if (response.success && response.data) {
        setPrd(response.data.prd)
        setContent(response.data.prd.content)
        setTitle(response.data.prd.title)
      }
    } catch (err) {
      console.error('Error loading PRD:', err)
    } finally {
      setLoading(false)
    }
  }

  const savePRD = async () => {
    if (!prd) return
    setSaving(true)
    setSaveError(null)
    
    try {
      console.log('Saving PRD:', { prdId, title, contentLength: content.length })
      const response = await apiClient.updatePRD(prdId, {
        title,
        content
      })
      
      console.log('Save response:', response)
      
      if (response.success) {
        setLastSaved(new Date())
        setSaveError(null)
        console.log('PRD saved successfully')
      } else {
        const errorMsg = response.error?.message || 'Failed to save PRD'
        setSaveError(errorMsg)
        console.error('Save failed:', errorMsg)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save PRD'
      setSaveError(errorMsg)
      console.error('Error saving PRD:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    savePRD()
  }

  const handleOpenAI = () => {
    // Get current selection from editor
    if (editorRef.current) {
      const selection = editorRef.current.getSelection()
      const model = editorRef.current.getModel()
      
      if (selection && !selection.isEmpty()) {
        const selectedText = model?.getValueInRange(selection)
        if (selectedText) {
          setCurrentSelection({
            startLine: selection.startLineNumber,
            endLine: selection.endLineNumber,
            text: selectedText
          })
        }
      } else {
        setCurrentSelection(undefined)
      }
    }
    setShowAI(true)
  }

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    if (!editorRef.current) return

    const editor = editorRef.current
    const model = editor.getModel()
    
    if (suggestion.type === 'replacement' && currentSelection) {
      // Replace selected text
      const range = {
        startLineNumber: currentSelection.startLine,
        startColumn: 1,
        endLineNumber: currentSelection.endLine,
        endColumn: model?.getLineMaxColumn(currentSelection.endLine) || 1
      }
      
      editor.executeEdits('ai-suggestion', [{
        range,
        text: suggestion.content
      }])
    } else {
      // Insert at cursor position
      const position = editor.getPosition()
      editor.executeEdits('ai-suggestion', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: '\n\n' + suggestion.content
      }])
    }
    
    // Clear selection and close AI panel
    setCurrentSelection(undefined)
    setShowAI(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading PRD...</p>
        </div>
      </div>
    )
  }

  if (!prd) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">PRD not found</p>
          <button onClick={onBack} className="button-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-white flex-shrink-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleManualSave}
                  className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2"
                  placeholder="PRD Title"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Active Users */}
              {activeUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {activeUsers.slice(0, 3).map((activeUser) => (
                      <div
                        key={activeUser.id}
                        className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center"
                        title={activeUser.name}
                      >
                        <span className="text-xs font-medium">
                          {activeUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {activeUsers.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                        <span className="text-xs font-medium">
                          +{activeUsers.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {activeUsers.length} active
                  </span>
                </div>
              )}
              
              {/* Connection Status */}
              <div className="flex items-center space-x-1">
                <Circle 
                  className={`h-2 w-2 ${isConnected ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'}`} 
                />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center space-x-2 text-sm">
                {saving && (
                  <span className="text-blue-600 animate-pulse">Saving...</span>
                )}
                {!saving && saveError && (
                  <span className="text-red-600 text-xs">
                    Error: {saveError}
                  </span>
                )}
                {!saving && !saveError && lastSaved && (
                  <span className="text-muted-foreground">
                    Saved {new Date(lastSaved).toLocaleTimeString()}
                  </span>
                )}
              </div>
              <button
                onClick={handleOpenAI}
                className="button-secondary flex items-center space-x-2"
              >
                <Bot className="h-4 w-4" />
                <span>AI Assistant</span>
              </button>
              <button
                onClick={handleManualSave}
                disabled={saving}
                className="button-secondary flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white flex-shrink-0 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Document Outline</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center space-x-2">
                <ChevronRight className="h-4 w-4" />
                <span className="text-sm">Overview</span>
              </button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center space-x-2">
                <ChevronRight className="h-4 w-4" />
                <span className="text-sm">Requirements</span>
              </button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center space-x-2">
                <ChevronRight className="h-4 w-4" />
                <span className="text-sm">User Stories</span>
              </button>
              <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 flex items-center space-x-2">
                <ChevronRight className="h-4 w-4" />
                <span className="text-sm">Technical Specs</span>
              </button>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-4">Metadata</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{prd.status.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">v{prd.versions.length > 0 ? prd.versions[prd.versions.length - 1].version : '1.0'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">
                    {new Date(prd.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-4 flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Collaborators</span>
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {prd.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{prd.author.name}</p>
                    <p className="text-xs text-muted-foreground">Author</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Editor */}
        <main className="flex-1 bg-gray-50">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={content}
            onChange={(value) => setContent(value || '')}
            onMount={(editor) => {
              editorRef.current = editor
              
              // Track cursor position changes
              editor.onDidChangeCursorPosition((e) => {
                const position = e.position
                updateCursorPosition(prdId, {
                  line: position.lineNumber,
                  column: position.column
                })
              })
            }}
            theme="vs"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'off',
              padding: { top: 20, bottom: 20 },
              scrollBeyondLastLine: false,
              renderWhitespace: 'none',
              folding: true,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'hidden',
              },
              automaticLayout: true,
            }}
          />
        </main>
      </div>
      
      {/* AI Assistant Panel */}
      <AIAssistant
        prdId={prdId}
        isVisible={showAI}
        onClose={() => setShowAI(false)}
        selection={currentSelection}
        onApplySuggestion={handleApplySuggestion}
      />
    </div>
  )
}