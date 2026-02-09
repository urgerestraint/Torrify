import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'
import { registerSettingsHandlers } from '../ipc/settings-handlers'
import type { Settings } from '../settings/types'

const { handlers, mockGetCurrentSettings, mockSetCurrentSettings, mockSaveSettings, mockLoadSettings } =
  vi.hoisted(() => ({
    handlers: {} as Record<string, (...args: unknown[]) => unknown>,
    mockGetCurrentSettings: vi.fn(),
    mockSetCurrentSettings: vi.fn(),
    mockSaveSettings: vi.fn(),
    mockLoadSettings: vi.fn()
  }))

const defaultSettings: Settings = {
  cadBackend: 'openscad',
  openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
  build123dPythonPath: 'python',
  llm: {
    provider: 'gemini',
    model: 'gemini-3-flash',
    apiKey: '',
    enabled: false,
    temperature: 0.7,
    maxTokens: 2048
  },
  recentFiles: []
}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, fn: (...args: unknown[]) => unknown) => {
      handlers[channel] = fn
    })
  },
  dialog: {
    showOpenDialog: vi.fn().mockResolvedValue({ canceled: true, filePaths: [] })
  },
  app: {
    getPath: vi.fn((name: string) => (name === 'home' ? '/home/user' : '/tmp'))
  }
}))

vi.mock('fs')
vi.mock('../settings', () => ({
  getCurrentSettings: () => mockGetCurrentSettings(),
  setCurrentSettings: (s: Settings) => mockSetCurrentSettings(s),
  saveSettings: (s: Settings) => mockSaveSettings(s),
  loadSettings: () => mockLoadSettings()
}))
vi.mock('../cad', () => ({
  createCADService: vi.fn().mockReturnValue({
    validateSetup: vi.fn().mockResolvedValue({ valid: true, version: 'OpenSCAD 2024' })
  })
}))
vi.mock('../utils/logger', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }))

beforeEach(() => {
  mockGetCurrentSettings.mockReturnValue(defaultSettings)
  mockLoadSettings.mockReturnValue(defaultSettings)
  vi.mocked(fs.existsSync).mockReturnValue(true)
  vi.mocked(fs.unlinkSync).mockImplementation(() => {})
  registerSettingsHandlers()
})

describe('settings-handlers', () => {
  describe('get-settings', () => {
    it('returns current settings', () => {
      const result = (handlers['get-settings'] as (...a: unknown[]) => unknown)(null)
      expect(result).toEqual(defaultSettings)
      expect(mockGetCurrentSettings).toHaveBeenCalled()
    })
  })

  describe('save-settings', () => {
    it('returns success when settings are valid', () => {
      const result = (handlers['save-settings'] as (...a: unknown[]) => unknown)(
        null,
        defaultSettings
      )
      expect(result).toEqual({ success: true })
      expect(mockSetCurrentSettings).toHaveBeenCalledWith(defaultSettings)
      expect(mockSaveSettings).toHaveBeenCalledWith(defaultSettings)
    })

    it('returns error for invalid settings format', () => {
      const result = (handlers['save-settings'] as (...a: unknown[]) => unknown)(null, { bad: true })
      expect(result).toEqual({ success: false, error: 'Invalid settings format' })
    })
  })

  describe('check-openscad-path', () => {
    it('returns true when path exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      registerSettingsHandlers()
      const result = (handlers['check-openscad-path'] as (...a: unknown[]) => unknown)(
        null,
        'C:\\OpenSCAD\\openscad.exe'
      )
      expect(result).toBe(true)
    })

    it('returns false when path does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      registerSettingsHandlers()
      const result = (handlers['check-openscad-path'] as (...a: unknown[]) => unknown)(
        null,
        'C:\\Missing\\openscad.exe'
      )
      expect(result).toBe(false)
    })

    it('returns false for invalid path input', () => {
      const result = (handlers['check-openscad-path'] as (...a: unknown[]) => unknown)(
        null,
        123
      )
      expect(result).toBe(false)
    })
  })

  describe('reset-settings', () => {
    it('removes settings file and reloads', () => {
      mockLoadSettings.mockReturnValue(defaultSettings)
      const result = (handlers['reset-settings'] as (...a: unknown[]) => unknown)(null)
      expect(result).toEqual({ success: true })
      expect(mockLoadSettings).toHaveBeenCalled()
    })
  })

  describe('should-show-welcome', () => {
    it('returns boolean', () => {
      mockGetCurrentSettings.mockReturnValue(defaultSettings)
      vi.mocked(fs.existsSync).mockReturnValue(false)
      registerSettingsHandlers()
      const result = (handlers['should-show-welcome'] as (...a: unknown[]) => unknown)(null)
      expect(typeof result).toBe('boolean')
    })
  })
})
