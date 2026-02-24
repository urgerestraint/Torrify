import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsModal from '../SettingsModal'

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))
const settleUi = async () => {
  await act(async () => {
    await flushPromises()
  })
}

describe('SettingsModal', () => {
  const mockOnClose = vi.fn()

  it('does not render when closed', () => {
    const { container } = render(
      <SettingsModal isOpen={false} onClose={mockOnClose} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders when open', async () => {
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
    expect(screen.getByText('OpenSCAD Executable Path')).toBeInTheDocument()
    await settleUi()
  })

  it('loads settings on open', async () => {
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    
    await waitFor(() => {
      expect(window.electronAPI.getSettings).toHaveBeenCalled()
    })
    await settleUi()
  })

  it('allows user to change OpenSCAD path', async () => {
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'C:\\Custom\\Path\\openscad.exe' } })
    
    expect(input).toHaveValue('C:\\Custom\\Path\\openscad.exe')
    await settleUi()
  })

  it('validates path when changed', async () => {
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'C:\\Test\\openscad.exe' } })
    
    await waitFor(() => {
      expect(window.electronAPI.checkOpenscadPath).toHaveBeenCalledWith('C:\\Test\\openscad.exe')
    })
    await settleUi()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalled()
    await settleUi()
  })

  it('saves settings when save button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    
    await waitFor(() => {
      expect(window.electronAPI.getSettings).toHaveBeenCalled()
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
    await settleUi()

    const saveButton = screen.getByText('Save')
    await act(async () => {
      await user.click(saveButton)
      await flushPromises()
    })
    
    await waitFor(() => {
      expect(window.electronAPI.saveSettings).toHaveBeenCalled()
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100))
    })
    await settleUi()
  })

  it('switches to AI Configuration tab', async () => {
    const user = userEvent.setup()
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    await waitFor(() => {
      expect(window.electronAPI.getSettings).toHaveBeenCalled()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
    await settleUi()
    const aiTab = screen.getByText('AI Configuration')
    await act(async () => {
      await user.click(aiTab)
      await flushPromises()
    })
    await waitFor(() => {
      expect(screen.getByText('AI Configuration')).toBeInTheDocument()
    })
    await settleUi()
  })

  it('switches to Knowledge Base tab', async () => {
    const user = userEvent.setup()
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    await waitFor(() => {
      expect(window.electronAPI.getSettings).toHaveBeenCalled()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
    await settleUi()
    const knowledgeTab = screen.getByText('Knowledge Base')
    await act(async () => {
      await user.click(knowledgeTab)
      await flushPromises()
    })
    await waitFor(() => {
      expect(screen.getByText('AI Knowledge Base')).toBeInTheDocument()
    })
    await settleUi()
  })
})
