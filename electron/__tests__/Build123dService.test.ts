import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import { spawn } from 'child_process'
import { Build123dService } from '../cad/Build123dService'

vi.mock('fs')
vi.mock('child_process')

describe('Build123dService', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('mock stl content'))
    vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as fs.Stats)
  })

  describe('constructor', () => {
    it('creates service with default python path', () => {
      const service = new Build123dService()
      expect(service.getBackendName()).toBe('build123d')
      expect(service.getFileExtension()).toBe('py')
      expect(service.getLanguage()).toBe('python')
    })

    it('creates service with custom python path', () => {
      const service = new Build123dService('C:\\Python312\\python.exe')
      expect(service.getBackendName()).toBe('build123d')
    })
  })

  describe('renderStl', () => {
    it('writes wrapper script and returns STL on success', async () => {
      const mockProcess = {
        on: vi.fn((event: string, cb: (code: number) => void) => {
          if (event === 'close') setTimeout(() => cb(0), 0)
          return mockProcess
        }),
        stderr: { on: vi.fn() },
        kill: vi.fn()
      }
      vi.mocked(spawn).mockReturnValue(mockProcess as ReturnType<typeof spawn>)

      const service = new Build123dService('python')
      const result = await service.renderStl('from build123d import Box\nresult = Box(10, 10, 10)')

      await new Promise((r) => setTimeout(r, 10))
      expect(fs.writeFileSync).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.stlBase64).toBeDefined()
    })

    it('returns error on non-zero exit', async () => {
      const mockProcess = {
        on: vi.fn((event: string, cb: (code: number) => void) => {
          if (event === 'close') setTimeout(() => cb(1), 0)
          return mockProcess
        }),
        stderr: { on: vi.fn((_e: string, fn: (d: Buffer) => void) => fn(Buffer.from('BUILD123D_NOT_INSTALLED'))) },
        kill: vi.fn()
      }
      vi.mocked(spawn).mockReturnValue(mockProcess as ReturnType<typeof spawn>)

      const service = new Build123dService('python')
      const result = await service.renderStl('invalid')

      await new Promise((r) => setTimeout(r, 10))
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('validateSetup', () => {
    it('returns invalid when Python fails', async () => {
      const mockProcess = {
        on: vi.fn((event: string, cb: (code: number) => void) => {
          if (event === 'close') setTimeout(() => cb(1), 0)
          return mockProcess
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        kill: vi.fn()
      }
      vi.mocked(spawn).mockReturnValue(mockProcess as ReturnType<typeof spawn>)

      const service = new Build123dService('python')
      const result = await service.validateSetup()

      await new Promise((r) => setTimeout(r, 10))
      expect(result.valid).toBe(false)
    })

    it('returns valid with version when Python and build123d are available', async () => {
      const mockProcess = {
        on: vi.fn((event: string, cb: (code: number) => void) => {
          if (event === 'close') setTimeout(() => cb(0), 0)
          return mockProcess
        }),
        stdout: { on: vi.fn((_e: string, fn: (d: Buffer) => void) => fn(Buffer.from('Python 3.12.0\nbuild123d 0.6.0'))) },
        stderr: { on: vi.fn() },
        kill: vi.fn()
      }
      vi.mocked(spawn).mockReturnValue(mockProcess as ReturnType<typeof spawn>)

      const service = new Build123dService('python')
      const result = await service.validateSetup()

      await new Promise((r) => setTimeout(r, 10))
      expect(result.valid).toBe(true)
      expect(result.version).toBeDefined()
    })
  })
})
