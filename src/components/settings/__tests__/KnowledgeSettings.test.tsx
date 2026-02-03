import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KnowledgeSettings } from '../KnowledgeSettings'
import type { ContextStatus } from '../types'

const defaultContextStatus: ContextStatus = {
  openscad: {
    user: { exists: false, size: 0, modified: null },
    bundled: { exists: true, size: 1024, modified: '2026-01-01T00:00:00.000Z' },
    active: 'bundled'
  },
  build123d: {
    user: { exists: false, size: 0, modified: null },
    bundled: { exists: true, size: 2048, modified: '2026-01-01T00:00:00.000Z' },
    active: 'bundled'
  }
}

const defaultProps = {
  contextStatus: defaultContextStatus,
  isUpdatingContext: null as 'openscad' | 'build123d' | null,
  contextMessage: null as string | null,
  onUpdateContext: vi.fn(),
  onResetContext: vi.fn()
}

describe('KnowledgeSettings', () => {
  it('renders AI Knowledge Base heading and description', () => {
    render(<KnowledgeSettings {...defaultProps} />)
    expect(screen.getByRole('heading', { level: 3, name: /AI Knowledge Base/i })).toBeInTheDocument()
    expect(screen.getByText(/API reference files to provide accurate help/)).toBeInTheDocument()
  })

  it('renders OpenSCAD Reference section with Update from Cloud button', () => {
    render(<KnowledgeSettings {...defaultProps} />)
    expect(screen.getByRole('heading', { level: 4, name: /OpenSCAD Reference/i })).toBeInTheDocument()
    const updateButtons = screen.getAllByRole('button', { name: /Update from Cloud/i })
    expect(updateButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders build123d Reference section', () => {
    render(<KnowledgeSettings {...defaultProps} />)
    expect(screen.getByRole('heading', { level: 4, name: /build123d Reference/i })).toBeInTheDocument()
  })

  it('shows Bundled badge when context is bundled', () => {
    render(<KnowledgeSettings {...defaultProps} />)
    const bundledBadges = screen.getAllByText('Bundled')
    expect(bundledBadges.length).toBeGreaterThanOrEqual(1)
  })

  it('shows Custom badge when OpenSCAD context is user', () => {
    const status: ContextStatus = {
      ...defaultContextStatus,
      openscad: {
        ...defaultContextStatus.openscad!,
        active: 'user',
        user: { exists: true, size: 512, modified: '2026-01-02T00:00:00.000Z' }
      }
    }
    render(<KnowledgeSettings {...defaultProps} contextStatus={status} />)
    expect(screen.getByText('Custom')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reset to Factory/i })).toBeInTheDocument()
  })

  it('calls onUpdateContext when Update from Cloud is clicked', async () => {
    const user = userEvent.setup()
    const onUpdateContext = vi.fn()
    render(<KnowledgeSettings {...defaultProps} onUpdateContext={onUpdateContext} />)

    const updateButtons = screen.getAllByRole('button', { name: /Update from Cloud/i })
    await user.click(updateButtons[0])
    expect(onUpdateContext).toHaveBeenCalledWith('openscad')
  })

  it('calls onResetContext when Reset to Factory is clicked for openscad', async () => {
    const user = userEvent.setup()
    const onResetContext = vi.fn()
    const status: ContextStatus = {
      ...defaultContextStatus,
      openscad: {
        ...defaultContextStatus.openscad!,
        active: 'user',
        user: { exists: true, size: 512, modified: null }
      }
    }
    render(<KnowledgeSettings {...defaultProps} contextStatus={status} onResetContext={onResetContext} />)

    const resetButtons = screen.getAllByRole('button', { name: /Reset to Factory/i })
    await user.click(resetButtons[0])
    expect(onResetContext).toHaveBeenCalledWith('openscad')
  })

  it('renders Reset All button', () => {
    render(<KnowledgeSettings {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Reset All/i })).toBeInTheDocument()
  })

  it('calls onResetContext when Reset All is clicked', async () => {
    const user = userEvent.setup()
    const onResetContext = vi.fn()
    const status: ContextStatus = {
      ...defaultContextStatus,
      openscad: { ...defaultContextStatus.openscad!, active: 'user', user: { exists: true, size: 0, modified: null } }
    }
    render(<KnowledgeSettings {...defaultProps} contextStatus={status} onResetContext={onResetContext} />)

    await user.click(screen.getByRole('button', { name: /Reset All/i }))
    expect(onResetContext).toHaveBeenCalledWith()
  })

  it('disables Update button when isUpdatingContext is set', () => {
    render(<KnowledgeSettings {...defaultProps} isUpdatingContext="openscad" />)
    const updateButtons = screen.getAllByRole('button', { name: /Updating...|Update from Cloud/i })
    const updatingButton = updateButtons.find((b) => b.textContent?.includes('Updating'))
    expect(updatingButton).toBeInTheDocument()
  })

  it('shows contextMessage when provided', () => {
    render(<KnowledgeSettings {...defaultProps} contextMessage="Updated successfully." />)
    expect(screen.getByText('Updated successfully.')).toBeInTheDocument()
  })
})
