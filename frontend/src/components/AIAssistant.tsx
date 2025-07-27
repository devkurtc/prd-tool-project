import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Lightbulb, X, Copy, Check } from 'lucide-react'
import { apiClient, type AISuggestion, type Selection } from '../lib/api'

interface AIAssistantProps {
  prdId: string
  isVisible: boolean
  onClose: () => void
  selection?: Selection
  onApplySuggestion: (suggestion: AISuggestion) => void
}

export function AIAssistant({ prdId, isVisible, onClose, selection, onApplySuggestion }: AIAssistantProps) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
      
      // Pre-fill with @update if text is selected
      if (selection?.text && !input) {
        setInput('@update ')
      }
    }
  }, [isVisible, selection])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    setLoading(true)
    try {
      const response = await apiClient.getAISuggestion(
        prdId, 
        input.trim(),
        undefined, // context
        selection
      )
      
      if (response.success && response.data) {
        setSuggestions(response.data.suggestions)
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
      setSuggestions([{
        type: 'general',
        title: 'Error',
        content: 'Sorry, I encountered an error. Please try again.',
        confidence: 0
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleApply = (suggestion: AISuggestion) => {
    onApplySuggestion(suggestion)
    // Clear suggestions after applying
    setSuggestions([])
    setInput('')
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTypeIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'replacement':
        return '🔄'
      case 'addition':
        return '➕'
      case 'summary':
        return '📄'
      case 'suggestions':
        return '💡'
      case 'analysis':
        return '🔍'
      default:
        return '🤖'
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Selection Info */}
      {selection && (
        <div className="p-3 bg-blue-50 border-b">
          <p className="text-xs text-blue-700 mb-1">Selected text:</p>
          <p className="text-sm text-blue-800 font-mono bg-blue-100 p-2 rounded text-ellipsis overflow-hidden">
            {selection.text.length > 100 
              ? `${selection.text.substring(0, 100)}...` 
              : selection.text
            }
          </p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-b">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Try @update, @expand, @suggest..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Command hints */}
        <div className="mt-2 text-xs text-gray-500">
          <div className="flex flex-wrap gap-1">
            {['@update', '@expand', '@suggest', '@analyze', '@rewrite', '@summarize'].map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => setInput(cmd + ' ')}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </form>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto">
        {suggestions.length > 0 && (
          <div className="p-4 space-y-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                    <h4 className="font-medium text-sm">{suggestion.title}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none mb-3">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded text-xs">
                    {suggestion.content}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApply(suggestion)}
                    className="flex-1 px-3 py-1 bg-primary text-white rounded text-xs hover:bg-primary/90 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => handleCopy(suggestion.content, index)}
                    className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors flex items-center space-x-1"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Welcome message */}
        {suggestions.length === 0 && !loading && (
          <div className="p-6 text-center text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h4 className="font-medium mb-2">AI Assistant Ready</h4>
            <p className="text-sm mb-4">
              Select text and use commands like @update, @expand, or @suggest to get AI-powered improvements.
            </p>
            <div className="text-xs space-y-1">
              <p><strong>@update</strong> - Improve selected content</p>
              <p><strong>@expand</strong> - Add more details</p>
              <p><strong>@suggest</strong> - Get recommendations</p>
              <p><strong>@analyze</strong> - Analyze content quality</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}