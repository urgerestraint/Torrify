import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'
import { logger } from '../../utils/logger'

vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}))

function ThrowError({ message = 'Test error' }: { message?: string }): ReactNode {
  throw new Error(message)
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <span>Child content</span>
      </ErrorBoundary>
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('catches render errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/The user interface encountered an unexpected failure/)).toBeInTheDocument()
  })

  it('displays the error message in the fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Custom error message" />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })

  it('calls logger.error in componentDidCatch', () => {
    render(
      <ErrorBoundary>
        <ThrowError message="Logged error" />
      </ErrorBoundary>
    )
    expect(vi.mocked(logger).error).toHaveBeenCalledWith('UI runtime crash caught by boundary', expect.any(Object))
  })
})
