import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditorPanel from '../EditorPanel'

describe('EditorPanel', () => {
  const mockOnChange = vi.fn()
  const mockOnRender = vi.fn()
  const defaultCode = 'cube([10, 10, 10]);'

  it('renders the editor panel', () => {
    render(
      <EditorPanel 
        code={defaultCode}
        onChange={mockOnChange}
        onRender={mockOnRender}
      />
    )
    
    expect(screen.getByText('Code')).toBeInTheDocument()
    expect(screen.getByText('OpenSCAD Script')).toBeInTheDocument()
  })

  it('displays the render button', () => {
    render(
      <EditorPanel 
        code={defaultCode}
        onChange={mockOnChange}
        onRender={mockOnRender}
      />
    )
    
    const renderButton = screen.getByRole('button', { name: /render.*ctrl\+s/i })
    expect(renderButton).toBeInTheDocument()
  })

  it('calls onRender when render button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <EditorPanel 
        code={defaultCode}
        onChange={mockOnChange}
        onRender={mockOnRender}
      />
    )
    
    const renderButton = screen.getByRole('button', { name: /render/i })
    await user.click(renderButton)
    
    expect(mockOnRender).toHaveBeenCalledTimes(1)
  })

  it('triggers render on Ctrl+S keypress', () => {
    render(
      <EditorPanel 
        code={defaultCode}
        onChange={mockOnChange}
        onRender={mockOnRender}
      />
    )
    
    // Simulate Ctrl+S
    fireEvent.keyDown(window, { key: 's', ctrlKey: true })
    
    expect(mockOnRender).toHaveBeenCalled()
  })
})
