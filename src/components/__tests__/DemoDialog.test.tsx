import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DemoDialog from '../DemoDialog'

describe('DemoDialog', () => {
  const mockOnClose = vi.fn()
  const mockOnRunDemo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock electronAPI
    window.electronAPI.getSettings = vi.fn().mockResolvedValue({ hasSeenDemo: false })
    window.electronAPI.saveSettings = vi.fn().mockResolvedValue({ success: true })
  })

  it('does not render when isOpen is false', () => {
    render(<DemoDialog isOpen={false} onClose={mockOnClose} onRunDemo={mockOnRunDemo} />)
    expect(screen.queryByText('Welcome to Torrify!')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(<DemoDialog isOpen={true} onClose={mockOnClose} onRunDemo={mockOnRunDemo} />)
    expect(screen.getByText('Welcome to Torrify!')).toBeInTheDocument()
    expect(screen.getByText(/Would you like to see a guided walkthrough/i)).toBeInTheDocument()
  })

  it('displays demo steps', () => {
    render(<DemoDialog isOpen={true} onClose={mockOnClose} onRunDemo={mockOnRunDemo} />)
    expect(screen.getByText('AI Conversational Panel')).toBeInTheDocument()
    expect(screen.getByText('Live Source Code')).toBeInTheDocument()
    expect(screen.getByText('3D Visualization')).toBeInTheDocument()
  })

  it('has Skip Demo button', () => {
    render(<DemoDialog isOpen={true} onClose={mockOnClose} onRunDemo={mockOnRunDemo} />)
    const skipButton = screen.getByRole('button', { name: /skip demo/i })
    expect(skipButton).toBeInTheDocument()
  })

  it('has Start Guided Tour button', () => {
    render(<DemoDialog isOpen={true} onClose={mockOnClose} onRunDemo={mockOnRunDemo} />)
    const showButton = screen.getByRole('button', { name: /start guided tour/i })
    expect(showButton).toBeInTheDocument()
  })

  it('calls onClose when Skip Demo is clicked', async () => {
    const user = userEvent.setup()
    render(<DemoDialog isOpen={true} onClose={mockOnClose} onRunDemo={mockOnRunDemo} />)
    
    const skipButton = screen.getByRole('button', { name: /skip demo/i })
    await user.click(skipButton)
    
    // Wait for timeout in handleSkip
    await new Promise(resolve => setTimeout(resolve, 250))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onRunDemo when Start Guided Tour is clicked', async () => {
    const user = userEvent.setup()
    render(<DemoDialog isOpen={true} onClose={mockOnClose} onRunDemo={mockOnRunDemo} />)
    
    const showButton = screen.getByRole('button', { name: /start guided tour/i })
    await user.click(showButton)
    
    // Wait for timeout in handleRunDemo
    await new Promise(resolve => setTimeout(resolve, 250))
    expect(mockOnClose).toHaveBeenCalled()
    expect(mockOnRunDemo).toHaveBeenCalled()
  })

  it('saves settings when Skip Demo is clicked', async () => {
    const user = userEvent.setup()
    render(<DemoDialog isOpen={true} onClose={mockOnClose} onRunDemo={mockOnRunDemo} />)
    
    const skipButton = screen.getByRole('button', { name: /skip demo/i })
    await user.click(skipButton)
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 250))
    expect(window.electronAPI.getSettings).toHaveBeenCalled()
    expect(window.electronAPI.saveSettings).toHaveBeenCalled()
  })
})

