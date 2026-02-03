import { useState } from 'react'
import { logger } from '../utils/logger'

interface DemoDialogProps {
  isOpen: boolean
  onClose: () => void
  onRunDemo: () => void
}

function DemoDialog({ isOpen, onClose, onRunDemo }: DemoDialogProps) {
  const [isClosing, setIsClosing] = useState(false)

  if (!isOpen) return null

  const handleSkip = () => {
    setIsClosing(true)
    // Mark demo as seen even if skipped
    window.electronAPI.getSettings().then(async (settings) => {
      const updatedSettings = { ...settings, hasSeenDemo: true }
      await window.electronAPI.saveSettings(updatedSettings)
    }).catch((err: unknown) => logger.error('Failed to save demo status', err))
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  const handleRunDemo = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      onRunDemo()
    }, 200)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className={`bg-[#2d2d30] rounded-lg shadow-xl w-[500px] transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3e3e42] flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-10 w-auto" aria-hidden />
          <div>
            <h2 className="text-2xl font-semibold text-white">Welcome to Torrify!</h2>
            <p className="text-sm text-gray-400 mt-1">Would you like to see a demo?</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="text-gray-300 space-y-4">
            <p>
              I can show you how Torrify works by demonstrating all three panels:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">AI Chat Panel</h3>
                  <p className="text-sm text-gray-400">
                    Ask the AI to create a Raspberry Pi 5 backing plate with heat-set inserts
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Code Editor</h3>
                  <p className="text-sm text-gray-400">
                    Watch as the generated OpenSCAD code appears in the editor
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">3D Preview</h3>
                  <p className="text-sm text-gray-400">
                    See the rendered 3D model appear automatically in the preview panel
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> The demo will use pre-generated content to show the workflow. You can interact with the AI chat after the demo to generate your own designs!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#3e3e42] flex justify-end gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-[#3e3e42] hover:bg-[#4e4e52] rounded font-medium transition-colors"
          >
            Skip Demo
          </button>
          <button
            onClick={handleRunDemo}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
          >
            Show Demo
          </button>
        </div>
      </div>
    </div>
  )
}

export default DemoDialog

