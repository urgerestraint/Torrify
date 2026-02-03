import type { ContextStatus } from './types'

interface KnowledgeSettingsProps {
  contextStatus: ContextStatus | null
  isUpdatingContext: 'openscad' | 'build123d' | null
  contextMessage: string | null
  onUpdateContext: (backend: 'openscad' | 'build123d') => void
  onResetContext: (backend?: 'openscad' | 'build123d') => void
}

export function KnowledgeSettings({
  contextStatus,
  isUpdatingContext,
  contextMessage,
  onUpdateContext,
  onResetContext
}: KnowledgeSettingsProps) {
  return (
    <div
      className="space-y-6"
      role="tabpanel"
      id="settings-panel-knowledge"
      aria-labelledby="settings-tab-knowledge"
    >
      <div>
        <h3 className="text-lg font-medium text-white mb-2">AI Knowledge Base</h3>
        <p className="text-sm text-gray-400 mb-4">
          The AI assistant uses API reference files to provide accurate help for OpenSCAD and
          build123d. You can update these definitions from the cloud or reset to the bundled
          versions.
        </p>
      </div>

      {/* OpenSCAD Context */}
      <div className="p-4 bg-[#1e1e1e] rounded-lg border border-[#3e3e42]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-white font-medium">OpenSCAD Reference</h4>
            <p className="text-xs text-gray-500">API definitions for OpenSCAD functions and modules</p>
          </div>
          <span
            className={`px-2 py-1 text-xs rounded ${
              contextStatus?.openscad?.active === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {contextStatus?.openscad?.active === 'user' ? 'Custom' : 'Bundled'}
          </span>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          {contextStatus?.openscad?.active === 'user' && contextStatus.openscad.user.modified && (
            <span>
              Updated: {new Date(contextStatus.openscad.user.modified).toLocaleDateString()} (
              {Math.round(contextStatus.openscad.user.size / 1024)}KB)
            </span>
          )}
          {contextStatus?.openscad?.active === 'bundled' && contextStatus.openscad.bundled.exists && (
            <span>Bundled version ({Math.round(contextStatus.openscad.bundled.size / 1024)}KB)</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onUpdateContext('openscad')}
            disabled={isUpdatingContext !== null}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
          >
            {isUpdatingContext === 'openscad' ? 'Updating...' : 'Update from Cloud'}
          </button>
          {contextStatus?.openscad?.active === 'user' && (
            <button
              onClick={() => onResetContext('openscad')}
              disabled={isUpdatingContext !== null}
              className="px-3 py-1.5 bg-[#3e3e42] hover:bg-[#4e4e52] disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
            >
              Reset to Factory
            </button>
          )}
        </div>
      </div>

      {/* build123d Context */}
      <div className="p-4 bg-[#1e1e1e] rounded-lg border border-[#3e3e42]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-white font-medium">build123d Reference</h4>
            <p className="text-xs text-gray-500">API definitions for build123d Python library</p>
          </div>
          <span
            className={`px-2 py-1 text-xs rounded ${
              contextStatus?.build123d?.active === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {contextStatus?.build123d?.active === 'user' ? 'Custom' : 'Bundled'}
          </span>
        </div>

        <div className="text-xs text-gray-500 mb-3">
          {contextStatus?.build123d?.active === 'user' && contextStatus.build123d.user.modified && (
            <span>
              Updated: {new Date(contextStatus.build123d.user.modified).toLocaleDateString()} (
              {Math.round(contextStatus.build123d.user.size / 1024)}KB)
            </span>
          )}
          {contextStatus?.build123d?.active === 'bundled' && contextStatus.build123d.bundled.exists && (
            <span>Bundled version ({Math.round(contextStatus.build123d.bundled.size / 1024)}KB)</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onUpdateContext('build123d')}
            disabled={isUpdatingContext !== null}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
          >
            {isUpdatingContext === 'build123d' ? 'Updating...' : 'Update from Cloud'}
          </button>
          {contextStatus?.build123d?.active === 'user' && (
            <button
              onClick={() => onResetContext('build123d')}
              disabled={isUpdatingContext !== null}
              className="px-3 py-1.5 bg-[#3e3e42] hover:bg-[#4e4e52] disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
            >
              Reset to Factory
            </button>
          )}
        </div>
      </div>

      {/* Reset All */}
      <div className="pt-4 border-t border-[#3e3e42]">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">Factory Reset</h4>
            <p className="text-xs text-gray-500">Reset all context files to the bundled versions</p>
          </div>
          <button
            onClick={() => onResetContext()}
            disabled={
              isUpdatingContext !== null ||
              (contextStatus?.openscad?.active === 'bundled' && contextStatus?.build123d?.active === 'bundled')
            }
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>

      {contextMessage && (
        <div
          className={`p-3 rounded ${
            contextMessage.includes('Error') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
          }`}
        >
          {contextMessage}
        </div>
      )}
    </div>
  )
}
