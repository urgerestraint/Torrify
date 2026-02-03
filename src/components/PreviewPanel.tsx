import { useRef } from 'react'
import StlViewer, { type StlViewerHandle } from './StlViewer'
import type { CADBackend } from '../services/cad'
import { BACKEND_NAMES } from '../services/cad'

interface PreviewPanelProps {
  image: string | null
  stlBase64: string | null
  isRendering: boolean
  error: string | null
  onRender: () => void
  onSendSnapshot: (dataUrl: string) => void
  onDiagnoseError?: (error: string) => void
  cadBackend?: CADBackend
  hasCode?: boolean
}

function PreviewPanel({ image, stlBase64, isRendering, error, onRender, onSendSnapshot, onDiagnoseError, cadBackend = 'openscad', hasCode = true }: PreviewPanelProps) {
  const viewerRef = useRef<StlViewerHandle | null>(null)

  const handleSendSnapshot = () => {
    const dataUrl = viewerRef.current?.captureImage()
    if (dataUrl) {
      onSendSnapshot(dataUrl)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#3e3e42] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Render Preview</h2>
          <p className="text-xs text-gray-400">{BACKEND_NAMES[cadBackend]} Output</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRender}
            disabled={isRendering || !hasCode}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors text-sm"
            title={hasCode ? 'Re-render the code' : 'Add code to render'}
          >
            {isRendering ? 'Rendering...' : 'Refresh'}
          </button>
          <button
            onClick={handleSendSnapshot}
            disabled={!stlBase64 || isRendering}
            className="px-3 py-2 bg-[#3e3e42] hover:bg-[#4e4e52] disabled:bg-[#2d2d30] disabled:cursor-not-allowed rounded text-sm"
            title="Send screenshot to AI"
          >
            Send to AI
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-[#252526] flex items-center justify-center p-4">
        {isRendering && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Rendering...</p>
          </div>
        )}

        {!isRendering && error && (
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-400">Render Error</h3>
            <p className="text-sm text-gray-400 break-words max-h-48 overflow-y-auto">{error}</p>
            {onDiagnoseError && (
              <button
                onClick={() => onDiagnoseError(error)}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium transition-colors text-sm inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Ask AI to Diagnose
              </button>
            )}
            <p className="text-xs text-gray-500 mt-4">
              Check your code syntax or click "Ask AI to Diagnose" for help.
            </p>
          </div>
        )}

        {!isRendering && !error && !image && !stlBase64 && (
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No preview yet</p>
            <p className="text-sm mt-2">Click "Render" or press Ctrl+S to generate preview</p>
          </div>
        )}

        {!isRendering && !error && stlBase64 && (
          <div className="w-full h-full">
            <StlViewer ref={viewerRef} stlBase64={stlBase64} />
          </div>
        )}

        {!isRendering && !error && !stlBase64 && image && (
          <img
            src={image}
            alt={`${BACKEND_NAMES[cadBackend]} Render`}
            className="max-w-full max-h-full object-contain rounded shadow-lg"
          />
        )}
      </div>
    </div>
  )
}

export default PreviewPanel
