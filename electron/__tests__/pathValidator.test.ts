import { describe, it, expect } from 'vitest'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { validatePath } from '../validation/pathValidator'

describe('validatePath', () => {
  it('accepts valid .scad path', () => {
    const result = validatePath(path.join(os.tmpdir(), 'model.scad'))
    expect(result.valid).toBe(true)
    expect(result.normalized).toBeDefined()
    expect(result.normalized).toContain('model.scad')
  })

  it('accepts valid .py path', () => {
    const result = validatePath(path.join(os.tmpdir(), 'model.py'))
    expect(result.valid).toBe(true)
    expect(result.normalized).toBeDefined()
  })

  it('accepts valid .torrify path', () => {
    const result = validatePath(path.join(os.tmpdir(), 'project.torrify'))
    expect(result.valid).toBe(true)
    expect(result.normalized).toBeDefined()
  })

  it('accepts valid .json path', () => {
    const result = validatePath(path.join(os.tmpdir(), 'project.json'))
    expect(result.valid).toBe(true)
    expect(result.normalized).toBeDefined()
  })

  it('rejects path traversal in input', () => {
    // Pass a path string that literally contains .. (path.join may resolve it on some platforms)
    const result = validatePath('/some/dir/../etc/passwd.scad')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Path traversal detected')
  })

  it('rejects path with .. segment', () => {
    const result = validatePath('../etc/passwd.scad')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Path traversal detected')
  })

  it('rejects invalid file extension', () => {
    const result = validatePath(path.join(os.tmpdir(), 'model.exe'))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid file extension')
  })

  it('rejects empty string', () => {
    const result = validatePath('')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid path: empty or non-string')
  })

  it('rejects non-string input', () => {
    const result = validatePath(null as unknown as string)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Invalid path: empty or non-string')
  })

  it('rejects path that is too long', () => {
    // Build a path > 1024 chars in a cross-platform way (path.join('C:', ...) length can vary on Linux)
    const base = path.join(os.tmpdir(), 'model.scad')
    const pad = 1025 - base.length
    const longPath = pad > 0 ? path.join(os.tmpdir(), 'x'.repeat(pad), 'model.scad') : base + 'x'.repeat(1025)
    expect(longPath.length).toBeGreaterThan(1024)
    const result = validatePath(longPath)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Path too long (max 1024 characters)')
  })

  it('allows custom allowedExtensions', () => {
    const result = validatePath(path.join(os.tmpdir(), 'model.scad'), ['.scad'])
    expect(result.valid).toBe(true)
  })

  it('rejects extension not in custom allowedExtensions', () => {
    const result = validatePath(path.join(os.tmpdir(), 'model.py'), ['.scad'])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid file extension')
  })

  it('rejects symbolic links when file exists', () => {
    // Symlink creation may fail on Windows without admin/developer mode
    if (process.platform === 'win32') return
    const tmpDir = os.tmpdir()
    const realFile = path.join(tmpDir, 'real.scad')
    const linkFile = path.join(tmpDir, 'link.scad')
    try {
      fs.writeFileSync(realFile, 'cube(1);', 'utf-8')
      fs.symlinkSync(realFile, linkFile)
      const result = validatePath(linkFile)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Symbolic links not allowed')
    } finally {
      try {
        fs.unlinkSync(linkFile)
      } catch {}
      try {
        fs.unlinkSync(realFile)
      } catch {}
    }
  })
})
