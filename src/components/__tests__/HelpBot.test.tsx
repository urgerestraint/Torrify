import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import HelpBot from '../HelpBot'

describe('HelpBot', () => {
  const mockOnClose = vi.fn()
  
  const renderOpenBot = async () => {
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByText('Help Bot')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Loading documentation...')).not.toBeInTheDocument()
    })
  }

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

  it('renders when isOpen is true', async () => {
    await renderOpenBot()
    expect(screen.getByText('Help Bot')).toBeInTheDocument()
  })

  it('displays loading state initially', async () => {
    let resolveDocs:
      | ((value: { success: boolean; docs: Record<string, string> }) => void)
      | undefined
    window.electronAPI.loadDocumentation = vi.fn().mockImplementation(
      () =>
        new Promise<{ success: boolean; docs: Record<string, string> }>((resolve) => {
          resolveDocs = resolve
        })
    )
    render(<HelpBot isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByText('Loading documentation...')).toBeInTheDocument()

    if (resolveDocs) {
      resolveDocs({
        success: true,
        docs: {
          'README.md': '# Test Documentation',
        },
      })
    }
    await waitFor(() => {
      expect(screen.queryByText('Loading documentation...')).not.toBeInTheDocument()
    })
  })

  it('loads documentation on mount', async () => {
    await renderOpenBot()
    
    expect(window.electronAPI.loadDocumentation).toHaveBeenCalled()
  })

  it('displays welcome message after loading', async () => {
    await renderOpenBot()
    
    expect(screen.getByText(/I'm the Torrify Help Bot/i)).toBeInTheDocument()
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
    await renderOpenBot()
    
    expect(screen.getByPlaceholderText('Ask a question about Torrify...')).toBeInTheDocument()
  })

  it('allows user to type in input', async () => {
    await renderOpenBot()
    
    const input = screen.getByPlaceholderText('Ask a question about Torrify...')
    fireEvent.change(input, { target: { value: 'How do I get started?' } })
    
    expect(input).toHaveValue('How do I get started?')
  })

  it('has Send button', async () => {
    await renderOpenBot()
    
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('disables Send button when input is empty', async () => {
    await renderOpenBot()
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeDisabled()
  })

  it('enables Send button when input has text', async () => {
    await renderOpenBot()
    
    const input = screen.getByPlaceholderText('Ask a question about Torrify...')
    fireEvent.change(input, { target: { value: 'Test question' } })
    
    expect(input).toHaveValue('Test question')
    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).not.toBeDisabled()
  })

  it('sends message when Enter is pressed', async () => {
    await renderOpenBot()
    
    const input = screen.getByPlaceholderText('Ask a question about Torrify...')
    fireEvent.change(input, { target: { value: 'Test question' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    
    // Input should be cleared after sending
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('has close button', async () => {
    await renderOpenBot()
    
    const closeButton = screen.getByTitle('Close')
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    await renderOpenBot()
    
    const closeButton = screen.getByTitle('Close')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })
})
