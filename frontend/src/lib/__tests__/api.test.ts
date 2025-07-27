import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient } from '../api'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication', () => {
    it('sets and gets auth token', () => {
      const token = 'test-token'
      
      apiClient.setAuthToken(token)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', token)
      expect(apiClient.getAuthToken()).toBe(token)
    })

    it('clears auth token', () => {
      apiClient.clearAuthToken()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token')
      expect(apiClient.getAuthToken()).toBeNull()
    })

    it('loads token from localStorage on initialization', () => {
      const token = 'stored-token'
      mockLocalStorage.getItem.mockReturnValue(token)
      
      // Create a new instance to test initialization
      const testClient = new (apiClient.constructor as any)()
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token')
      expect(testClient.getAuthToken()).toBe(token)
    })
  })

  describe('API Requests', () => {
    it('makes successful login request', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          token: 'auth-token'
        }
      }
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
      
      const result = await apiClient.login({
        email: 'test@example.com',
        password: 'password'
      })
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password'
          })
        })
      )
      
      expect(result).toEqual(mockResponse)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'auth-token')
    })

    it('includes Authorization header when token is set', async () => {
      const token = 'test-token'
      apiClient.setAuthToken(token)
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      
      await apiClient.getCurrentUser()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/me',
        expect.objectContaining({
          headers: expect.any(Headers)
        })
      )
      
      const call = mockFetch.mock.calls[0]
      const headers = call[1].headers as Headers
      expect(headers.get('Authorization')).toBe(`Bearer ${token}`)
    })

    it('handles API errors', async () => {
      const errorResponse = {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      }
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve(errorResponse)
      })
      
      await expect(
        apiClient.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password')
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      
      await expect(
        apiClient.healthCheck()
      ).rejects.toThrow('Network error')
    })
  })

  describe('PRD Management', () => {
    beforeEach(() => {
      const token = 'test-token'
      apiClient.setAuthToken(token)
    })

    it('creates PRD with correct payload', async () => {
      const newPRD = {
        title: 'Test PRD',
        description: 'Test description',
        content: 'Test content',
        isPublic: false,
        tags: ['test']
      }
      
      const mockResponse = {
        success: true,
        data: { prd: { ...newPRD, id: '1' } }
      }
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
      
      const result = await apiClient.createPRD(newPRD)
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/prds',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newPRD)
        })
      )
      
      expect(result).toEqual(mockResponse)
    })

    it('gets PRDs with query parameters', async () => {
      const params = {
        page: 1,
        limit: 10,
        status: 'DRAFT',
        search: 'test',
        tags: ['frontend', 'api']
      }
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { prds: [] } })
      })
      
      await apiClient.getPRDs(params)
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/prds?page=1&limit=10&status=DRAFT&search=test&tags=frontend%2Capi',
        expect.any(Object)
      )
    })
  })
})