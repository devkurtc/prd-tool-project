import React, { useState, useEffect } from 'react'
import { Clock, GitBranch, User, ChevronRight, FileText } from 'lucide-react'
import { apiClient } from '../lib/api'
import { formatDistanceToNow } from 'date-fns'

interface Version {
  id: string
  version: number
  content: string
  createdAt: string
  changeLog?: string
  author: {
    id: string
    name: string
    email: string
  }
}

interface VersionHistoryProps {
  prdId: string
  currentVersion: number
  onVersionSelect: (version: Version) => void
  onCompare?: (v1: Version, v2: Version) => void
}

export function VersionHistory({ 
  prdId, 
  currentVersion, 
  onVersionSelect,
  onCompare 
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set())
  const [compareMode, setCompareMode] = useState(false)

  useEffect(() => {
    loadVersions()
  }, [prdId])

  const loadVersions = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/prds/${prdId}/versions`)
      setVersions(response.data.versions)
    } catch (error) {
      console.error('Failed to load versions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVersionClick = (version: Version) => {
    if (compareMode) {
      const newSelected = new Set(selectedVersions)
      if (newSelected.has(version.id)) {
        newSelected.delete(version.id)
      } else if (newSelected.size < 2) {
        newSelected.add(version.id)
      }
      setSelectedVersions(newSelected)

      // If 2 versions selected, trigger compare
      if (newSelected.size === 2 && onCompare) {
        const [v1Id, v2Id] = Array.from(newSelected)
        const v1 = versions.find(v => v.id === v1Id)!
        const v2 = versions.find(v => v.id === v2Id)!
        onCompare(v1, v2)
      }
    } else {
      onVersionSelect(version)
    }
  }

  const toggleCompareMode = () => {
    setCompareMode(!compareMode)
    setSelectedVersions(new Set())
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Version History
          </h3>
          <button
            onClick={toggleCompareMode}
            className={`text-xs px-2 py-1 rounded ${
              compareMode 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {compareMode ? 'Cancel Compare' : 'Compare'}
          </button>
        </div>
        {compareMode && (
          <p className="text-xs text-muted-foreground">
            Select two versions to compare
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 p-2">
          {versions.map((version) => {
            const isSelected = selectedVersions.has(version.id)
            const isCurrent = version.version === currentVersion
            
            return (
              <button
                key={version.id}
                onClick={() => handleVersionClick(version)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : isCurrent
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        v{version.version}
                      </span>
                      {isCurrent && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    
                    {version.changeLog && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {version.changeLog}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.author.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {versions.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">No version history yet</p>
        </div>
      )}
    </div>
  )
}