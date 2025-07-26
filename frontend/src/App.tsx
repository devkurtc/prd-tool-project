import { FileText, Users, Brain } from 'lucide-react'

function App() {
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

        {/* Status */}
        <div className="card p-6 text-center">
          <h3 className="text-2xl font-semibold mb-4">Development Status</h3>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div>
              <h4 className="font-semibold text-green-600 mb-2">✅ Completed</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Project documentation and specifications</li>
                <li>• Development environment setup</li>
                <li>• Frontend Vite + React foundation</li>
                <li>• Design system and Tailwind CSS</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">🔄 In Progress</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Backend Express.js setup</li>
                <li>• Database schema implementation</li>
                <li>• Authentication system</li>
                <li>• Monaco Editor integration</li>
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

export default App
