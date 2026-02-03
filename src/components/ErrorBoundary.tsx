import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '../utils/logger'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: ''
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('UI error boundary caught', { error, info })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#1e1e1e] text-white">
          <div className="max-w-xl rounded border border-[#3e3e42] bg-[#252526] p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
            <p className="mb-4 text-sm text-gray-300">
              The UI encountered an unexpected error. Please restart the app.
            </p>
            {this.state.message && (
              <div className="rounded bg-[#1e1e1e] p-3 text-left text-xs text-gray-400">
                {this.state.message}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
