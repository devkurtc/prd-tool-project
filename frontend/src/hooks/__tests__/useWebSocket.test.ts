import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebSocket } from '../useWebSocket'
import { io } from 'socket.io-client'

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: false
  }))
}))

const mockIo = vi.mocked(io)

describe('useWebSocket', () => {
  const mockUser = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    isActive: true,
    createdAt: '2023-01-01',
    stats: { prdsCreated: 5, collaborations: 3, aiInteractions: 10 }
  }

  let mockSocket: any

  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connected: false
    }
    mockIo.mockReturnValue(mockSocket)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes socket connection when enabled and user provided', () => {
    renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    expect(mockIo).toHaveBeenCalledWith('http://localhost:3001', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    })
  })

  it('does not initialize socket when disabled', () => {
    renderHook(() => useWebSocket({ user: mockUser, enabled: false }))

    expect(mockIo).not.toHaveBeenCalled()
  })

  it('does not initialize socket when user is null', () => {
    renderHook(() => useWebSocket({ user: null, enabled: true }))

    expect(mockIo).not.toHaveBeenCalled()
  })

  it('sets up event listeners on socket', () => {
    renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('room-users', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('user-joined', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('user-left', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('cursor-update', expect.any(Function))
  })

  it('handles connection event', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    expect(result.current.isConnected).toBe(false)

    // Simulate connect event
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]
    act(() => {
      connectHandler()
    })

    expect(result.current.isConnected).toBe(true)
    expect(mockSocket.emit).toHaveBeenCalledWith('auth', { user: mockUser })
  })

  it('handles disconnect event', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    // First connect
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]
    act(() => {
      connectHandler()
    })

    expect(result.current.isConnected).toBe(true)

    // Then disconnect
    const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1]
    act(() => {
      disconnectHandler('transport close')
    })

    expect(result.current.isConnected).toBe(false)
    expect(result.current.activeUsers).toEqual([])
    expect(result.current.cursors.size).toBe(0)
  })

  it('handles room-users event', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    const users = [
      { id: 'user1', name: 'User 1', email: 'user1@example.com' },
      { id: 'user2', name: 'User 2', email: 'user2@example.com' }
    ]

    const roomUsersHandler = mockSocket.on.mock.calls.find(call => call[0] === 'room-users')[1]
    act(() => {
      roomUsersHandler({ users })
    })

    expect(result.current.activeUsers).toEqual(users)
  })

  it('handles user-joined event', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    const newUser = { id: 'user2', name: 'User 2', email: 'user2@example.com' }
    const activeUsers = [
      { id: 'user1', name: 'User 1', email: 'user1@example.com' },
      newUser
    ]

    const userJoinedHandler = mockSocket.on.mock.calls.find(call => call[0] === 'user-joined')[1]
    act(() => {
      userJoinedHandler({ user: newUser, activeUsers })
    })

    expect(result.current.activeUsers).toEqual(activeUsers)
  })

  it('handles user-left event', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    // First set some users
    const roomUsersHandler = mockSocket.on.mock.calls.find(call => call[0] === 'room-users')[1]
    act(() => {
      roomUsersHandler({
        users: [
          { id: 'user1', name: 'User 1', email: 'user1@example.com' },
          { id: 'user2', name: 'User 2', email: 'user2@example.com' }
        ]
      })
    })

    // Add a cursor for user2
    const cursorUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'cursor-update')[1]
    act(() => {
      cursorUpdateHandler({
        user: { id: 'user2', name: 'User 2', email: 'user2@example.com' },
        position: { line: 1, column: 1 }
      })
    })

    expect(result.current.cursors.has('user2')).toBe(true)

    // Now user2 leaves
    const userLeftHandler = mockSocket.on.mock.calls.find(call => call[0] === 'user-left')[1]
    act(() => {
      userLeftHandler({
        user: { id: 'user2', name: 'User 2', email: 'user2@example.com' },
        activeUsers: [{ id: 'user1', name: 'User 1', email: 'user1@example.com' }]
      })
    })

    expect(result.current.activeUsers).toHaveLength(1)
    expect(result.current.cursors.has('user2')).toBe(false)
  })

  it('handles cursor-update event', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    const cursorData = {
      user: { id: 'user2', name: 'User 2', email: 'user2@example.com' },
      position: { line: 5, column: 10 }
    }

    const cursorUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'cursor-update')[1]
    act(() => {
      cursorUpdateHandler(cursorData)
    })

    expect(result.current.cursors.get('user2')).toEqual(cursorData)
  })

  it('joins PRD room when connected', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    // Connect first
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]
    act(() => {
      connectHandler()
    })

    // Now join PRD
    act(() => {
      result.current.joinPRD('prd-123')
    })

    expect(mockSocket.emit).toHaveBeenCalledWith('join-prd', { prdId: 'prd-123' })
  })

  it('does not join PRD room when not connected', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    act(() => {
      result.current.joinPRD('prd-123')
    })

    // Should not emit join-prd since not connected
    expect(mockSocket.emit).not.toHaveBeenCalledWith('join-prd', expect.anything())
  })

  it('leaves PRD room when connected', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    // Connect first
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]
    act(() => {
      connectHandler()
    })

    // Now leave PRD
    act(() => {
      result.current.leavePRD('prd-123')
    })

    expect(mockSocket.emit).toHaveBeenCalledWith('leave-prd', { prdId: 'prd-123' })
  })

  it('updates cursor position when connected', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    // Connect first
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]
    act(() => {
      connectHandler()
    })

    // Update cursor position
    act(() => {
      result.current.updateCursorPosition('prd-123', { line: 10, column: 5 })
    })

    expect(mockSocket.emit).toHaveBeenCalledWith('cursor-position', {
      prdId: 'prd-123',
      position: { line: 10, column: 5 }
    })
  })

  it('broadcasts content change when connected', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    // Connect first
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]
    act(() => {
      connectHandler()
    })

    // Broadcast content change
    act(() => {
      result.current.broadcastContentChange('prd-123', 'new content', 2)
    })

    expect(mockSocket.emit).toHaveBeenCalledWith('content-change', {
      prdId: 'prd-123',
      content: 'new content',
      version: 2
    })
  })

  it('handles connection errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    const connectErrorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1]
    act(() => {
      connectErrorHandler(new Error('Connection failed'))
    })

    expect(result.current.isConnected).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('WebSocket connection failed:', 'Connection failed')
    
    consoleSpy.mockRestore()
  })

  it('handles general errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'error')[1]
    act(() => {
      errorHandler({ message: 'General error' })
    })

    expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', { message: 'General error' })
    
    consoleSpy.mockRestore()
  })

  it('disconnects socket on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    unmount()

    expect(mockSocket.disconnect).toHaveBeenCalled()
  })

  it('uses custom backend URL from environment', () => {
    // Mock environment variable
    vi.stubEnv('VITE_BACKEND_URL', 'http://custom-backend:3001')

    renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    expect(mockIo).toHaveBeenCalledWith('http://custom-backend:3001', expect.any(Object))

    vi.unstubAllEnvs()
  })

  it('provides socket instance in return value', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    expect(result.current.socket).toBe(mockSocket)
  })

  it('updates cursors map correctly with multiple users', () => {
    const { result } = renderHook(() => useWebSocket({ user: mockUser, enabled: true }))

    const cursorUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'cursor-update')[1]

    // Add cursor for user1
    act(() => {
      cursorUpdateHandler({
        user: { id: 'user1', name: 'User 1', email: 'user1@example.com' },
        position: { line: 1, column: 1 }
      })
    })

    // Add cursor for user2
    act(() => {
      cursorUpdateHandler({
        user: { id: 'user2', name: 'User 2', email: 'user2@example.com' },
        position: { line: 2, column: 2 }
      })
    })

    // Update cursor for user1
    act(() => {
      cursorUpdateHandler({
        user: { id: 'user1', name: 'User 1', email: 'user1@example.com' },
        position: { line: 10, column: 5 }
      })
    })

    expect(result.current.cursors.size).toBe(2)
    expect(result.current.cursors.get('user1')?.position).toEqual({ line: 10, column: 5 })
    expect(result.current.cursors.get('user2')?.position).toEqual({ line: 2, column: 2 })
  })
})