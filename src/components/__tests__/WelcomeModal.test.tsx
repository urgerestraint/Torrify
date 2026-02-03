import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WelcomeModal from '../WelcomeModal'

describe('WelcomeModal', () => {
  const mockOnClose = vi.fn()
  const mockOnOpenSettings = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.electronAPI.getSettings = vi.fn().mockResolvedValue({
      openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
      llm: {
        provider: 'gemini',
        apiKey: 'test-api-key'
      }
    })
    window.electronAPI.checkOpenscadPath = vi.fn().mockResolvedValue(true)
  })

  it('does not render when isOpen is false', () => {
    render(<WelcomeModal isOpen={false} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    expect(screen.queryByText('Welcome to Torrify!')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    expect(screen.getByText('Welcome to Torrify!')).toBeInTheDocument()
    expect(screen.getByText(/Let's get you set up/i)).toBeInTheDocument()
  })

  it('displays OpenSCAD configuration section', () => {
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    expect(screen.getByText('1. OpenSCAD Executable')).toBeInTheDocument()
  })

  it('displays API Key configuration section', () => {
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    expect(screen.getByText('2. AI API Key (Optional)')).toBeInTheDocument()
  })

  it('shows checkmark when OpenSCAD is configured', async () => {
    window.electronAPI.checkOpenscadPath = vi.fn().mockResolvedValue(true)
    
    const { container } = render(<WelcomeModal isOpen={true} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    
    await waitFor(() => {
      // Check for green checkmark SVG (text-green-400 class indicates configured)
      const checkmarks = container.querySelectorAll('svg.text-green-400')
      expect(checkmarks.length).toBeGreaterThan(0)
    })
  })

  it('shows configure button when OpenSCAD is not configured', async () => {
    window.electronAPI.checkOpenscadPath = vi.fn().mockResolvedValue(false)
    
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /configure openscad path/i })).toBeInTheDocument()
    })
  })

  it('shows configure button when API key is not configured', async () => {
    window.electronAPI.getSettings = vi.fn().mockResolvedValue({
      openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
      llm: {
        provider: 'gemini',
        apiKey: ''
      }
    })
    
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /configure api key/i })).toBeInTheDocument()
    })
  })

  it('calls onOpenSettings when Configure OpenSCAD button is clicked', async () => {
    const user = userEvent.setup()
    window.electronAPI.checkOpenscadPath = vi.fn().mockResolvedValue(false)
    
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /configure openscad path/i })).toBeInTheDocument()
    })
    
    const button = screen.getByRole('button', { name: /configure openscad path/i })
    await user.click(button)
    
    expect(mockOnOpenSettings).toHaveBeenCalled()
  })

  it('calls onOpenSettings when Configure API Key button is clicked', async () => {
    const user = userEvent.setup()
    window.electronAPI.getSettings = vi.fn().mockResolvedValue({
      openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
      llm: {
        provider: 'gemini',
        apiKey: ''
      }
    })
    
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /configure api key/i })).toBeInTheDocument()
    })
    
    const button = screen.getByRole('button', { name: /configure api key/i })
    await user.click(button)
    
    expect(mockOnOpenSettings).toHaveBeenCalled()
  })

  it('shows Get Started button when all configured', async () => {
    window.electronAPI.checkOpenscadPath = vi.fn().mockResolvedValue(true)
    window.electronAPI.getSettings = vi.fn().mockResolvedValue({
      openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
      llm: {
        provider: 'gemini',
        apiKey: 'test-key'
      }
    })
    
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
    })
  })

  it('shows Skip for Now and Open Settings buttons when not all configured', async () => {
    window.electronAPI.checkOpenscadPath = vi.fn().mockResolvedValue(false)
    
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /open settings/i })).toBeInTheDocument()
    })
  })

  it('calls onClose when Get Started is clicked', async () => {
    const user = userEvent.setup()
    window.electronAPI.checkOpenscadPath = vi.fn().mockResolvedValue(true)
    window.electronAPI.getSettings = vi.fn().mockResolvedValue({
      openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
      llm: {
        provider: 'gemini',
        apiKey: 'test-key'
      }
    })
    
    render(<WelcomeModal isOpen={true} onClose={mockOnClose} onOpenSettings={mockOnOpenSettings} />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
    })
    
    const button = screen.getByRole('button', { name: /get started/i })
    await user.click(button)
    
    expect(mockOnClose).toHaveBeenCalled()
  })
})

