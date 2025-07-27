import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../../test/test-utils'
import { PRDEditor } from '../PRDEditor'
import { apiClient } from '../../lib/api'

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ onChange, onMount, value }: any) => {
    const mockEditor = {
      getSelection: vi.fn(() => ({
        isEmpty: vi.fn(() => false),
        startLineNumber: 1,
        endLineNumber: 2
      })),
      getModel: vi.fn(() => ({
        getValueInRange: vi.fn(() => 'selected text'),
        getLineMaxColumn: vi.fn(() => 50)
      })),
      getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
      executeEdits: vi.fn(),
      onDidChangeCursorPosition: vi.fn()
    }

    // Call onMount with mock editor
    if (onMount) {
      setTimeout(() => onMount(mockEditor), 0)
    }

    return (
      <textarea
        data-testid="monaco-editor"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Monaco Editor Mock"
      />
    )
  }
}))

// Mock WebSocket hook
const mockJoinPRD = vi.fn()
const mockLeavePRD = vi.fn()
const mockUpdateCursorPosition = vi.fn()

vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    isConnected: true,
    activeUsers: [
      { id: 'user1', name: 'John Doe', email: 'john@example.com' },
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' }
    ],
    joinPRD: mockJoinPRD,
    leavePRD: mockLeavePRD,
    updateCursorPosition: mockUpdateCursorPosition
  }))
}))

// Mock AIAssistant component
vi.mock('../AIAssistant', () => ({
  AIAssistant: ({ isVisible, onClose }: any) => 
    isVisible ? (
      <div data-testid="ai-assistant">
        <button onClick={onClose}>Close AI</button>
      </div>
    ) : null
}))

// Mock API client
vi.mock('../../lib/api', () => ({
  apiClient: {
    getPRD: vi.fn(),
    updatePRD: vi.fn()
  }
}))

const mockApiClient = vi.mocked(apiClient)

describe('PRDEditor', () => {
  const mockUser = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    isActive: true,
    createdAt: '2023-01-01',
    stats: { prdsCreated: 5, collaborations: 3, aiInteractions: 10 }
  }

  const mockPRD = {
    id: 'test-prd-id',
    title: 'Test PRD',
    description: 'Test description',
    content: '# Test PRD Content\n\nThis is test content.',
    status: 'DRAFT' as const,
    isPublic: false,
    tags: ['test', 'mock'],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
    author: {
      id: 'user1',
      name: 'Test User',
      email: 'test@example.com'
    },
    collaborators: [],
    versions: [{
      id: 'v1',
      version: 1,
      content: '# Test PRD Content',
      createdAt: '2023-01-01T00:00:00Z',
      author: 'user1'
    }]
  }

  const mockOnBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    mockApiClient.getPRD.mockResolvedValue({
      success: true,
      data: { prd: mockPRD }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('loads PRD data on mount', async () => {
    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    expect(screen.getByText('Loading PRD...')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockApiClient.getPRD).toHaveBeenCalledWith('test-prd-id')
    })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test PRD')).toBeInTheDocument()
    })
  })

  it('joins WebSocket room on mount', async () => {
    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(mockJoinPRD).toHaveBeenCalledWith('test-prd-id')
    })
  })

  it('leaves WebSocket room on unmount', async () => {
    const { unmount } = render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(mockJoinPRD).toHaveBeenCalled()
    })

    unmount()

    expect(mockLeavePRD).toHaveBeenCalledWith('test-prd-id')
  })

  it('displays active WebSocket users', async () => {
    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByText('2 active')).toBeInTheDocument()
    })

    // Check for user avatars
    expect(screen.getByText('J')).toBeInTheDocument() // John Doe
    expect(screen.getByText('J')).toBeInTheDocument() // Jane Smith
  })

  it('shows connection status', async () => {
    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  it('handles manual save', async () => {
    mockApiClient.updatePRD.mockResolvedValue({
      success: true,
      data: { prd: mockPRD }
    })

    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test PRD')).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    expect(screen.getByText('Saving...')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockApiClient.updatePRD).toHaveBeenCalledWith('test-prd-id', {
        title: 'Test PRD',
        content: '# Test PRD Content\n\nThis is test content.'
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/Saved at/)).toBeInTheDocument()
    })
  })

  it('handles save errors', async () => {
    mockApiClient.updatePRD.mockResolvedValue({
      success: false,
      error: {
        message: 'Save failed'
      }
    })

    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test PRD')).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Error: Save failed')).toBeInTheDocument()
    })
  })

  it('auto-saves after content changes', async () => {
    mockApiClient.updatePRD.mockResolvedValue({
      success: true,
      data: { prd: mockPRD }
    })

    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
    })

    // Change content
    const editor = screen.getByTestId('monaco-editor')
    fireEvent.change(editor, {
      target: { value: '# Updated content' }
    })

    // Fast-forward timers to trigger auto-save
    vi.advanceTimersByTime(2000)

    await waitFor(() => {
      expect(mockApiClient.updatePRD).toHaveBeenCalledWith('test-prd-id', {
        title: 'Test PRD',
        content: '# Updated content'
      })
    })
  })

  it('updates cursor position in WebSocket', async () => {
    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
    })

    // Simulate cursor position update
    // This would be called by Monaco's onDidChangeCursorPosition
    expect(mockUpdateCursorPosition).toHaveBeenCalledWith('test-prd-id', {
      line: 1,
      column: 1
    })
  })

  it('opens AI assistant', async () => {
    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test PRD')).toBeInTheDocument()
    })

    const aiButton = screen.getByRole('button', { name: /ai assistant/i })
    fireEvent.click(aiButton)

    expect(screen.getByTestId('ai-assistant')).toBeInTheDocument()
  })

  it('closes AI assistant', async () => {
    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test PRD')).toBeInTheDocument()
    })

    // Open AI assistant
    const aiButton = screen.getByRole('button', { name: /ai assistant/i })
    fireEvent.click(aiButton)

    expect(screen.getByTestId('ai-assistant')).toBeInTheDocument()

    // Close AI assistant
    const closeButton = screen.getByText('Close AI')
    fireEvent.click(closeButton)

    expect(screen.queryByTestId('ai-assistant')).not.toBeInTheDocument()
  })

  it('handles title changes and triggers save on blur', async () => {
    mockApiClient.updatePRD.mockResolvedValue({
      success: true,
      data: { prd: mockPRD }
    })

    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test PRD')).toBeInTheDocument()
    })

    const titleInput = screen.getByDisplayValue('Test PRD')
    fireEvent.change(titleInput, {
      target: { value: 'Updated PRD Title' }
    })
    fireEvent.blur(titleInput)

    await waitFor(() => {
      expect(mockApiClient.updatePRD).toHaveBeenCalledWith('test-prd-id', {
        title: 'Updated PRD Title',
        content: '# Test PRD Content\n\nThis is test content.'
      })
    })
  })

  it('navigates back to dashboard', async () => {
    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test PRD')).toBeInTheDocument()
    })

    const backButton = screen.getByText('← Back')
    fireEvent.click(backButton)

    expect(mockOnBack).toHaveBeenCalled()
  })

  it('displays PRD metadata in sidebar', async () => {
    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByText('Draft')).toBeInTheDocument()
      expect(screen.getByText('v1')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    mockApiClient.getPRD.mockReturnValue(new Promise(() => {})) // Never resolves

    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    expect(screen.getByText('Loading PRD...')).toBeInTheDocument()
  })

  it('shows error state when PRD not found', async () => {
    mockApiClient.getPRD.mockResolvedValue({
      success: false,
      error: { message: 'PRD not found' }
    })

    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByText('PRD not found')).toBeInTheDocument()
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
    })
  })

  it('handles network errors during save', async () => {
    mockApiClient.updatePRD.mockRejectedValue(new Error('Network error'))

    render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test PRD')).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument()
    })
  })

  it('clears save timeout on unmount', async () => {
    const { unmount } = render(
      <PRDEditor prdId="test-prd-id" user={mockUser} onBack={mockOnBack} />
    )

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument()
    })

    // Change content to start auto-save timer
    const editor = screen.getByTestId('monaco-editor')
    fireEvent.change(editor, {
      target: { value: '# Updated content' }
    })

    // Unmount before timer completes
    unmount()

    // Advance timers - save should not be called
    vi.advanceTimersByTime(3000)

    expect(mockApiClient.updatePRD).not.toHaveBeenCalled()
  })
})