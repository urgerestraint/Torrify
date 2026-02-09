import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HelpBot from '../HelpBot'

describe('HelpBot', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.electronAPI.loadDocumentation = vi.fn().mockResolvedValue({
      success: true,
      docs: {
        'README.md': '# Test Documentation',
        'QUICKSTART.md': '# Quick Start Guide'
      }
    })
    window.electronAPI.getSettings = vi.fn().mockResolvedValue({
      llm: {
        enabled: true,
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'test-model',
        temperature: 0.7,
        maxTokens: 2048
      }
    })
  })

  it('does not render when isOpen is false', () => {
    render(<HelpBot isOpen={false} onClose={mockOnClose} />)
    expect(screen.queryByText('Help Bot')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByText('Help Bot')).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByText('Loading documentation...')).toBeInTheDocument()
  })

  it('loads documentation on mount', async () => {
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      expect(window.electronAPI.loadDocumentation).toHaveBeenCalled()
    })
  })

  it('displays welcome message after loading', async () => {
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      expect(screen.getByText(/I'm the Torrify Help Bot/i)).toBeInTheDocument()
    })
  })

  it('displays error message when documentation fails to load', async () => {
    window.electronAPI.loadDocumentation = vi.fn().mockResolvedValue({
      success: false
    })
    
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load documentation/i)).toBeInTheDocument()
    })
  })

  it('has input field', async () => {
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask a question about Torrify...')).toBeInTheDocument()
    })
  })

  it('allows user to type in input', async () => {
    const user = userEvent.setup()
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask a question about Torrify...')).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText('Ask a question about Torrify...')
    await user.type(input, 'How do I get started?')
    
    await waitFor(() => {
      expect(input).toHaveValue('How do I get started?')
    })
  })

  it('has Send button', async () => {
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })
  })

  it('disables Send button when input is empty', async () => {
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()
    })
  })

  it('enables Send button when input has text', async () => {
    const user = userEvent.setup()
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask a question about Torrify...')).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText('Ask a question about Torrify...')
    await user.type(input, 'Test question')
    
    await waitFor(() => {
      expect(input).toHaveValue('Test question')
    })
    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).not.toBeDisabled()
  })

  it('sends message when Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ask a question about Torrify...')).toBeInTheDocument()
    })
    
    const input = screen.getByPlaceholderText('Ask a question about Torrify...')
    await user.type(input, 'Test question{Enter}')
    
    // Input should be cleared after sending
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('has close button', async () => {
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      const closeButton = screen.getByTitle('Close')
      expect(closeButton).toBeInTheDocument()
    })
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    
    await waitFor(() => {
      expect(screen.getByTitle('Close')).toBeInTheDocument()
    })
    
    const closeButton = screen.getByTitle('Close')
    await user.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })
})

