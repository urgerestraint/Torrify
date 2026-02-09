import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsModal from '../SettingsModal'

describe('SettingsModal CAD Backend', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Mock getSettings to return default settings
    window.electronAPI.getSettings = vi.fn().mockResolvedValue({
      cadBackend: 'openscad',
      openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
      build123dPythonPath: 'python',
      llm: {
        provider: 'gemini',
        model: 'gemini-3-flash',
        apiKey: 'test-key',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048,
      },
      recentFiles: [],
    })
    
    window.electronAPI.checkOpenscadPath = vi.fn().mockResolvedValue(true)
    window.electronAPI.checkPythonPath = vi.fn().mockResolvedValue({ valid: true, version: 'Python 3.12.0' })
    window.electronAPI.validateCadBackend = vi.fn().mockResolvedValue({ valid: true })
  })

  it('should render CAD Backend selector in General tab', async () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('CAD Backend')).toBeInTheDocument()
    })
  })

  it('should display OpenSCAD and build123d options', async () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('OpenSCAD')).toBeInTheDocument()
    })
    
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
  })

  it('should show OpenSCAD path input when OpenSCAD is selected', async () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('OpenSCAD Executable Path')).toBeInTheDocument()
    })
  })

  it('should show Python path input when build123d is selected', async () => {
    window.electronAPI.getSettings = vi.fn().mockResolvedValue({
      cadBackend: 'build123d',
      openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
      build123dPythonPath: 'python',
      llm: {
        provider: 'gemini',
        model: 'gemini-3-flash',
        apiKey: 'test-key',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048,
      },
      recentFiles: [],
    })

    render(<SettingsModal isOpen={true} onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('Python Interpreter Path')).toBeInTheDocument()
    })
  })

  it('should call validateCadBackend when backend is changed', async () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText('CAD Backend')).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'build123d' } })

    await waitFor(() => {
      expect(window.electronAPI.validateCadBackend).toHaveBeenCalledWith('build123d')
    })
  })
})
