import Editor from '@monaco-editor/react'
import { useEffect } from 'react'

type CADBackend = 'openscad' | 'build123d'

interface EditorPanelProps {
  code: string
  onChange: (code: string) => void
  onRender: () => void
  editorKey?: number
  cadBackend?: CADBackend
}

// Backend-specific editor configurations
const BACKEND_CONFIG: Record<CADBackend, { language: string; label: string }> = {
  openscad: { language: 'c', label: 'OpenSCAD Script' },
  build123d: { language: 'python', label: 'Python (build123d)' }
}

function EditorPanel({ code, onChange, onRender, editorKey, cadBackend = 'openscad' }: EditorPanelProps) {
  const config = BACKEND_CONFIG[cadBackend]
  const hasCode = code.trim().length > 0

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        // Ctrl+S triggers render (could be changed to save if file is open)
        // Only render if there's code
        if (code.trim().length > 0) {
          onRender()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onRender, code])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#3e3e42] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Code Editor</h2>
          <p className="text-xs text-gray-400">{config.label}</p>
        </div>
        <button
          onClick={onRender}
          disabled={!hasCode}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors text-sm"
          title={hasCode ? 'Render the code (Ctrl+S)' : 'Add code to render'}
        >
          Render (Ctrl+S)
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          key={`${editorKey}-${cadBackend}`}
          height="100%"
          defaultLanguage={config.language}
          language={config.language}
          theme="vs-dark"
          value={code}
          onChange={(value) => onChange(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: cadBackend === 'build123d' ? 4 : 2,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  )
}

export default EditorPanel
