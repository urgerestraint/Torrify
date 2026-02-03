import { describe, it, expect, vi, beforeEach } from 'vitest'
import path from 'path'
import * as fs from 'fs'
import {
  CONTEXT_DIR,
  getBundledResourcesDir,
  validateContextUrl,
  loadContextFile
} from '../context/loader'

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => (name === 'userData' ? '/mock-user-data' : '/tmp'))
  }
}))

vi.mock('fs')
vi.mock('../utils/logger', () => ({
  logger: { error: vi.fn(), debug: vi.fn() }
}))

describe('getBundledResourcesDir', () => {
  it('returns path containing resources', () => {
    const dir = getBundledResourcesDir()
    expect(dir).toContain('resources')
  })

  it('returns different path when VITE_DEV_SERVER_URL is set', () => {
    const before = getBundledResourcesDir()
    const orig = process.env.VITE_DEV_SERVER_URL
    process.env.VITE_DEV_SERVER_URL = 'http://localhost:5173'
    const withDev = getBundledResourcesDir()
    process.env.VITE_DEV_SERVER_URL = orig
    expect(withDev).toContain('resources')
    expect(withDev).not.toBe(before)
  })
})

describe('validateContextUrl', () => {
  it('accepts valid https github URL', () => {
    const result = validateContextUrl('https://github.com/user/repo/raw/main/file.txt')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.url.hostname).toBe('github.com')
  })

  it('accepts raw.githubusercontent.com', () => {
    const result = validateContextUrl('https://raw.githubusercontent.com/user/repo/main/file.txt')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.url.hostname).toBe('raw.githubusercontent.com')
  })

  it('rejects invalid URL format', () => {
    const result = validateContextUrl('not-a-url')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('Invalid URL')
  })

  it('rejects http (non-HTTPS)', () => {
    const result = validateContextUrl('http://github.com/user/repo/file.txt')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('HTTPS')
  })

  it('rejects disallowed domain', () => {
    const result = validateContextUrl('https://evil.com/file.txt')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('domain not allowed')
  })
})

describe('loadContextFile', () => {
  const bundledDir = path.join('/mock-user-data', 'context', 'bundled')

  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    vi.mocked(fs.readFileSync).mockImplementation(() => '')
  })

  it('returns user file content when user path exists', () => {
    const userPath = path.join(CONTEXT_DIR, 'context_openscad.txt')
    vi.mocked(fs.existsSync).mockImplementation((p: string) => p === userPath)
    vi.mocked(fs.readFileSync).mockReturnValue('user context content')
    const content = loadContextFile('context_openscad.txt', bundledDir)
    expect(content).toBe('user context content')
  })

  it('returns bundled file content when user file missing but bundled exists', () => {
    vi.mocked(fs.existsSync).mockImplementation((p: string) =>
      p === path.join(bundledDir, 'context_openscad.txt')
    )
    vi.mocked(fs.readFileSync).mockReturnValue('bundled content')
    const content = loadContextFile('context_openscad.txt', bundledDir)
    expect(content).toBe('bundled content')
  })

  it('returns null when neither user nor bundled file exists', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    const content = loadContextFile('missing.txt', bundledDir)
    expect(content).toBe(null)
  })
})
