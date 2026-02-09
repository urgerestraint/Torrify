import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '../utils/logger'

/**
 * Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
  /** The application sub-tree to be monitored for runtime errors */
  readonly children: ReactNode
}

/**
 * State for tracking the presence and details of a UI crash.
 */
interface ErrorBoundaryState {
  /** If true, a child component threw an unhandled exception */
  readonly hasError: boolean
  /** The message associated with the caught error */
  readonly message: string
}

/**
 * A declarative component that catches JavaScript errors anywhere in its 
 * child component tree and displays a fallback UI instead of crashing the app.
 * 
 * Note: Error boundaries do not catch errors for event handlers or async code.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    message: ''
  }

  /**
   * Updates state so the next render will show the fallback UI.
   * 
   * @param error - The error that was thrown
   * @returns The updated state object
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message
    }
  }

  /**
   * Logs error details to the centralized application logger for debugging.
   * 
   * @param error - The caught error object
   * @param info - Object containing the component stack trace
   */
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('UI runtime crash caught by boundary', { 
      errorMessage: error.message, 
      stack: info.componentStack 
    })
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#1e1e1e] text-white">
          <div className="max-w-xl rounded border border-[#3e3e42] bg-[#252526] p-8 text-center shadow-2xl">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold">Something went wrong</h2>
            <p className="mb-6 text-sm text-gray-400">
              The user interface encountered an unexpected failure. Please try restarting the application.
            </p>
            {this.state.message && (
              <div className="rounded bg-[#1e1e1e] p-4 text-left text-xs font-mono text-red-400/80 border border-red-900/30 overflow-auto max-h-40">
                <strong>Error:</strong> {this.state.message}
              </div>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors shadow-lg"
            >
              Reload Interface
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
