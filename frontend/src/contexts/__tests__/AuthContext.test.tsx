import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { apiClient } from '../../lib/api'

// Mock the apiClient
vi.mock('../../lib/api', () => ({
  apiClient: {
    getAuthToken: vi.fn(),
    clearAuthToken: vi.fn(),
    setAuthToken: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}))

const mockApiClient = vi.mocked(apiClient)

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  )

  it('provides initial auth state', () => {
    mockApiClient.getAuthToken.mockReturnValue(null)
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('handles successful login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      isActive: true,
      createdAt: '2023-01-01',
      stats: { prdsCreated: 0, collaborations: 0, aiInteractions: 0 }
    }
    
    const mockResponse = {
      success: true,
      data: {
        user: mockUser,
        token: 'mock-token'
      }
    }
    
    mockApiClient.login.mockResolvedValue(mockResponse)
    // Initially no token, then return token after login
    mockApiClient.getAuthToken.mockReturnValueOnce(null).mockReturnValue('mock-token')
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' })
    })
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles login failure', async () => {
    const mockResponse = {
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    }
    
    mockApiClient.login.mockResolvedValue(mockResponse)
    mockApiClient.getAuthToken.mockReturnValue(null)
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await expect(
      act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'wrong' })
      })
    ).rejects.toThrow('Invalid email or password')
  })

  it('handles successful registration', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      isActive: true,
      createdAt: '2023-01-01',
      stats: { prdsCreated: 0, collaborations: 0, aiInteractions: 0 }
    }
    
    const mockResponse = {
      success: true,
      data: {
        user: mockUser,
        token: 'mock-token'
      }
    }
    
    mockApiClient.register.mockResolvedValue(mockResponse)
    // Initially no token, then return token after registration
    mockApiClient.getAuthToken.mockReturnValueOnce(null).mockReturnValue('mock-token')
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    await act(async () => {
      await result.current.register({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password'
      })
    })
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles logout', async () => {
    // Set up initial authenticated state
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      isActive: true,
      createdAt: '2023-01-01',
      stats: { prdsCreated: 0, collaborations: 0, aiInteractions: 0 }
    }
    
    mockApiClient.logout.mockResolvedValue({ success: true })
    mockApiClient.getAuthToken.mockReturnValue('mock-token')
    mockApiClient.getCurrentUser.mockResolvedValue({
      success: true,
      data: { user: mockUser }
    })
    
    const { result } = renderHook(() => useAuth(), { wrapper })
    
    // Wait for initial auth check
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    
    // Now logout
    await act(async () => {
      await result.current.logout()
    })
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('throws error when useAuth is used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')
  })
})