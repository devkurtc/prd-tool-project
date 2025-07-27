import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../../test/test-utils'
import { PRDDashboard } from '../PRDDashboard'
import { apiClient } from '../../lib/api'

// Mock CreatePRDModal
vi.mock('../CreatePRDModal', () => ({
  CreatePRDModal: ({ isOpen, onClose, onSuccess }: any) => 
    isOpen ? (
      <div data-testid="create-prd-modal">
        <h2>Create New PRD</h2>
        <button onClick={onSuccess}>Create PRD</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
}))

// Mock PRDEditor
vi.mock('../PRDEditor', () => ({
  PRDEditor: ({ prdId, onBack }: any) => (
    <div data-testid="prd-editor">
      <h2>PRD Editor for {prdId}</h2>
      <button onClick={onBack}>Back to Dashboard</button>
    </div>
  )
}))

// Mock API client
vi.mock('../../lib/api', () => ({
  apiClient: {
    getPRDs: vi.fn()
  }
}))

const mockApiClient = vi.mocked(apiClient)

describe('PRDDashboard', () => {
  const mockUser = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    isActive: true,
    createdAt: '2023-01-01',
    stats: { prdsCreated: 5, collaborations: 3, aiInteractions: 10 }
  }

  const mockPRDs = [
    {
      id: 'prd-1',
      title: 'First PRD',
      description: 'First PRD description',
      content: '# First PRD',
      status: 'DRAFT' as const,
      isPublic: false,
      tags: ['frontend', 'react'],
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
        content: '# First PRD',
        createdAt: '2023-01-01T00:00:00Z',
        author: 'user1'
      }]
    },
    {
      id: 'prd-2',
      title: 'Second PRD',
      description: 'Second PRD description',
      content: '# Second PRD',
      status: 'REVIEW' as const,
      isPublic: true,
      tags: ['backend', 'api'],
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T12:00:00Z',
      author: {
        id: 'user2',
        name: 'Other User',
        email: 'other@example.com'
      },
      collaborators: [{
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'EDITOR' as const
      }],
      versions: [{
        id: 'v2',
        version: 1,
        content: '# Second PRD',
        createdAt: '2023-01-02T00:00:00Z',
        author: 'user2'
      }]
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockApiClient.getPRDs.mockResolvedValue({
      success: true,
      data: {
        prds: mockPRDs,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1
        },
        filters: {
          status: 'all',
          search: '',
          tags: []
        }
      }
    })
  })

  it('renders dashboard header with user info', async () => {
    render(<PRDDashboard user={mockUser} />)

    expect(screen.getByText('PRD Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, Test User')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /new prd/i })).toBeInTheDocument()
  })

  it('displays user stats', async () => {
    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument() // prdsCreated
      expect(screen.getByText('3')).toBeInTheDocument() // collaborations
      expect(screen.getByText('10')).toBeInTheDocument() // aiInteractions
    })
  })

  it('loads and displays PRDs', async () => {
    render(<PRDDashboard user={mockUser} />)

    expect(screen.getByText('Loading PRDs...')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockApiClient.getPRDs).toHaveBeenCalledWith({
        search: undefined,
        status: undefined,
        page: 1,
        limit: 20
      })
    })

    await waitFor(() => {
      expect(screen.getByText('First PRD')).toBeInTheDocument()
      expect(screen.getByText('Second PRD')).toBeInTheDocument()
    })
  })

  it('opens create PRD modal when New PRD button is clicked', async () => {
    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('First PRD')).toBeInTheDocument()
    })

    const newPRDButton = screen.getByRole('button', { name: /new prd/i })
    fireEvent.click(newPRDButton)

    expect(screen.getByTestId('create-prd-modal')).toBeInTheDocument()
  })

  it('closes create PRD modal and refreshes list on success', async () => {
    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('First PRD')).toBeInTheDocument()
    })

    // Open modal
    const newPRDButton = screen.getByRole('button', { name: /new prd/i })
    fireEvent.click(newPRDButton)

    expect(screen.getByTestId('create-prd-modal')).toBeInTheDocument()

    // Simulate successful creation
    const createButton = screen.getByText('Create PRD')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.queryByTestId('create-prd-modal')).not.toBeInTheDocument()
    })

    // Should reload PRDs
    expect(mockApiClient.getPRDs).toHaveBeenCalledTimes(2)
  })

  it('closes modal when cancel is clicked', async () => {
    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('First PRD')).toBeInTheDocument()
    })

    // Open modal
    const newPRDButton = screen.getByRole('button', { name: /new prd/i })
    fireEvent.click(newPRDButton)

    expect(screen.getByTestId('create-prd-modal')).toBeInTheDocument()

    // Cancel
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByTestId('create-prd-modal')).not.toBeInTheDocument()
    })
  })

  it('opens PRD editor when PRD card is clicked', async () => {
    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('First PRD')).toBeInTheDocument()
    })

    const prdCard = screen.getByText('First PRD').closest('div[role="button"], div[onclick], .cursor-pointer, [data-testid*="card"]') ||
                    screen.getByText('First PRD').closest('div')

    if (prdCard) {
      fireEvent.click(prdCard)
    }

    await waitFor(() => {
      expect(screen.getByTestId('prd-editor')).toBeInTheDocument()
      expect(screen.getByText('PRD Editor for prd-1')).toBeInTheDocument()
    })
  })

  it('returns to dashboard from PRD editor', async () => {
    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('First PRD')).toBeInTheDocument()
    })

    // Click PRD to open editor
    const prdCard = screen.getByText('First PRD').closest('div')
    if (prdCard) {
      fireEvent.click(prdCard)
    }

    await waitFor(() => {
      expect(screen.getByTestId('prd-editor')).toBeInTheDocument()
    })

    // Go back to dashboard
    const backButton = screen.getByText('Back to Dashboard')
    fireEvent.click(backButton)

    await waitFor(() => {
      expect(screen.queryByTestId('prd-editor')).not.toBeInTheDocument()
      expect(screen.getByText('PRD Dashboard')).toBeInTheDocument()
    })
  })

  it('filters PRDs by search query', async () => {
    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('First PRD')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search PRDs...')
    fireEvent.change(searchInput, { target: { value: 'Second' } })

    await waitFor(() => {
      expect(mockApiClient.getPRDs).toHaveBeenCalledWith({
        search: 'Second',
        status: undefined,
        page: 1,
        limit: 20
      })
    })
  })

  it('filters PRDs by status', async () => {
    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('First PRD')).toBeInTheDocument()
    })

    const statusSelect = screen.getByDisplayValue('All Status')
    fireEvent.change(statusSelect, { target: { value: 'DRAFT' } })

    await waitFor(() => {
      expect(mockApiClient.getPRDs).toHaveBeenCalledWith({
        search: '',
        status: 'DRAFT',
        page: 1,
        limit: 20
      })
    })
  })

  it('displays PRD cards with correct information', async () => {
    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('First PRD')).toBeInTheDocument()
      expect(screen.getByText('First PRD description')).toBeInTheDocument()
      expect(screen.getByText('DRAFT')).toBeInTheDocument()
      expect(screen.getByText('frontend')).toBeInTheDocument()
      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Second PRD')).toBeInTheDocument()
      expect(screen.getByText('Second PRD description')).toBeInTheDocument()
      expect(screen.getByText('REVIEW')).toBeInTheDocument()
      expect(screen.getByText('backend')).toBeInTheDocument()
      expect(screen.getByText('api')).toBeInTheDocument()
      expect(screen.getByText('Other User')).toBeInTheDocument()
      expect(screen.getByText('+1 collaborator')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockApiClient.getPRDs.mockResolvedValue({
      success: false,
      error: {
        message: 'Failed to load PRDs'
      }
    })

    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load PRDs')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('retries loading PRDs when Try Again is clicked', async () => {
    // First call fails
    mockApiClient.getPRDs.mockResolvedValueOnce({
      success: false,
      error: {
        message: 'Failed to load PRDs'
      }
    })

    // Second call succeeds
    mockApiClient.getPRDs.mockResolvedValueOnce({
      success: true,
      data: {
        prds: mockPRDs,
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
        filters: { status: 'all', search: '', tags: [] }
      }
    })

    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load PRDs')).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Try Again')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('First PRD')).toBeInTheDocument()
    })

    expect(mockApiClient.getPRDs).toHaveBeenCalledTimes(2)
  })

  it('shows empty state when no PRDs found', async () => {
    mockApiClient.getPRDs.mockResolvedValue({
      success: true,
      data: {
        prds: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        filters: { status: 'all', search: '', tags: [] }
      }
    })

    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('No PRDs found')).toBeInTheDocument()
      expect(screen.getByText('Get started by creating your first PRD')).toBeInTheDocument()
      expect(screen.getByText('Create Your First PRD')).toBeInTheDocument()
    })
  })

  it('shows filtered empty state when search returns no results', async () => {
    mockApiClient.getPRDs.mockResolvedValue({
      success: true,
      data: {
        prds: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        filters: { status: 'all', search: 'nonexistent', tags: [] }
      }
    })

    render(<PRDDashboard user={mockUser} />)

    // First load with results
    await waitFor(() => {
      expect(screen.getByText('First PRD')).toBeInTheDocument()
    })

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search PRDs...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    await waitFor(() => {
      expect(screen.getByText('No PRDs found')).toBeInTheDocument()
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument()
    })
  })

  it('truncates long tag lists', async () => {
    const longTagsPRD = {
      ...mockPRDs[0],
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
    }

    mockApiClient.getPRDs.mockResolvedValue({
      success: true,
      data: {
        prds: [longTagsPRD],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        filters: { status: 'all', search: '', tags: [] }
      }
    })

    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('tag1')).toBeInTheDocument()
      expect(screen.getByText('tag2')).toBeInTheDocument()
      expect(screen.getByText('tag3')).toBeInTheDocument()
      expect(screen.getByText('+2 more')).toBeInTheDocument()
    })
  })

  it('handles network errors during PRD loading', async () => {
    mockApiClient.getPRDs.mockRejectedValue(new Error('Network error'))

    render(<PRDDashboard user={mockUser} />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load PRDs')).toBeInTheDocument()
    })
  })
})