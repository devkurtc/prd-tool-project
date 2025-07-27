const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp?: string
  path?: string
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  stats: {
    prdsCreated: number
    collaborations: number
    aiInteractions: number
  }
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    token: string
  }
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
}

export interface AISuggestion {
  type: 'replacement' | 'addition' | 'summary' | 'suggestions' | 'analysis' | 'general'
  title: string
  content: string
  confidence: number
}

export interface AICommand {
  command: string
  description: string
  examples: string[]
}

export interface Selection {
  startLine: number
  endLine: number
  text: string
}

export interface PRD {
  id: string
  title: string
  description: string
  content: string
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ARCHIVED'
  isPublic: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    email: string
  }
  collaborators: Array<{
    id: string
    name: string
    email: string
    role: 'VIEWER' | 'EDITOR' | 'ADMIN'
  }>
  versions: Array<{
    id: string
    version: number
    content: string
    createdAt: string
    author: string
  }>
}

export interface PRDListResponse {
  prds: PRD[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    status: string
    search: string
    tags: string[]
  }
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: HeadersInit
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
    // Load token from localStorage if available
    this.token = localStorage.getItem('auth_token')
  }

  setAuthToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  clearAuthToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  getAuthToken(): string | null {
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers = new Headers(this.defaultHeaders)
    
    // Add headers from options if provided
    if (options.headers) {
      const optionHeaders = new Headers(options.headers)
      optionHeaders.forEach((value, key) => {
        headers.set(key, value)
      })
    }

    // Add auth token if available
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`)
    }
    
    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      throw error
    }
  }

  // Health check
  async healthCheck() {
    return this.request<any>('/health')
  }

  // Authentication endpoints
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse['data']>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
    
    // Set token if registration successful
    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token)
    }
    
    return response as AuthResponse
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse['data']>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    
    // Set token if login successful
    if (response.success && response.data?.token) {
      this.setAuthToken(response.data.token)
    }
    
    return response as AuthResponse
  }

  async logout() {
    const response = await this.request<void>('/api/auth/logout', {
      method: 'POST',
    })
    
    // Clear token regardless of response
    this.clearAuthToken()
    
    return response
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/api/auth/me')
  }

  // User endpoints
  async getUserProfile() {
    return this.request<{ user: User }>('/api/users/profile')
  }

  async updateUserProfile(updates: Partial<User>) {
    return this.request<{ user: User }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async getUserStats() {
    return this.request<any>('/api/users/stats')
  }

  // PRD endpoints
  async getPRDs(params: {
    page?: number
    limit?: number
    status?: string
    search?: string
    tags?: string[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','))
        } else {
          searchParams.append(key, value.toString())
        }
      }
    })

    const queryString = searchParams.toString()
    const endpoint = `/api/prds${queryString ? `?${queryString}` : ''}`
    
    return this.request<PRDListResponse>(endpoint)
  }

  async getPRD(id: string) {
    return this.request<{ prd: PRD }>(`/api/prds/${id}`)
  }

  async getPRDVersions(prdId: string, params?: { page?: number; limit?: number }) {
    const queryString = params ? new URLSearchParams({
      page: params.page?.toString() || '1',
      limit: params.limit?.toString() || '10'
    }).toString() : ''
    
    return this.request<{
      versions: Array<{
        id: string
        version: number
        content: string
        changeLog?: string
        createdAt: string
        author: {
          id: string
          name: string
          email: string
        }
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/api/prds/${prdId}/versions${queryString ? `?${queryString}` : ''}`)
  }

  async createPRD(prd: {
    title: string
    description?: string
    content?: string
    template?: string
    isPublic?: boolean
    tags?: string[]
  }) {
    return this.request<{ prd: PRD }>('/api/prds', {
      method: 'POST',
      body: JSON.stringify(prd),
    })
  }

  async updatePRD(id: string, updates: Partial<PRD>) {
    return this.request<{ prd: PRD }>(`/api/prds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deletePRD(id: string) {
    return this.request<void>(`/api/prds/${id}`, {
      method: 'DELETE',
    })
  }

  // AI assistance
  async getAISuggestion(prdId: string, command: string, context?: string, selection?: Selection) {
    return this.request<{ suggestions: AISuggestion[]; command: string; description: string; timestamp: string }>('/api/ai/suggestion', {
      method: 'POST',
      body: JSON.stringify({ prdId, command, context, selection }),
    })
  }

  async generateAIContent(prompt: string, type: 'content' | 'section' | 'improvement' | 'analysis', context?: string) {
    return this.request<{ content: string; type: string; timestamp: string }>('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, type, context }),
    })
  }

  async getAICommands() {
    return this.request<{ commands: AICommand[] }>('/api/ai/commands')
  }
}

export const apiClient = new ApiClient()