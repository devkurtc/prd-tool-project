import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../../test/test-utils'
import { LoginForm } from '../LoginForm'

// Mock the auth context
const mockLogin = vi.fn()
const mockRegister = vi.fn()

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    isLoading: false,
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}))

describe('LoginForm', () => {
  const mockToggleMode = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form by default', () => {
    render(<LoginForm onToggleMode={mockToggleMode} isRegisterMode={false} />)
    
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders register form when in register mode', () => {
    render(<LoginForm onToggleMode={mockToggleMode} isRegisterMode={true} />)
    
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('calls login function when login form is submitted', async () => {
    mockLogin.mockResolvedValue({})
    
    render(<LoginForm onToggleMode={mockToggleMode} isRegisterMode={false} />)
    
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('calls register function when register form is submitted', async () => {
    mockRegister.mockResolvedValue({})
    
    render(<LoginForm onToggleMode={mockToggleMode} isRegisterMode={true} />)
    
    fireEvent.change(screen.getByPlaceholderText(/full name/i), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('displays error message when login fails', async () => {
    const errorMessage = 'Invalid credentials'
    mockLogin.mockRejectedValue(new Error(errorMessage))
    
    render(<LoginForm onToggleMode={mockToggleMode} isRegisterMode={false} />)
    
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpassword' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('toggles between login and register modes', () => {
    render(<LoginForm onToggleMode={mockToggleMode} isRegisterMode={false} />)
    
    fireEvent.click(screen.getByText(/don't have an account\? sign up/i))
    
    expect(mockToggleMode).toHaveBeenCalled()
  })
})