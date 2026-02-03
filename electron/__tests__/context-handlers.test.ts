import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'
import path from 'path'
import { registerContextHandlers } from '../ipc/context-handlers'

const { handlers } = vi.hoisted(() => ({
  handlers: {} as Record<string, (...args: unknown[]) => unknown>
}))

const mockLoadContextFile = vi.fn()
const mockValidateContextUrl = vi.fn()

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, fn: (...args: unknown[]) => unknown) => {
      handlers[channel] = fn
    })
  }
}))

vi.mock('fs')
vi.mock('../context/loader', () => ({
  CONTEXT_DIR: '/mock-context-dir',
  getBundledResourcesDir: () => '/mock-bundled-dir',
  validateContextUrl: (url: string) => mockValidateContextUrl(url),
  loadContextFile: (filename: string, _bundledDir: string) =>
    mockLoadContextFile(filename, _bundledDir)
}))

beforeEach(() => {
  mockLoadContextFile.mockReturnValue('# OpenSCAD context\ncontent')
  mockValidateContextUrl.mockReturnValue({
    ok: true,
    url: new URL('https://raw.githubusercontent.com/user/repo/main/context.txt')
  })
  vi.mocked(fs.existsSync).mockReturnValue(true)
  vi.mocked(fs.statSync).mockReturnValue({
    size: 100,
    mtime: new Date('2024-01-01')
  } as fs.Stats)
  vi.mocked(fs.mkdirSync).mockImplementation(() => undefined)
  vi.mocked(fs.writeFileSync).mockImplementation(() => undefined)
  vi.mocked(fs.unlinkSync).mockImplementation(() => undefined)
  registerContextHandlers()
})

describe('context-handlers', () => {
  describe('get-context', () => {
    it('returns content for openscad backend', async () => {
      mockLoadContextFile.mockReturnValue('# OpenSCAD\ncube();')
      vi.mocked(fs.existsSync).mockImplementation((p: string) =>
        p === path.join('/mock-context-dir', 'context_openscad.txt')
      )
      registerContextHandlers()

      const result = await (handlers['get-context'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'openscad'
      )
      expect(result).toEqual({
        success: true,
        content: '# OpenSCAD\ncube();',
        source: 'user',
        filename: 'context_openscad.txt'
      })
    })

    it('returns content for build123d backend', async () => {
      mockLoadContextFile.mockReturnValue('# build123d\nfrom build123d')
      vi.mocked(fs.existsSync).mockImplementation((p: string) =>
        p === path.join('/mock-context-dir', 'context_build123d.txt')
      )
      registerContextHandlers()

      const result = await (handlers['get-context'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'build123d'
      )
      expect(result).toEqual({
        success: true,
        content: '# build123d\nfrom build123d',
        source: 'user',
        filename: 'context_build123d.txt'
      })
    })

    it('returns error for invalid backend', async () => {
      const result = await (handlers['get-context'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'invalid'
      )
      expect(result).toEqual({ success: false, error: 'Invalid backend' })
    })

    it('returns error when context file not found', async () => {
      mockLoadContextFile.mockReturnValue(null)
      registerContextHandlers()

      const result = await (handlers['get-context'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'openscad'
      )
      expect(result).toEqual({
        success: false,
        error: 'Context file not found: context_openscad.txt'
      })
    })
  })

  describe('get-context-status', () => {
    it('returns status with openscad and build123d file info', async () => {
      const result = await (handlers['get-context-status'] as (...a: unknown[]) => Promise<unknown>)(
        null
      )
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          openscad: expect.objectContaining({
            user: expect.any(Object),
            bundled: expect.any(Object),
            active: expect.stringMatching(/user|bundled/)
          }),
          build123d: expect.objectContaining({
            user: expect.any(Object),
            bundled: expect.any(Object),
            active: expect.stringMatching(/user|bundled/)
          })
        })
      )
    })
  })

  describe('reset-context-to-factory', () => {
    it('returns success', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      registerContextHandlers()

      const result = await (handlers['reset-context-to-factory'] as (...a: unknown[]) => Promise<unknown>)(
        null
      )
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      )
    })

    it('returns error for invalid backend when provided', async () => {
      const result = await (handlers['reset-context-to-factory'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        'invalid'
      )
      expect(result).toEqual({ success: false, error: 'Invalid backend' })
    })
  })
})
