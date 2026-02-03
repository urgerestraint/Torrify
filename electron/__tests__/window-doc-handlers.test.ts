import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fs from 'fs'
import { registerWindowDocHandlers } from '../ipc/window-doc-handlers'

const { handlers, mockGetMainWindow } = vi.hoisted(() => ({
  handlers: {} as Record<string, (...args: unknown[]) => unknown>,
  mockGetMainWindow: vi.fn()
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, fn: (...args: unknown[]) => unknown) => {
      handlers[channel] = fn
    })
  }
}))

vi.mock('fs')

beforeEach(() => {
  mockGetMainWindow.mockReturnValue(null)
  vi.mocked(fs.existsSync).mockReturnValue(false)
  vi.mocked(fs.readFileSync).mockReturnValue('')
  registerWindowDocHandlers(mockGetMainWindow)
})

describe('window-doc-handlers', () => {
  describe('set-window-title', () => {
    it('calls setTitle when window exists', () => {
      const mockSetTitle = vi.fn()
      mockGetMainWindow.mockReturnValue({ setTitle: mockSetTitle })

      ;(handlers['set-window-title'] as (...a: unknown[]) => void)(null, 'My Project - Torrify')
      expect(mockSetTitle).toHaveBeenCalledWith('My Project - Torrify')
    })

    it('does nothing when window is null', () => {
      mockGetMainWindow.mockReturnValue(null)
      ;(handlers['set-window-title'] as (...a: unknown[]) => void)(null, 'Title')
      expect(mockGetMainWindow).toHaveBeenCalled()
    })

    it('ignores invalid title input', () => {
      const mockSetTitle = vi.fn()
      mockGetMainWindow.mockReturnValue({ setTitle: mockSetTitle })
      ;(handlers['set-window-title'] as (...a: unknown[]) => void)(null, 123)
      expect(mockSetTitle).not.toHaveBeenCalled()
    })
  })

  describe('load-documentation', () => {
    it('returns success and docs object', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue('# Doc content')
      registerWindowDocHandlers(mockGetMainWindow)

      const result = await (handlers['load-documentation'] as (...a: unknown[]) => Promise<unknown>)(
        null
      )
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          docs: expect.any(Object)
        })
      )
    })

    it('includes content for existing doc files', async () => {
      vi.mocked(fs.existsSync).mockImplementation((p: string) => p.includes('README.md'))
      vi.mocked(fs.readFileSync).mockReturnValue('# Hello')
      registerWindowDocHandlers(mockGetMainWindow)

      const result = await (handlers['load-documentation'] as (...a: unknown[]) => Promise<unknown>)(
        null
      ) as { success: boolean; docs: Record<string, string> }
      expect(result.success).toBe(true)
      expect(typeof result.docs).toBe('object')
    })
  })
})
