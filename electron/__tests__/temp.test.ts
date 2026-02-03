import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'path'
import * as fs from 'fs'
import { TEMP_DIR, TEMP_FILE_MAX_AGE_MS } from '../constants'
import {
  ensureTempDir,
  cleanupTempFiles,
  cleanupAllTempFiles,
  TEMP_DIR as exportedTEMP_DIR
} from '../utils/temp'

vi.mock('fs')
vi.mock('../utils/logger', () => ({
  logger: { error: vi.fn(), debug: vi.fn() }
}))

describe('temp utils', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined)
    vi.mocked(fs.readdirSync).mockReturnValue([])
    vi.mocked(fs.statSync).mockImplementation(() => ({ mtimeMs: Date.now() } as fs.Stats))
    vi.mocked(fs.unlinkSync).mockImplementation(() => undefined)
    vi.mocked(fs.existsSync).mockClear()
    vi.mocked(fs.mkdirSync).mockClear()
    vi.mocked(fs.readdirSync).mockClear()
    vi.mocked(fs.statSync).mockClear()
    vi.mocked(fs.unlinkSync).mockClear()
  })

  describe('TEMP_DIR export', () => {
    it('re-exports TEMP_DIR from constants', () => {
      expect(exportedTEMP_DIR).toBe(TEMP_DIR)
    })
  })

  describe('ensureTempDir', () => {
    it('creates dir when it does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      ensureTempDir()
      expect(fs.mkdirSync).toHaveBeenCalledWith(TEMP_DIR, { recursive: true })
    })

    it('does not create dir when it exists', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      ensureTempDir()
      expect(fs.mkdirSync).not.toHaveBeenCalled()
    })
  })

  describe('cleanupTempFiles', () => {
    it('returns early when temp dir does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      cleanupTempFiles()
      expect(fs.readdirSync).not.toHaveBeenCalled()
    })

    it('removes files older than maxAgeMs', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue(['old.png', 'new.png'])
      const now = Date.now()
      vi.mocked(fs.statSync).mockImplementation((p: string) => {
        const name = path.basename(p)
        const mtimeMs = name === 'old.png' ? now - (TEMP_FILE_MAX_AGE_MS + 1000) : now - 1000
        return { mtimeMs } as fs.Stats
      })
      cleanupTempFiles(TEMP_FILE_MAX_AGE_MS)
      expect(fs.unlinkSync).toHaveBeenCalledTimes(1)
      expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(TEMP_DIR, 'old.png'))
    })

    it('keeps files newer than maxAgeMs', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue(['recent.png'])
      vi.mocked(fs.statSync).mockReturnValue({
        mtimeMs: Date.now() - 1000
      } as fs.Stats)
      cleanupTempFiles(60 * 60 * 1000)
      expect(fs.unlinkSync).not.toHaveBeenCalled()
    })
  })

  describe('cleanupAllTempFiles', () => {
    it('returns early when temp dir does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)
      cleanupAllTempFiles()
      expect(fs.readdirSync).not.toHaveBeenCalled()
    })

    it('removes all files in temp dir', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readdirSync).mockReturnValue(['a.png', 'b.png'])
      cleanupAllTempFiles()
      expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(TEMP_DIR, 'a.png'))
      expect(fs.unlinkSync).toHaveBeenCalledWith(path.join(TEMP_DIR, 'b.png'))
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2)
    })
  })
})
