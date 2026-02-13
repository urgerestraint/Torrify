import { describe, it, expect } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import App from './App'

describe('App', () => {
  const renderApp = async () => {
    render(<App />)
    await waitFor(() => {
      expect(window.electronAPI.getSettings).toHaveBeenCalled()
    })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  }

  it('renders all three panels', async () => {
    await renderApp()
    
    // Check for Chat Panel
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    
    // Check for Editor Panel (Code tab)
    expect(screen.getByText('Code')).toBeInTheDocument()
    
    // Check for Preview Panel
    expect(screen.getByText('Render Preview')).toBeInTheDocument()
  })

  it('displays the correct initial state', async () => {
    await renderApp()
    
    // Check for initial preview message
    expect(screen.getByText('No model preview generated')).toBeInTheDocument()
    
    // Check for render button
    expect(screen.getByRole('button', { name: /render/i })).toBeInTheDocument()
  })
})
