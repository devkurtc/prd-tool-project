import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { User } from '../lib/api'

interface UseWebSocketOptions {
  user: User | null
  enabled?: boolean
}

interface ActiveUser {
  id: string
  name: string
  email: string
}

interface CursorPosition {
  user: User
  position: { line: number; column: number }
}

export function useWebSocket({ user, enabled = true }: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map())

  useEffect(() => {
    if (!enabled || !user) return

    // Initialize socket connection with error handling
    const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      
      // Authenticate
      socket.emit('auth', { user })
    })

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      setIsConnected(false)
      setActiveUsers([])
      setCursors(new Map())
    })

    socket.on('connect_error', (error) => {
      console.warn('WebSocket connection failed:', error.message)
      // Don't throw error, just log it - WebSocket is optional for basic functionality
    })

    socket.on('error', (error: any) => {
      console.warn('WebSocket error:', error)
      // Non-blocking error handling
    })

    // Room events
    socket.on('room-users', (data: { users: ActiveUser[] }) => {
      setActiveUsers(data.users)
    })

    socket.on('user-joined', (data: { user: ActiveUser; activeUsers: ActiveUser[] }) => {
      setActiveUsers(data.activeUsers)
    })

    socket.on('user-left', (data: { user: ActiveUser; activeUsers: ActiveUser[] }) => {
      setActiveUsers(data.activeUsers)
      // Remove cursor for the user who left
      setCursors(prev => {
        const next = new Map(prev)
        next.delete(data.user.id)
        return next
      })
    })

    // Cursor events
    socket.on('cursor-update', (data: CursorPosition) => {
      setCursors(prev => {
        const next = new Map(prev)
        next.set(data.user.id, data)
        return next
      })
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user, enabled])

  const joinPRD = useCallback((prdId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join-prd', { prdId })
    }
  }, [isConnected])

  const leavePRD = useCallback((prdId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave-prd', { prdId })
    }
  }, [isConnected])

  const updateCursorPosition = useCallback((prdId: string, position: { line: number; column: number }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('cursor-position', { prdId, position })
    }
  }, [isConnected])

  const broadcastContentChange = useCallback((prdId: string, content: string, version: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('content-change', { prdId, content, version })
    }
  }, [isConnected])

  return {
    isConnected,
    activeUsers,
    cursors,
    joinPRD,
    leavePRD,
    updateCursorPosition,
    broadcastContentChange,
    socket: socketRef.current
  }
}