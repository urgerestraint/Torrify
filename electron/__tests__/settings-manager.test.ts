import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'
import {
  getCurrentSettings,
  setCurrentSettings,
  loadSettings,
  saveSettings,
  addToRecentFiles
} from '../settings/manager'
import { SETTINGS_FILE, SETTINGS_DIR, LEGACY_SETTINGS_FILE, MAX_RECENT_FILES } from '../constants'
import type { Settings } from '../settings/types'

vi.mock('fs')
vi.mock('../utils/logger', () => ({
  logger: { error: vi.fn(), debug: vi.fn() }
}))

function minimalSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    cadBackend: 'openscad',
    openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
    build123dPythonPath: 'python',
    llm: {
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      apiKey: '',
      enabled: false,
      temperature: 0.7,
      maxTokens: 2048
    },
    recentFiles: [],
    ...overrides
  }
}

describe('settings manager', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(fs.readFileSync).mockImplementation(() => '{}')
    vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined)
    vi.mocked(fs.chmodSync).mockImplementation(() => {})
    setCurrentSettings(minimalSettings())
  })

  describe('getCurrentSettings / setCurrentSettings', () => {
    it('returns current in-memory settings', () => {
      const s = minimalSettings({ cadBackend: 'build123d' })
      setCurrentSettings(s)
      expect(getCurrentSettings()).toEqual(s)
    })
  })

  describe('loadSettings', () => {
    it('loads from SETTINGS_FILE when it exists', () => {
      const stored = minimalSettings({ openscadPath: 'C:\\Custom\\openscad.exe' })
      vi.mocked(fs.existsSync).mockImplementation((p: string) => p === SETTINGS_FILE)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(stored))

      const loaded = loadSettings()
      expect(loaded.openscadPath).toBe('C:\\Custom\\openscad.exe')
      expect(getCurrentSettings()).toEqual(loaded)
    })

    it('migrates from LEGACY_SETTINGS_FILE when current file missing', () => {
      const stored = minimalSettings({ cadBackend: 'build123d' })
      vi.mocked(fs.existsSync).mockImplementation(
        (p: string) => p === LEGACY_SETTINGS_FILE
      )
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(stored))

      const loaded = loadSettings()
      expect(loaded.cadBackend).toBe('build123d')
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        SETTINGS_FILE,
        expect.any(String),
        'utf-8'
      )
    })

    it('returns defaults when no file exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      const loaded = loadSettings()
      expect(loaded.cadBackend).toBe('openscad')
      expect(loaded.recentFiles).toEqual([])
    })

    it('normalizes missing recentFiles to empty array', () => {
      vi.mocked(fs.existsSync).mockImplementation((p: string) => p === SETTINGS_FILE)
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({ ...minimalSettings(), recentFiles: undefined })
      )
      const loaded = loadSettings()
      expect(Array.isArray(loaded.recentFiles)).toBe(true)
      expect(loaded.recentFiles).toEqual([])
    })
  })

  describe('saveSettings', () => {
    it('creates SETTINGS_DIR when missing and writes file', () => {
      vi.mocked(fs.existsSync).mockImplementation((p: string) => p !== SETTINGS_DIR)
      const s = minimalSettings()
      saveSettings(s)
      expect(fs.mkdirSync).toHaveBeenCalledWith(SETTINGS_DIR, { recursive: true })
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        SETTINGS_FILE,
        JSON.stringify(s, null, 2),
        'utf-8'
      )
    })

    it('writes file when dir already exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      const s = minimalSettings()
      saveSettings(s)
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        SETTINGS_FILE,
        expect.stringContaining('"cadBackend": "openscad"'),
        'utf-8'
      )
    })
  })

  describe('addToRecentFiles', () => {
    it('prepends file to recent list and persists', () => {
      setCurrentSettings(minimalSettings())
      addToRecentFiles('C:\\foo\\model.scad')
      const current = getCurrentSettings()
      expect(current.recentFiles).toHaveLength(1)
      expect(current.recentFiles[0].filePath).toBe('C:\\foo\\model.scad')
      expect(fs.writeFileSync).toHaveBeenCalled()
    })

    it('dedupes by filePath and moves existing to front', () => {
      setCurrentSettings(
        minimalSettings({
          recentFiles: [
            { filePath: 'C:\\b.scad', lastOpened: '2020-01-01T00:00:00.000Z' },
            { filePath: 'C:\\a.scad', lastOpened: '2020-01-02T00:00:00.000Z' }
          ]
        })
      )
      addToRecentFiles('C:\\a.scad')
      const current = getCurrentSettings()
      expect(current.recentFiles).toHaveLength(2)
      expect(current.recentFiles[0].filePath).toBe('C:\\a.scad')
      expect(current.recentFiles[1].filePath).toBe('C:\\b.scad')
    })

    it('trims to MAX_RECENT_FILES', () => {
      const many = Array.from({ length: MAX_RECENT_FILES + 2 }, (_, i) => ({
        filePath: `C:\\file${i}.scad`,
        lastOpened: new Date().toISOString()
      }))
      setCurrentSettings(minimalSettings({ recentFiles: many }))
      addToRecentFiles('C:\\new.scad')
      const current = getCurrentSettings()
      expect(current.recentFiles.length).toBeLessThanOrEqual(MAX_RECENT_FILES)
      expect(current.recentFiles[0].filePath).toBe('C:\\new.scad')
    })
  })
})
