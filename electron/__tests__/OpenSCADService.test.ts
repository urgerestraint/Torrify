import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import { spawn } from 'child_process'
import { OpenSCADService } from '../cad/OpenSCADService'

vi.mock('fs')
vi.mock('child_process')

describe('OpenSCADService', () => {
  const mockExecutablePath = 'C:\\Program Files\\OpenSCAD\\openscad.exe'

  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.mkdtempSync).mockReturnValue('/tmp/torrify-openscad-test')
    vi.mocked(fs.rmSync).mockImplementation(() => undefined)
    vi.mocked(fs.writeFileSync).mockImplementation(() => {})
    vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('mock stl content'))
    vi.mocked(fs.statSync).mockReturnValue({ size: 1000 } as fs.Stats)
  })

  describe('constructor', () => {
    it('creates service with executable path', () => {
      const service = new OpenSCADService(mockExecutablePath)
      expect(service.getBackendName()).toBe('OpenSCAD')
      expect(service.getFileExtension()).toBe('scad')
      expect(service.getLanguage()).toBe('scad')
    })
  })

  describe('renderStl', () => {
    it('returns error when executable does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      const service = new OpenSCADService(mockExecutablePath)
      const result = await service.renderStl('cube([1,1,1]);')
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('returns STL base64 on successful render', async () => {
      const mockProcess = {
        on: vi.fn((event: string, cb: (code: number) => void) => {
          if (event === 'close') setTimeout(() => cb(0), 0)
          return mockProcess
        }),
        stderr: { on: vi.fn() },
        kill: vi.fn()
      }
      vi.mocked(spawn).mockReturnValue(mockProcess as ReturnType<typeof spawn>)

      const service = new OpenSCADService(mockExecutablePath)
      const result = await service.renderStl('cube([1,1,1]);')

      await new Promise((r) => setTimeout(r, 10))
      expect(result.success).toBe(true)
      expect(result.stlBase64).toBeDefined()
    })

    it('returns error on non-zero exit code', async () => {
      const mockProcess = {
        on: vi.fn((event: string, cb: (code: number, stderr?: string) => void) => {
          if (event === 'close') setTimeout(() => cb(1, 'Parse Error'), 0)
          return mockProcess
        }),
        stderr: { on: vi.fn((_e: string, fn: (d: Buffer) => void) => fn(Buffer.from('error'))) },
        kill: vi.fn()
      }
      vi.mocked(spawn).mockReturnValue(mockProcess as ReturnType<typeof spawn>)

      const service = new OpenSCADService(mockExecutablePath)
      const result = await service.renderStl('invalid code')

      await new Promise((r) => setTimeout(r, 10))
      expect(result.success).toBe(false)
      expect(result.error).toContain('1')
    })
  })

  describe('validateSetup', () => {
    it('returns invalid when executable does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      const service = new OpenSCADService(mockExecutablePath)
      const result = await service.validateSetup()
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('returns valid with version when --version succeeds', async () => {
      const mockProcess = {
        on: vi.fn((event: string, cb: (code: number) => void) => {
          if (event === 'close') setTimeout(() => cb(0), 0)
          return mockProcess
        }),
        stdout: { on: vi.fn((_e: string, fn: (d: Buffer) => void) => fn(Buffer.from('OpenSCAD 2024.01'))) },
        stderr: { on: vi.fn() },
        kill: vi.fn()
      }
      vi.mocked(spawn).mockReturnValue(mockProcess as ReturnType<typeof spawn>)

      const service = new OpenSCADService(mockExecutablePath)
      const result = await service.validateSetup()

      await new Promise((r) => setTimeout(r, 10))
      expect(result.valid).toBe(true)
      expect(result.version).toContain('OpenSCAD')
    })
  })
})
