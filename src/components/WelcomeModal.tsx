import { useState, useEffect } from 'react'
import { requiresApiKey } from '../services/llm'
import { logger } from '../utils/logger'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: () => void
}

function WelcomeModal({ isOpen, onClose, onOpenSettings }: WelcomeModalProps) {
  const [openscadConfigured, setOpenscadConfigured] = useState(false)
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false)

  useEffect(() => {
    if (isOpen) {
      checkConfiguration()
    }
  }, [isOpen])

  const checkConfiguration = async () => {
    try {
      const settings = await window.electronAPI.getSettings()
      
      // Check if OpenSCAD path exists and is valid
      const pathExists = await window.electronAPI.checkOpenscadPath(settings.openscadPath)
      setOpenscadConfigured(pathExists)
      
      // Check if API key is configured (local providers don't need one)
      const needsApiKey = requiresApiKey(settings.llm.provider)
      setApiKeyConfigured(needsApiKey ? !!settings.llm.apiKey?.trim() : true)
    } catch (error) {
      logger.error('Failed to check configuration', error)
    }
  }

  if (!isOpen) return null

  const allConfigured = openscadConfigured && apiKeyConfigured

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#2d2d30] rounded-lg shadow-xl w-[700px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3e3e42] flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-10 w-auto" aria-hidden />
          <div>
            <h2 className="text-2xl font-semibold text-white">Welcome to Torrify!</h2>
            <p className="text-sm text-gray-400 mt-1">Let's get you set up</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="text-gray-300">
            <p className="mb-4">
              Torrify is an AI-assisted IDE for OpenSCAD. To get started, you'll need to configure two things:
            </p>

            {/* OpenSCAD Configuration */}
            <div className="mb-6 p-4 bg-[#1e1e1e] rounded-lg border border-[#3e3e42]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    1. OpenSCAD Executable
                  </h3>
                  <p className="text-sm text-gray-400">
                    Select the location of your OpenSCAD executable file. This is required for rendering 3D models.
                  </p>
                </div>
                {openscadConfigured ? (
                  <div className="ml-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="ml-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {!openscadConfigured && (
                <button
                  onClick={onOpenSettings}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors text-sm"
                >
                  Configure OpenSCAD Path
                </button>
              )}
            </div>

            {/* API Key Configuration */}
            <div className="mb-6 p-4 bg-[#1e1e1e] rounded-lg border border-[#3e3e42]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    2. AI API Key (Optional)
                  </h3>
                  <p className="text-sm text-gray-400">
                    Configure an API key to enable AI chat assistance. You can skip this and configure it later.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported providers: Google Gemini, OpenAI, or custom/local models
                  </p>
                </div>
                {apiKeyConfigured ? (
                  <div className="ml-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="ml-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {!apiKeyConfigured && (
                <button
                  onClick={onOpenSettings}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors text-sm"
                >
                  Configure API Key
                </button>
              )}
            </div>

            {/* Quick Start Guide */}
            <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-300 mb-2">Quick Start</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Write OpenSCAD code in the center editor</li>
                <li>Press <kbd className="px-1.5 py-0.5 bg-[#3e3e42] rounded text-xs">Ctrl+S</kbd> or click Render to see your 3D model</li>
                <li>Use the AI chat (left panel) for help with OpenSCAD</li>
                <li>Save your projects to preserve code, models, and chat history</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#3e3e42] flex justify-end gap-3">
          {allConfigured ? (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
            >
              Get Started
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#3e3e42] hover:bg-[#4e4e52] rounded font-medium transition-colors"
              >
                Skip for Now
              </button>
              <button
                onClick={onOpenSettings}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
              >
                Open Settings
              </button>
            </>
          )}
        </div>
        
        {allConfigured && (
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-400 text-center">
              After closing, you'll be asked if you'd like to see a demo of Torrify in action
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WelcomeModal

