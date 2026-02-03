import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GeneralSettings } from '../GeneralSettings'
import type { Settings } from '../types'

const defaultSettings: Settings = {
  cadBackend: 'openscad',
  openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
  build123dPythonPath: 'python',
  llm: {
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp',
    apiKey: '',
    enabled: true,
    temperature: 0.7,
    maxTokens: 2048
  }
}

describe('GeneralSettings', () => {
  it('renders CAD backend select with correct option selected', () => {
    const onBackendChange = vi.fn()
    render(
      <GeneralSettings
        settings={defaultSettings}
        pathValid={null}
        pythonPathValid={null}
        backendValidation={null}
        onPathChange={vi.fn()}
        onPythonPathChange={vi.fn()}
        onBackendChange={onBackendChange}
        onBrowsePath={vi.fn()}
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('openscad')
    expect(screen.getByText(/OpenSCAD uses its own declarative modeling language/)).toBeInTheDocument()
  })

  it('shows OpenSCAD path section when backend is openscad', () => {
    render(
      <GeneralSettings
        settings={defaultSettings}
        pathValid={null}
        pythonPathValid={null}
        backendValidation={null}
        onPathChange={vi.fn()}
        onPythonPathChange={vi.fn()}
        onBackendChange={vi.fn()}
        onBrowsePath={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText(/openscad\.exe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Browse/i })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/^python$/i)).not.toBeInTheDocument()
  })

  it('shows Python path section when backend is build123d', () => {
    const settings: Settings = { ...defaultSettings, cadBackend: 'build123d' }
    render(
      <GeneralSettings
        settings={settings}
        pathValid={null}
        pythonPathValid={null}
        backendValidation={null}
        onPathChange={vi.fn()}
        onPythonPathChange={vi.fn()}
        onBackendChange={vi.fn()}
        onBrowsePath={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText(/^python$/i)).toBeInTheDocument()
    expect(screen.getAllByText(/pip install build123d/).length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByPlaceholderText(/openscad\.exe/i)).not.toBeInTheDocument()
  })

  it('calls onBackendChange when backend select changes', async () => {
    const user = userEvent.setup()
    const onBackendChange = vi.fn()
    render(
      <GeneralSettings
        settings={defaultSettings}
        pathValid={null}
        pythonPathValid={null}
        backendValidation={null}
        onPathChange={vi.fn()}
        onPythonPathChange={vi.fn()}
        onBackendChange={onBackendChange}
        onBrowsePath={vi.fn()}
      />
    )

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'build123d')
    expect(onBackendChange).toHaveBeenCalledWith('build123d')
  })

  it('shows path valid message when pathValid is true', () => {
    render(
      <GeneralSettings
        settings={defaultSettings}
        pathValid={true}
        pythonPathValid={null}
        backendValidation={null}
        onPathChange={vi.fn()}
        onPythonPathChange={vi.fn()}
        onBackendChange={vi.fn()}
        onBrowsePath={vi.fn()}
      />
    )

    expect(screen.getByText(/OpenSCAD executable found/i)).toBeInTheDocument()
  })

  it('shows path invalid message when pathValid is false', () => {
    render(
      <GeneralSettings
        settings={defaultSettings}
        pathValid={false}
        pythonPathValid={null}
        backendValidation={null}
        onPathChange={vi.fn()}
        onPythonPathChange={vi.fn()}
        onBackendChange={vi.fn()}
        onBrowsePath={vi.fn()}
      />
    )

    expect(screen.getByText(/Executable not found at this path/i)).toBeInTheDocument()
  })

  it('calls onPathChange when OpenSCAD path input changes', async () => {
    const user = userEvent.setup()
    const onPathChange = vi.fn()
    render(
      <GeneralSettings
        settings={defaultSettings}
        pathValid={null}
        pythonPathValid={null}
        backendValidation={null}
        onPathChange={onPathChange}
        onPythonPathChange={vi.fn()}
        onBackendChange={vi.fn()}
        onBrowsePath={vi.fn()}
      />
    )

    const input = screen.getByPlaceholderText(/openscad\.exe/i)
    await user.clear(input)
    await user.type(input, 'C:\\new\\path.exe')
    expect(onPathChange).toHaveBeenCalled()
  })

  it('calls onBrowsePath when Browse button is clicked', async () => {
    const user = userEvent.setup()
    const onBrowsePath = vi.fn()
    render(
      <GeneralSettings
        settings={defaultSettings}
        pathValid={null}
        pythonPathValid={null}
        backendValidation={null}
        onPathChange={vi.fn()}
        onPythonPathChange={vi.fn()}
        onBackendChange={vi.fn()}
        onBrowsePath={onBrowsePath}
      />
    )

    await user.click(screen.getByRole('button', { name: /Browse/i }))
    expect(onBrowsePath).toHaveBeenCalledTimes(1)
  })

  it('shows backend validation message when backendValidation is provided', () => {
    render(
      <GeneralSettings
        settings={defaultSettings}
        pathValid={null}
        pythonPathValid={null}
        backendValidation={{ valid: true, version: 'OpenSCAD 2024.01' }}
        onPathChange={vi.fn()}
        onPythonPathChange={vi.fn()}
        onBackendChange={vi.fn()}
        onBrowsePath={vi.fn()}
      />
    )

    expect(screen.getByText(/OpenSCAD 2024\.01/)).toBeInTheDocument()
  })

  it('shows backend error when backendValidation.valid is false', () => {
    render(
      <GeneralSettings
        settings={defaultSettings}
        pathValid={null}
        pythonPathValid={null}
        backendValidation={{ valid: false, error: 'Backend not found' }}
        onPathChange={vi.fn()}
        onPythonPathChange={vi.fn()}
        onBackendChange={vi.fn()}
        onBrowsePath={vi.fn()}
      />
    )

    expect(screen.getByText(/Backend not found/)).toBeInTheDocument()
  })
})
