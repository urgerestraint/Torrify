import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmDialog from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={false}
        title="Confirm"
        message="Are you sure?"
        onConfirm={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders title and message when open', () => {
    render(
      <ConfirmDialog
        isOpen
        title="Discard changes?"
        message="You have unsaved changes."
        onConfirm={vi.fn()}
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Discard changes?')).toBeInTheDocument()
    expect(screen.getByText('You have unsaved changes.')).toBeInTheDocument()
  })

  it('calls onConfirm when OK is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <ConfirmDialog
        isOpen
        title="Confirm"
        message="Proceed?"
        onConfirm={onConfirm}
      />
    )
    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('shows Cancel button and calls onCancel when showCancel is true', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog
        isOpen
        title="Confirm"
        message="Proceed?"
        showCancel
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('uses custom confirm and cancel labels', () => {
    render(
      <ConfirmDialog
        isOpen
        title="Confirm"
        message="Proceed?"
        confirmLabel="Yes"
        cancelLabel="No"
        showCancel
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Yes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No' })).toBeInTheDocument()
  })
})
