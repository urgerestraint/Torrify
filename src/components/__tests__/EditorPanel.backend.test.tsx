import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import EditorPanel from '../EditorPanel'

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ language, value }: { language: string; value: string }) => (
    <div data-testid="mock-monaco-editor" data-language={language}>
      {value}
    </div>
  )
}))

describe('EditorPanel Backend Support', () => {
  const mockOnChange = vi.fn()
  const mockOnRender = vi.fn()

  it('should display OpenSCAD Script label when cadBackend is openscad', () => {
    render(
      <EditorPanel
        code="cube([10, 10, 10]);"
        onChange={mockOnChange}
        onRender={mockOnRender}
        cadBackend="openscad"
      />
    )

    expect(screen.getByText('OpenSCAD Script')).toBeInTheDocument()
  })

  it('should display Python label when cadBackend is build123d', () => {
    render(
      <EditorPanel
        code="from build123d import *"
        onChange={mockOnChange}
        onRender={mockOnRender}
        cadBackend="build123d"
      />
    )

    expect(screen.getByText('Python (build123d)')).toBeInTheDocument()
  })

  it('should use C language for OpenSCAD backend', () => {
    render(
      <EditorPanel
        code="cube([10, 10, 10]);"
        onChange={mockOnChange}
        onRender={mockOnRender}
        cadBackend="openscad"
      />
    )

    const editor = screen.getByTestId('mock-monaco-editor')
    expect(editor).toHaveAttribute('data-language', 'c')
  })

  it('should use Python language for build123d backend', () => {
    render(
      <EditorPanel
        code="from build123d import *"
        onChange={mockOnChange}
        onRender={mockOnRender}
        cadBackend="build123d"
      />
    )

    const editor = screen.getByTestId('mock-monaco-editor')
    expect(editor).toHaveAttribute('data-language', 'python')
  })

  it('should default to openscad when no cadBackend is provided', () => {
    render(
      <EditorPanel
        code="cube([10, 10, 10]);"
        onChange={mockOnChange}
        onRender={mockOnRender}
      />
    )

    expect(screen.getByText('OpenSCAD Script')).toBeInTheDocument()
  })
})
