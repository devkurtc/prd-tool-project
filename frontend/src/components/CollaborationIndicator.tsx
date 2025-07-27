interface ActiveUser {
  id: string
  name: string
  email: string
}

interface CollaborationIndicatorProps {
  activeUsers: ActiveUser[]
  currentUserId: string
}

const userColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#F8B739', '#52B788', '#E56B6F'
]

function getUserColor(userId: string): string {
  // Generate consistent color based on user ID
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  return userColors[Math.abs(hash) % userColors.length]
}

export function CollaborationIndicator({ activeUsers, currentUserId }: CollaborationIndicatorProps) {
  const otherUsers = activeUsers.filter(user => user.id !== currentUserId)
  
  if (otherUsers.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b">
      <span className="text-sm text-gray-600">Collaborating with:</span>
      <div className="flex -space-x-2">
        {otherUsers.slice(0, 5).map(user => (
          <div
            key={user.id}
            className="relative inline-flex items-center justify-center w-8 h-8 overflow-hidden bg-gray-100 rounded-full ring-2 ring-white"
            style={{ backgroundColor: getUserColor(user.id) }}
            title={user.name}
          >
            <span className="text-xs font-medium text-white">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
        ))}
        {otherUsers.length > 5 && (
          <div className="relative inline-flex items-center justify-center w-8 h-8 overflow-hidden bg-gray-300 rounded-full ring-2 ring-white">
            <span className="text-xs font-medium text-gray-600">
              +{otherUsers.length - 5}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm text-gray-600">Live</span>
      </div>
    </div>
  )
}

export function CursorLabel({ user, position }: { user: ActiveUser; position: { x: number; y: number } }) {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-1px, -100%)'
      }}
    >
      <div className="flex items-start">
        <div
          className="w-0.5 h-5"
          style={{ backgroundColor: getUserColor(user.id) }}
        />
        <div
          className="px-2 py-0.5 text-xs text-white rounded-t rounded-br shadow-sm"
          style={{ backgroundColor: getUserColor(user.id) }}
        >
          {user.name}
        </div>
      </div>
    </div>
  )
}