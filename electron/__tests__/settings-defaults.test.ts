import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { getDefaultPythonPath, getDefaultSettings } from '../settings/defaults'

vi.mock('fs')

describe('getDefaultPythonPath', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns "python" when no path exists', () => {
    expect(getDefaultPythonPath()).toBe('python')
  })

  it('returns first existing path from pyenv shims', () => {
    const shimPath = path.join(os.homedir(), '.pyenv', 'pyenv-win', 'shims', 'python.exe')
    vi.mocked(fs.existsSync).mockImplementation((p: string) => p === shimPath)
    expect(getDefaultPythonPath()).toBe(shimPath)
  })

  it('returns first existing path from Python313 install', () => {
    const py313 = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python313', 'python.exe')
    vi.mocked(fs.existsSync).mockImplementation((p: string) => p === py313)
    expect(getDefaultPythonPath()).toBe(py313)
  })
})

describe('getDefaultSettings', () => {
  it('returns openscad backend and path', () => {
    const settings = getDefaultSettings()
    expect(settings.cadBackend).toBe('openscad')
    expect(settings.openscadPath).toBe('C:\\Program Files\\OpenSCAD (Nightly)\\openscad.exe')
  })

  it('returns build123dPythonPath from getDefaultPythonPath', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    const settings = getDefaultSettings()
    expect(settings.build123dPythonPath).toBe('python')
  })

  it('returns default LLM config', () => {
    const settings = getDefaultSettings()
    expect(settings.llm).toEqual({
      provider: 'gemini',
      model: 'gemini-3-flash',
      apiKey: '',
      enabled: false,
      temperature: 0.7,
      maxTokens: 128000
    })
  })

  it('returns empty recentFiles', () => {
    const settings = getDefaultSettings()
    expect(settings.recentFiles).toEqual([])
  })
})
