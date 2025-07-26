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
  organization: string
  createdAt: string
  preferences: {
    theme: 'light' | 'dark' | 'system'
    notifications: {
      email: boolean
      push: boolean
      mentions: boolean
    }
    editor: {
      fontSize: number
      tabSize: number
      wordWrap: boolean
    }
  }
  stats: {
    prdsCreated: number
    collaborations: number
    aiInteractions: number
  }
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

  constructor() {
    this.baseURL = API_BASE_URL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
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
  async getAIAssistance(prdId: string, prompt: string, type = 'general') {
    return this.request<any>(`/api/prds/${prdId}/ai-assist`, {
      method: 'POST',
      body: JSON.stringify({ prompt, type }),
    })
  }
}

export const apiClient = new ApiClient()