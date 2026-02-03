import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsModal from '../SettingsModal'

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
  })

  it('loads settings on open', async () => {
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    
    await waitFor(() => {
      expect(window.electronAPI.getSettings).toHaveBeenCalled()
    })
  })

  it('allows user to change OpenSCAD path', async () => {
    const user = userEvent.setup()
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'C:\\Custom\\Path\\openscad.exe')
    
    expect(input).toHaveValue('C:\\Custom\\Path\\openscad.exe')
  })

  it('validates path when changed', async () => {
    const user = userEvent.setup()
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'C:\\Test\\openscad.exe')
    
    await waitFor(() => {
      expect(window.electronAPI.checkOpenscadPath).toHaveBeenCalledWith('C:\\Test\\openscad.exe')
    })
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
  })

  it('saves settings when save button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    const saveButton = screen.getByText('Save')
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(window.electronAPI.saveSettings).toHaveBeenCalled()
    })
  })

  it('switches to AI Configuration tab', async () => {
    const user = userEvent.setup()
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    await waitFor(() => expect(screen.getByText('Settings')).toBeInTheDocument())
    const aiTab = screen.getByText('AI Configuration')
    await user.click(aiTab)
    await waitFor(() => {
      expect(screen.getByText('AI Configuration')).toBeInTheDocument()
    })
  })

  it('switches to Knowledge Base tab', async () => {
    const user = userEvent.setup()
    render(
      <SettingsModal isOpen={true} onClose={mockOnClose} />
    )
    await waitFor(() => expect(screen.getByText('Settings')).toBeInTheDocument())
    const knowledgeTab = screen.getByText('Knowledge Base')
    await user.click(knowledgeTab)
    await waitFor(() => {
      expect(screen.getByText('AI Knowledge Base')).toBeInTheDocument()
    })
  })
})
