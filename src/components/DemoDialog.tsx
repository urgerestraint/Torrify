import { useState } from 'react'
import { logger } from '../utils/logger'

/**
 * Props for the DemoDialog component.
 */
interface DemoDialogProps {
  /** Indicates if the dialog is visible */
  readonly isOpen: boolean
  /** Triggered to close the dialog */
  readonly onClose: () => void
  /** Triggered to start the automated walkthrough */
  readonly onRunDemo: () => void
}

/**
 * An onboarding dialog that introduces new users to the application flow.
 * Explains the three-panel architecture and offers a guided walkthrough.
 */
function DemoDialog({ isOpen, onClose, onRunDemo }: DemoDialogProps) {
  const [isClosing, setIsClosing] = useState(false)

  if (!isOpen) return null

  /**
   * Dismisses the demo and marks it as "seen" in persistent settings.
   */
  const handleSkip = () => {
    setIsClosing(true)
    
    // Asynchronously update persistence
    window.electronAPI.getSettings()
      .then(async (settings) => {
        const updatedSettings = { ...settings, hasSeenDemo: true }
        await window.electronAPI.saveSettings(updatedSettings)
      })
      .catch((err: unknown) => {
        logger.error('Failed to persist demo status', err)
      })

    // Animation delay before removing from DOM
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  /**
   * Initiates the demo sequence.
   */
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
      <div 
        className={`bg-[#2d2d30] rounded-lg shadow-xl w-[500px] transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Section */}
        <div className="px-6 py-4 border-b border-[#3e3e42] flex items-center gap-3">
          <img src="/logo.png" alt="Torrify Logo" className="h-10 w-auto" aria-hidden />
          <div>
            <h2 className="text-2xl font-semibold text-white">Welcome to Torrify!</h2>
            <p className="text-sm text-gray-400 mt-1">Would you like to see a guided walkthrough?</p>
          </div>
        </div>

        {/* Informational Content */}
        <div className="px-6 py-6">
          <div className="text-gray-300 space-y-4">
            <p>
              Torrify combines AI intelligence with precision CAD engines. Here's what we'll demonstrate:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">AI Conversational Panel</h3>
                  <p className="text-sm text-gray-400">
                    Describe your hardware needs in plain language (e.g., "Raspberry Pi mount").
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Live Source Code</h3>
                  <p className="text-sm text-gray-400">
                    Watch the AI generate and refine production-ready OpenSCAD or Python code.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">3D Visualization</h3>
                  <p className="text-sm text-gray-400">
                    See your geometry rendered instantly in high-fidelity 3D.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <p className="text-sm text-blue-300 italic">
                <strong>Note:</strong> The demo uses a pre-simulated workflow. You'll be able to create your own custom designs immediately after.
              </p>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-[#3e3e42] flex justify-end gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-[#3e3e42] hover:bg-[#4e4e52] rounded font-medium transition-colors"
          >
            Skip Demo
          </button>
          <button
            onClick={handleRunDemo}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors shadow-lg"
          >
            Start Guided Tour
          </button>
        </div>
      </div>
    </div>
  )
}

export default DemoDialog

