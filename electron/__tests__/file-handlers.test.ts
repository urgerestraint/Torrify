import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'
import path from 'path'
import os from 'os'
import { registerFileHandlers } from '../ipc/file-handlers'
import { MAX_SCAD_FILE_SIZE } from '../constants'

const { handlers, mockDialog } = vi.hoisted(() => ({
  handlers: {} as Record<string, (...args: unknown[]) => unknown>,
  mockDialog: {
    showOpenDialog: vi.fn(),
    showSaveDialog: vi.fn()
  }
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, fn: (...args: unknown[]) => unknown) => {
      handlers[channel] = fn
    })
  },
  dialog: mockDialog,
  app: {
    getPath: vi.fn((name: string) =>
      name === 'documents' ? path.join(os.homedir(), 'Documents') : os.tmpdir()
    )
  }
}))

vi.mock('fs')
vi.mock('../settings', () => ({
  addToRecentFiles: vi.fn()
}))

beforeEach(() => {
  vi.mocked(mockDialog.showOpenDialog).mockResolvedValue({ canceled: true, filePaths: [] })
  vi.mocked(mockDialog.showSaveDialog).mockResolvedValue({ canceled: true, filePath: undefined })
  vi.mocked(fs.statSync).mockReturnValue({ size: 100 } as fs.Stats)
  vi.mocked(fs.readFileSync).mockReturnValue('cube([1,1,1]);')
  vi.mocked(fs.writeFileSync).mockImplementation(() => {})
  vi.mocked(fs.existsSync).mockReturnValue(false)
  registerFileHandlers()
})

describe('file-handlers', () => {
  describe('open-scad-file', () => {
    it('returns canceled when dialog is canceled', async () => {
      vi.mocked(mockDialog.showOpenDialog).mockResolvedValue({ canceled: true, filePaths: [] })
      const result = await (handlers['open-scad-file'] as (...a: unknown[]) => Promise<unknown>)(
        null
      )
      expect(result).toEqual({ canceled: true })
    })

    it('returns file path and code when file is selected and readable', async () => {
      const filePath = path.join(os.tmpdir(), 'model.scad')
      vi.mocked(mockDialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: [filePath]
      })
      vi.mocked(fs.statSync).mockReturnValue({ size: 100 } as fs.Stats)
      vi.mocked(fs.readFileSync).mockReturnValue('cube([10,10,10]);')

      const result = await (handlers['open-scad-file'] as (...a: unknown[]) => Promise<unknown>)(
        null
      )
      expect(result).toEqual({
        canceled: false,
        filePath,
        code: 'cube([10,10,10]);'
      })
    })

    it('returns error when file is too large', async () => {
      const filePath = path.join(os.tmpdir(), 'huge.scad')
      vi.mocked(mockDialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: [filePath]
      })
      vi.mocked(fs.statSync).mockReturnValue({
        size: MAX_SCAD_FILE_SIZE + 1
      } as fs.Stats)

      const result = await (handlers['open-scad-file'] as (...a: unknown[]) => Promise<unknown>)(
        null
      )
      expect(result).toEqual(
        expect.objectContaining({
          canceled: true,
          error: expect.stringContaining('too large')
        })
      )
    })
  })

  describe('save-scad-file', () => {
    it('returns invalid code error for bad code input', async () => {
      const result = await (handlers['save-scad-file'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        null
      )
      expect(result).toEqual({ canceled: true, error: 'Invalid code input' })
    })

    it('saves via dialog when no existing path and dialog confirms', async () => {
      const savePath = path.join(os.tmpdir(), 'model.scad')
      vi.mocked(mockDialog.showSaveDialog).mockResolvedValue({
        canceled: false,
        filePath: savePath
      })

      const result = await (handlers['save-scad-file'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'cube([1,1,1]);'
      )
      expect(result).toEqual({ canceled: false, filePath: savePath })
      expect(fs.writeFileSync).toHaveBeenCalledWith(savePath, 'cube([1,1,1]);', 'utf-8')
    })

    it('returns canceled when save dialog is canceled', async () => {
      vi.mocked(mockDialog.showSaveDialog).mockResolvedValue({ canceled: true, filePath: undefined })
      const result = await (handlers['save-scad-file'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'cube([1,1,1]);'
      )
      expect(result).toEqual({ canceled: true })
    })
  })

  describe('export-scad', () => {
    it('returns invalid code error for bad input', async () => {
      const result = await (handlers['export-scad'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        null
      )
      expect(result).toEqual({ canceled: true, error: 'Invalid code input' })
    })

    it('returns canceled when export dialog is canceled', async () => {
      vi.mocked(mockDialog.showSaveDialog).mockResolvedValue({ canceled: true, filePath: undefined })
      const result = await (handlers['export-scad'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'cube([1,1,1]);'
      )
      expect(result).toEqual({ canceled: true })
    })

    it('writes file when dialog confirms', async () => {
      const exportPath = path.join(os.tmpdir(), 'model.scad')
      vi.mocked(mockDialog.showSaveDialog).mockResolvedValue({
        canceled: false,
        filePath: exportPath
      })
      const result = await (handlers['export-scad'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'cube([1,1,1]);'
      )
      expect(result).toEqual({ canceled: false, filePath: exportPath })
      expect(fs.writeFileSync).toHaveBeenCalledWith(exportPath, 'cube([1,1,1]);', 'utf-8')
    })
  })

  describe('export-stl', () => {
    it('returns canceled when stlBase64 is null', async () => {
      const result = await (handlers['export-stl'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        null
      )
      expect(result).toEqual({ canceled: true })
    })

    it('returns canceled when dialog is canceled', async () => {
      vi.mocked(mockDialog.showSaveDialog).mockResolvedValue({ canceled: true, filePath: undefined })
      const result = await (handlers['export-stl'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'YmFzZTY0'
      )
      expect(result).toEqual({ canceled: true })
    })

    it('writes base64 buffer when dialog confirms', async () => {
      const stlPath = path.join(os.tmpdir(), 'model.stl')
      vi.mocked(mockDialog.showSaveDialog).mockResolvedValue({
        canceled: false,
        filePath: stlPath
      })
      const result = await (handlers['export-stl'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'YmFzZTY0'
      )
      expect(result).toEqual({ canceled: false, filePath: stlPath })
      expect(fs.writeFileSync).toHaveBeenCalledWith(stlPath, expect.any(Buffer))
    })
  })
})
