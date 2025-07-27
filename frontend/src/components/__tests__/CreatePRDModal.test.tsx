import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../../test/test-utils'
import { CreatePRDModal } from '../CreatePRDModal'
import { apiClient } from '../../lib/api'

// Mock the API client
const mockCreatePRD = vi.fn()

vi.mock('../../lib/api', () => ({
  apiClient: {
    createPRD: mockCreatePRD,
  },
}))

describe('CreatePRDModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when not open', () => {
    const { container } = render(
      <CreatePRDModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal when open', () => {
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    expect(screen.getByText('Create New PRD')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter PRD title...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Brief description of the PRD...')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument() // Template select
    expect(screen.getByText('Create PRD')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('closes modal when close button is clicked', () => {
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    // Find the close button 
    const closeButton = screen.getByRole('button', { name: 'Close modal' })
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('closes modal when cancel button is clicked', () => {
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('disables submit button when title is empty', () => {
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    const submitButton = screen.getByText('Create PRD')
    expect(submitButton).toBeDisabled()
    
    // Add title to enable button
    fireEvent.change(screen.getByPlaceholderText('Enter PRD title...'), {
      target: { value: 'Test PRD' }
    })
    
    expect(submitButton).not.toBeDisabled()
  })

  it('creates PRD with valid data', async () => {
    const mockResponse = {
      success: true,
      data: {
        prd: {
          id: 'test-prd-id',
          title: 'Test PRD',
          description: 'Test description',
          status: 'DRAFT'
        }
      }
    }
    
    mockCreatePRD.mockResolvedValue(mockResponse)
    
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText('Enter PRD title...'), {
      target: { value: 'Test PRD' }
    })
    fireEvent.change(screen.getByPlaceholderText('Brief description of the PRD...'), {
      target: { value: 'Test description' }
    })
    
    // Select template
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'feature' }
    })
    
    // Submit form
    const submitButton = screen.getByText('Create PRD')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreatePRD).toHaveBeenCalledWith({
        title: 'Test PRD',
        description: 'Test description',
        template: 'feature',
        isPublic: false,
        tags: []
      })
    })
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('handles API errors gracefully', async () => {
    const mockError = {
      success: false,
      error: {
        message: 'Failed to create PRD'
      }
    }
    
    mockCreatePRD.mockResolvedValue(mockError)
    
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    // Fill title and submit
    fireEvent.change(screen.getByPlaceholderText('Enter PRD title...'), {
      target: { value: 'Test PRD' }
    })
    fireEvent.click(screen.getByText('Create PRD'))
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create PRD')).toBeInTheDocument()
    })
    
    expect(mockOnSuccess).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('adds and removes tags correctly', () => {
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    const tagInput = screen.getByPlaceholderText('Add a tag...')
    const addButton = screen.getByText('Add')
    
    // Add first tag
    fireEvent.change(tagInput, { target: { value: 'frontend' } })
    fireEvent.click(addButton)
    
    expect(screen.getByText('frontend')).toBeInTheDocument()
    expect(tagInput).toHaveValue('')
    
    // Add second tag
    fireEvent.change(tagInput, { target: { value: 'react' } })
    fireEvent.click(addButton)
    
    expect(screen.getByText('react')).toBeInTheDocument()
    
    // Remove first tag
    const firstTagRemoveButton = screen.getByRole('button', { name: 'Remove frontend tag' })
    fireEvent.click(firstTagRemoveButton)
    
    expect(screen.queryByText('frontend')).not.toBeInTheDocument()
    expect(screen.getByText('react')).toBeInTheDocument()
  })

  it('adds tag on Enter key press', () => {
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    const tagInput = screen.getByPlaceholderText('Add a tag...')
    
    fireEvent.change(tagInput, { target: { value: 'api' } })
    fireEvent.keyPress(tagInput, { key: 'Enter', code: 'Enter' })
    
    expect(screen.getByText('api')).toBeInTheDocument()
    expect(tagInput).toHaveValue('')
  })

  it('prevents duplicate tags', () => {
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    const tagInput = screen.getByPlaceholderText('Add a tag...')
    const addButton = screen.getByText('Add')
    
    // Add tag twice
    fireEvent.change(tagInput, { target: { value: 'duplicate' } })
    fireEvent.click(addButton)
    fireEvent.change(tagInput, { target: { value: 'duplicate' } })
    fireEvent.click(addButton)
    
    // Should only appear once
    const duplicateTags = screen.getAllByText('duplicate')
    expect(duplicateTags).toHaveLength(1)
  })

  it('toggles public visibility checkbox', () => {
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
    
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
    
    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('shows loading state while creating PRD', async () => {
    const mockPromise = new Promise(() => {}) // Never resolves
    mockCreatePRD.mockReturnValue(mockPromise)
    
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    fireEvent.change(screen.getByPlaceholderText('Enter PRD title...'), {
      target: { value: 'Test PRD' }
    })
    fireEvent.click(screen.getByText('Create PRD'))
    
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(screen.getByText('Creating...')).toBeDisabled()
  })

  it('includes tags in submission data', async () => {
    const mockResponse = { success: true, data: { prd: { id: 'test' } } }
    mockCreatePRD.mockResolvedValue(mockResponse)
    
    render(
      <CreatePRDModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    )
    
    // Add title
    fireEvent.change(screen.getByPlaceholderText('Enter PRD title...'), {
      target: { value: 'Test PRD' }
    })
    
    // Add tags
    const tagInput = screen.getByPlaceholderText('Add a tag...')
    fireEvent.change(tagInput, { target: { value: 'tag1' } })
    fireEvent.click(screen.getByText('Add'))
    fireEvent.change(tagInput, { target: { value: 'tag2' } })
    fireEvent.click(screen.getByText('Add'))
    
    // Set public
    fireEvent.click(screen.getByRole('checkbox'))
    
    // Submit
    fireEvent.click(screen.getByText('Create PRD'))
    
    await waitFor(() => {
      expect(mockCreatePRD).toHaveBeenCalledWith({
        title: 'Test PRD',
        description: '',
        template: 'basic',
        isPublic: true,
        tags: ['tag1', 'tag2']
      })
    })
  })
})