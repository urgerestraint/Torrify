import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'
import path from 'path'
import os from 'os'
import { registerRecentHandlers } from '../ipc/recent-handlers'
import type { Settings } from '../settings/types'

const { handlers, mockGetCurrentSettings, mockSetCurrentSettings, mockSaveSettings, mockAddToRecentFiles } =
  vi.hoisted(() => ({
    handlers: {} as Record<string, (...args: unknown[]) => unknown>,
    mockGetCurrentSettings: vi.fn(),
    mockSetCurrentSettings: vi.fn(),
    mockSaveSettings: vi.fn(),
    mockAddToRecentFiles: vi.fn()
  }))

function settingsWithRecent(recentFiles: { filePath: string; lastOpened: string }[]): Settings {
  return {
    cadBackend: 'openscad',
    openscadPath: 'C:\\OpenSCAD\\openscad.exe',
    build123dPythonPath: 'python',
    llm: {
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      apiKey: '',
      enabled: false,
      temperature: 0.7,
      maxTokens: 2048
    },
    recentFiles
  }
}

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, fn: (...args: unknown[]) => unknown) => {
      handlers[channel] = fn
    })
  }
}))

vi.mock('fs')
vi.mock('../settings', () => ({
  getCurrentSettings: () => mockGetCurrentSettings(),
  setCurrentSettings: (s: Settings) => mockSetCurrentSettings(s),
  saveSettings: (s: Settings) => mockSaveSettings(s),
  addToRecentFiles: (p: string) => mockAddToRecentFiles(p)
}))

beforeEach(() => {
  mockGetCurrentSettings.mockReturnValue(settingsWithRecent([]))
  vi.mocked(fs.existsSync).mockReturnValue(true)
  vi.mocked(fs.statSync).mockReturnValue({ size: 100 } as fs.Stats)
  vi.mocked(fs.readFileSync).mockReturnValue('cube([1,1,1]);')
  registerRecentHandlers()
})

describe('recent-handlers', () => {
  describe('get-recent-files', () => {
    it('returns recent files from settings', () => {
      const recent = [
        { filePath: 'C:\\a.scad', lastOpened: '2024-01-01T00:00:00.000Z' }
      ]
      mockGetCurrentSettings.mockReturnValue(settingsWithRecent(recent))
      registerRecentHandlers()

      const result = (handlers['get-recent-files'] as (...a: unknown[]) => unknown)(null)
      expect(result).toEqual(recent)
    })
  })

  describe('clear-recent-files', () => {
    it('clears list and returns success', () => {
      mockGetCurrentSettings.mockReturnValue(
        settingsWithRecent([{ filePath: 'C:\\a.scad', lastOpened: '2024-01-01T00:00:00.000Z' }])
      )
      registerRecentHandlers()

      const result = (handlers['clear-recent-files'] as (...a: unknown[]) => unknown)(null)
      expect(result).toEqual({ success: true })
      expect(mockSetCurrentSettings).toHaveBeenCalledWith(
        expect.objectContaining({ recentFiles: [] })
      )
      expect(mockSaveSettings).toHaveBeenCalled()
    })
  })

  describe('remove-recent-file', () => {
    it('returns success when path is valid', () => {
      const result = (handlers['remove-recent-file'] as (...a: unknown[]) => unknown)(
        null,
        'C:\\foo\\model.scad'
      )
      expect(result).toEqual({ success: true })
    })

    it('returns failure for invalid path input', () => {
      const result = (handlers['remove-recent-file'] as (...a: unknown[]) => unknown)(
        null,
        123
      )
      expect(result).toEqual({ success: false })
    })
  })

  describe('open-recent-file', () => {
    it('returns code when file exists and is code file', async () => {
      const filePath = path.join(os.tmpdir(), 'model.scad')
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue('sphere(5);')

      const result = await (handlers['open-recent-file'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        filePath
      )
      expect(result).toEqual({
        canceled: false,
        filePath: expect.any(String),
        code: 'sphere(5);',
        isProject: false
      })
    })

    it('returns error when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      const result = await (handlers['open-recent-file'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        path.join(os.tmpdir(), 'model.scad')
      )
      expect(result).toEqual(
        expect.objectContaining({
          canceled: true,
          error: expect.any(String)
        })
      )
    })

    it('returns error for invalid path input', async () => {
      const result = await (handlers['open-recent-file'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        123
      )
      expect(result).toEqual(
        expect.objectContaining({ canceled: true, error: expect.any(String) })
      )
    })
  })
})
