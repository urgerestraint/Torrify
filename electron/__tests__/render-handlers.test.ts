import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'
import { registerRenderHandlers } from '../ipc/render-handlers'
import { TEMP_DIR } from '../constants'

const { handlers, mockCreateCADService } = vi.hoisted(() => ({
  handlers: {} as Record<string, (...args: unknown[]) => unknown>,
  mockCreateCADService: vi.fn()
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, fn: (...args: unknown[]) => unknown) => {
      handlers[channel] = fn
    })
  }
}))

vi.mock('fs')
vi.mock('../cad', () => ({
  createCADService: (...args: unknown[]) => mockCreateCADService(...args)
}))
vi.mock('../settings', () => ({
  getCurrentSettings: vi.fn(() => ({
    cadBackend: 'openscad',
    openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
    build123dPythonPath: 'python'
  }))
}))
vi.mock('../utils/logger', () => ({ logger: { error: vi.fn(), debug: vi.fn() } }))

beforeEach(() => {
  vi.mocked(fs.existsSync).mockReturnValue(true)
  vi.mocked(fs.mkdtempSync).mockReturnValue('/tmp/torrify-render-test')
  vi.mocked(fs.rmSync).mockImplementation(() => undefined)
  vi.mocked(fs.writeFileSync).mockImplementation(() => {})
  vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('mock-png'))
  vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as fs.Stats)
  mockCreateCADService.mockReturnValue({
    renderStl: vi.fn().mockResolvedValue({
      success: true,
      stlBase64: 'c3RsZGF0YQ==',
      timestamp: Date.now()
    })
  })
  registerRenderHandlers()
})

describe('render-handlers', () => {
  describe('get-temp-dir', () => {
    it('returns TEMP_DIR', () => {
      const result = (handlers['get-temp-dir'] as (...a: unknown[]) => unknown)(null)
      expect(result).toBe(TEMP_DIR)
    })
  })

  describe('render-stl', () => {
    it('returns STL result from CAD service', async () => {
      const result = await (handlers['render-stl'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'cube([1,1,1]);'
      )
      expect(result).toEqual({
        success: true,
        stlBase64: 'c3RsZGF0YQ==',
        timestamp: expect.any(Number)
      })
    })

    it('throws on invalid code input', async () => {
      await expect(
        (handlers['render-stl'] as (...a: unknown[]) => Promise<unknown>)(
          null,
          'x'.repeat(2 * 1024 * 1024)
        )
      ).rejects.toThrow(/Invalid input/)
    })

    it('throws when CAD service returns error', async () => {
      mockCreateCADService.mockReturnValue({
        renderStl: vi.fn().mockResolvedValue({
          success: false,
          error: 'OpenSCAD not found'
        })
      })
      registerRenderHandlers()

      await expect(
        (handlers['render-stl'] as (...a: unknown[]) => Promise<unknown>)(
          null,
          'cube([1,1,1]);'
        )
      ).rejects.toThrow(/STL export error/)
    })
  })
})
