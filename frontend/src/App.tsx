import { useState, useEffect } from 'react'
import { FileText, Users, Brain, ArrowRight, LogOut } from 'lucide-react'
import { apiClient } from './lib/api'
import { PRDDashboard } from './components/PRDDashboard'
import { LoginForm } from './components/LoginForm'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function LogoutButton() {
  const { logout } = useAuth()
  
  return (
    <button
      onClick={logout}
      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Logout
    </button>
  )
}

function AppContent() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  useEffect(() => {
    checkBackendHealth()
  }, [])

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginForm 
        isRegisterMode={isRegisterMode}
        onToggleMode={() => setIsRegisterMode(!isRegisterMode)}
      />
    )
  }

  const checkBackendHealth = async () => {
    try {
      const response = await apiClient.healthCheck()
      console.log('Backend health check:', response)
    } catch (err) {
      console.error('Backend health check failed:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (showDashboard && user) {
    return <PRDDashboard user={user} />
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gradient">PRD Tool</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">v0.1.0</span>
              <div className="flex items-center space-x-2 text-sm">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>Development</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-gradient">
            AI-Powered Product Requirements
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create, collaborate, and manage PRDs with AI assistance and real-time collaboration
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold">AI-Powered</h3>
            </div>
            <p className="text-muted-foreground">
              Generate content, suggestions, and diagrams with advanced AI assistance
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold">Real-Time Collaboration</h3>
            </div>
            <p className="text-muted-foreground">
              Work together with your team with live editing and presence awareness
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="h-8 w-8 text-primary" />
              <h3 className="text-xl font-semibold">Version Control</h3>
            </div>
            <p className="text-muted-foreground">
              Track changes and manage versions with Git-based workflow
            </p>
          </div>
        </div>

        {/* Status & Demo */}
        <div className="card p-6 text-center">
          <h3 className="text-2xl font-semibold mb-4">Development Status</h3>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
              <p className="text-red-600 text-xs mt-1">Make sure the backend server is running on port 3001</p>
            </div>
          )}
          
          {user && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 font-medium">✅ Connected to Backend!</p>
              <p className="text-green-600 text-sm">Logged in as: {user.name} ({user.email})</p>
              <div className="mt-3 flex gap-2 justify-center">
                <button
                  onClick={() => setShowDashboard(true)}
                  className="button-primary px-4 py-2 flex items-center"
                >
                  View PRD Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </button>
                <LogoutButton />
              </div>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div>
              <h4 className="font-semibold text-green-600 mb-2">✅ Completed</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Project documentation and specifications</li>
                <li>• Development environment setup</li>
                <li>• Backend Express.js with TypeScript + Database</li>
                <li>• JWT Authentication system</li>
                <li>• Swagger API documentation</li>
                <li>• Automated testing (17+ tests)</li>
                <li>• Frontend authentication integration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">🔄 Coming Next</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Monaco Editor integration</li>
                <li>• Real-time collaboration</li>
                <li>• AI-powered features</li>
                <li>• Version control workflow</li>
                <li>• Advanced PRD templates</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          PRD Tool - AI-Powered Product Requirements Platform
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
