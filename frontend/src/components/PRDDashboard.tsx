import { useState, useEffect } from 'react'
import { FileText, Plus, Search, Filter, Calendar, User, Tag } from 'lucide-react'
import { apiClient, type PRD, type User as UserType } from '../lib/api'
import { PRDEditor } from './PRDEditor'
import { CreatePRDModal } from './CreatePRDModal'

interface PRDCardProps {
  prd: PRD
  onSelect: (prd: PRD) => void
}

function PRDCard({ prd, onSelect }: PRDCardProps) {
  const statusColors = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    REVIEW: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div 
      className="card p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(prd)}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {prd.title}
        </h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[prd.status]}`}>
          {prd.status}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {prd.description}
      </p>
      
      <div className="flex flex-wrap gap-1 mb-4">
        {prd.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">
            <Tag className="w-3 h-3 mr-1" />
            {tag}
          </span>
        ))}
        {prd.tags.length > 3 && (
          <span className="text-xs text-gray-500">+{prd.tags.length - 3} more</span>
        )}
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            {prd.author.name}
          </div>
          {prd.collaborators.length > 0 && (
            <div className="flex items-center">
              <span>+{prd.collaborators.length} collaborator{prd.collaborators.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {formatDate(prd.updatedAt)}
        </div>
      </div>
    </div>
  )
}

interface PRDDashboardProps {
  user: UserType
}

export function PRDDashboard({ user }: PRDDashboardProps) {
  const [prds, setPRDs] = useState<PRD[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPRD, setSelectedPRD] = useState<PRD | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Guard against undefined user or stats
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    )
  }

  // Ensure stats object exists with defaults
  const userStats = user.stats || {
    prdsCreated: 0,
    collaborations: 0,
    aiInteractions: 0
  }

  // Load PRDs
  useEffect(() => {
    loadPRDs()
  }, [searchQuery, selectedStatus])

  const loadPRDs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getPRDs({
        search: searchQuery || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        page: 1,
        limit: 20
      })
      
      if (response.success && response.data) {
        setPRDs(response.data.prds)
      } else {
        throw new Error('Failed to load PRDs')
      }
    } catch (err) {
      console.error('Error loading PRDs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load PRDs')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    setShowCreateModal(true)
  }

  const handleCreateSuccess = () => {
    loadPRDs() // Refresh the PRD list
  }

  const handleSelectPRD = (prd: PRD) => {
    setSelectedPRD(prd)
  }

  if (selectedPRD) {
    return <PRDEditor prdId={selectedPRD.id} user={user} onBack={() => setSelectedPRD(null)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">PRD Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user.name}</p>
              </div>
            </div>
            
            <button
              onClick={handleCreateNew}
              className="button-primary px-4 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              New PRD
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total PRDs</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats.prdsCreated}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Collaborations</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats.collaborations}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Interactions</p>
                <p className="text-2xl font-semibold text-gray-900">{userStats.aiInteractions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search PRDs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="REVIEW">Review</option>
              <option value="APPROVED">Approved</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* PRD List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading PRDs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-2">{error}</div>
            <button
              onClick={loadPRDs}
              className="button-primary px-4 py-2"
            >
              Try Again
            </button>
          </div>
        ) : prds.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No PRDs found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first PRD'
              }
            </p>
            <button
              onClick={handleCreateNew}
              className="button-primary px-4 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First PRD
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prds.map((prd) => (
              <PRDCard
                key={prd.id}
                prd={prd}
                onSelect={handleSelectPRD}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create PRD Modal */}
      <CreatePRDModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

