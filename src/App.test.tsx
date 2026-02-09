import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders all three panels', () => {
    render(<App />)
    
    // Check for Chat Panel
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    
    // Check for Editor Panel (Code tab)
    expect(screen.getByText('Code')).toBeInTheDocument()
    
    // Check for Preview Panel
    expect(screen.getByText('Render Preview')).toBeInTheDocument()
  })

  it('displays the correct initial state', () => {
    render(<App />)
    
    // Check for initial preview message
    expect(screen.getByText('No model preview generated')).toBeInTheDocument()
    
    // Check for render button
    expect(screen.getByRole('button', { name: /render/i })).toBeInTheDocument()
  })
})
