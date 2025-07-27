import { X, GitCompare } from 'lucide-react'

interface DiffViewerProps {
  version1: {
    version: number
    content: string
    createdAt: string
    author: { name: string }
  }
  version2: {
    version: number
    content: string
    createdAt: string
    author: { name: string }
  }
  onClose: () => void
}

export function DiffViewer({ version1, version2, onClose }: DiffViewerProps) {
  // Simple line-by-line diff
  const lines1 = version1.content.split('\n')
  const lines2 = version2.content.split('\n')
  
  const maxLines = Math.max(lines1.length, lines2.length)
  const diffLines: Array<{
    line1?: string
    line2?: string
    type: 'unchanged' | 'added' | 'removed' | 'modified'
  }> = []

  for (let i = 0; i < maxLines; i++) {
    const line1 = lines1[i]
    const line2 = lines2[i]
    
    if (line1 === line2) {
      diffLines.push({ line1, line2, type: 'unchanged' })
    } else if (line1 && !line2) {
      diffLines.push({ line1, type: 'removed' })
    } else if (!line1 && line2) {
      diffLines.push({ line2, type: 'added' })
    } else {
      diffLines.push({ line1, line2, type: 'modified' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <GitCompare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Version Comparison</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">v{version1.version}</span>
              <span>→</span>
              <span className="font-medium">v{version2.version}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Version Info */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b">
          <div>
            <div className="text-sm font-medium mb-1">Version {version1.version}</div>
            <div className="text-xs text-muted-foreground">
              by {version1.author.name} • {new Date(version1.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Version {version2.version}</div>
            <div className="text-xs text-muted-foreground">
              by {version2.author.name} • {new Date(version2.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 divide-x">
            {/* Left side - Version 1 */}
            <div className="overflow-x-auto">
              <pre className="p-4 text-sm font-mono">
                {diffLines.map((diff, index) => (
                  <div
                    key={index}
                    className={`${
                      diff.type === 'removed' ? 'bg-red-100 text-red-800' :
                      diff.type === 'modified' ? 'bg-yellow-100 text-yellow-800' :
                      ''
                    }`}
                  >
                    <span className="select-none text-gray-400 pr-4">
                      {index + 1}
                    </span>
                    {diff.line1 || '\u00A0'}
                  </div>
                ))}
              </pre>
            </div>

            {/* Right side - Version 2 */}
            <div className="overflow-x-auto">
              <pre className="p-4 text-sm font-mono">
                {diffLines.map((diff, index) => (
                  <div
                    key={index}
                    className={`${
                      diff.type === 'added' ? 'bg-green-100 text-green-800' :
                      diff.type === 'modified' ? 'bg-yellow-100 text-yellow-800' :
                      ''
                    }`}
                  >
                    <span className="select-none text-gray-400 pr-4">
                      {index + 1}
                    </span>
                    {diff.line2 || '\u00A0'}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                Added
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                Removed
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                Modified
              </span>
            </div>
            <button
              onClick={onClose}
              className="button-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}