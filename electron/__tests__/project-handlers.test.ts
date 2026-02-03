import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'
import path from 'path'
import os from 'os'
import { registerProjectHandlers } from '../ipc/project-handlers'
import { MAX_PROJECT_FILE_SIZE } from '../constants'

const { handlers, mockDialog } = vi.hoisted(() => ({
  handlers: {} as Record<string, (...args: unknown[]) => unknown>,
  mockDialog: {
    showSaveDialog: vi.fn(),
    showOpenDialog: vi.fn()
  }
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, fn: (...args: unknown[]) => unknown) => {
      handlers[channel] = fn
    })
  },
  dialog: mockDialog
}))

vi.mock('fs')
vi.mock('../settings', () => ({
  addToRecentFiles: vi.fn()
}))

const validProject = {
  version: 1,
  backend: 'openscad' as const,
  code: 'cube([1,1,1]);',
  filename: 'model.scad',
  stlBase64: null as string | null,
  chat: [] as { id: number; text: string; sender: 'user' | 'bot'; timestamp: string }[]
}

beforeEach(() => {
  vi.mocked(mockDialog.showSaveDialog).mockResolvedValue({ canceled: true, filePath: undefined })
  vi.mocked(mockDialog.showOpenDialog).mockResolvedValue({ canceled: true, filePaths: [] })
  vi.mocked(fs.writeFileSync).mockImplementation(() => {})
  vi.mocked(fs.statSync).mockReturnValue({ size: 100 } as fs.Stats)
  vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(validProject))
  registerProjectHandlers()
})

describe('project-handlers', () => {
  describe('save-project', () => {
    it('returns error for invalid project structure', async () => {
      const result = await (handlers['save-project'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        { invalid: true }
      )
      expect(result).toEqual({ canceled: true, error: 'Invalid project structure' })
    })

    it('returns canceled when dialog is canceled', async () => {
      vi.mocked(mockDialog.showSaveDialog).mockResolvedValue({ canceled: true, filePath: undefined })
      const result = await (handlers['save-project'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        validProject
      )
      expect(result).toEqual({ canceled: true })
    })

    it('writes project and returns path when dialog confirms', async () => {
      const filePath = path.join(os.tmpdir(), 'project.torrify')
      vi.mocked(mockDialog.showSaveDialog).mockResolvedValue({
        canceled: false,
        filePath
      })
      const result = await (handlers['save-project'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        validProject
      )
      expect(result).toEqual({ canceled: false, filePath })
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        filePath,
        expect.stringMatching(/"version":\s*1/),
        'utf-8'
      )
    })

    it('returns error when project too large', async () => {
      const huge = { ...validProject, code: 'x'.repeat(MAX_PROJECT_FILE_SIZE), chat: [] }
      const result = await (handlers['save-project'] as (...a: unknown[]) => Promise<unknown>)(
        null,
        huge
      )
      expect(result).toEqual(
        expect.objectContaining({
          canceled: true,
          error: expect.stringContaining('too large')
        })
      )
    })
  })

  describe('load-project', () => {
    it('returns canceled when dialog is canceled', async () => {
      const result = await (handlers['load-project'] as (...a: unknown[]) => Promise<unknown>)(
        null
      )
      expect(result).toEqual({ canceled: true })
    })

    it('returns project and path when file is valid', async () => {
      const filePath = path.join(os.tmpdir(), 'project.torrify')
      vi.mocked(mockDialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: [filePath]
      })
      vi.mocked(fs.statSync).mockReturnValue({ size: 100 } as fs.Stats)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(validProject))

      const result = await (handlers['load-project'] as (...a: unknown[]) => Promise<unknown>)(
        null
      )
      expect(result).toEqual({
        canceled: false,
        project: validProject,
        filePath
      })
    })

    it('returns error for invalid project file format', async () => {
      const filePath = path.join(os.tmpdir(), 'bad.torrify')
      vi.mocked(mockDialog.showOpenDialog).mockResolvedValue({
        canceled: false,
        filePaths: [filePath]
      })
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ notAProject: true }))

      const result = await (handlers['load-project'] as (...a: unknown[]) => Promise<unknown>)(
        null
      )
      expect(result).toEqual({ canceled: true, error: 'Invalid project file format' })
    })
  })
})
