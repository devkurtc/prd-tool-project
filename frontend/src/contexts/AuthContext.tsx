import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { apiClient } from '../lib/api'
import type { User, LoginRequest, RegisterRequest } from '../lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!apiClient.getAuthToken()

  // Check if user is already logged in on app start
  useEffect(() => {
    const initAuth = async () => {
      const token = apiClient.getAuthToken()
      if (token) {
        try {
          await refreshUser()
        } catch (error) {
          console.error('Failed to verify existing token:', error)
          apiClient.clearAuthToken()
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true)
    try {
      const response = await apiClient.login(credentials)
      if (response.success && response.data) {
        setUser(response.data.user)
      } else {
        throw new Error(response.error?.message || 'Login failed')
      }
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterRequest) => {
    setIsLoading(true)
    try {
      const response = await apiClient.register(userData)
      if (response.success && response.data) {
        setUser(response.data.user)
      } else {
        throw new Error(response.error?.message || 'Registration failed')
      }
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser()
      if (response.success && response.data) {
        setUser(response.data.user)
      } else {
        throw new Error('Failed to get user data')
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
      apiClient.clearAuthToken()
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}