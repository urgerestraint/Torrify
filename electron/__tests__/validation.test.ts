import { describe, it, expect } from 'vitest'
import {
  CodeSchema,
  SettingsSchema,
  FilePathSchema,
  GatewayRequestSchema,
  CADBackendSchema,
  WindowTitleSchema,
  MAX_CODE_SIZE,
  MAX_PATH_LENGTH
} from '../validation/schemas'

describe('CodeSchema', () => {
  it('accepts valid code strings', () => {
    expect(CodeSchema.safeParse('cube([10, 10, 10]);').success).toBe(true)
    expect(CodeSchema.safeParse('').success).toBe(true)
  })

  it('rejects non-string input', () => {
    expect(CodeSchema.safeParse(null).success).toBe(false)
    expect(CodeSchema.safeParse(123).success).toBe(false)
    expect(CodeSchema.safeParse({}).success).toBe(false)
    expect(CodeSchema.safeParse(undefined).success).toBe(false)
  })

  it('rejects oversized strings', () => {
    const oversized = 'x'.repeat(MAX_CODE_SIZE + 1)
    expect(CodeSchema.safeParse(oversized).success).toBe(false)
  })

  it('accepts string at exactly max size', () => {
    const atMax = 'x'.repeat(MAX_CODE_SIZE)
    expect(CodeSchema.safeParse(atMax).success).toBe(true)
  })
})

describe('CADBackendSchema', () => {
  it('accepts valid backends', () => {
    expect(CADBackendSchema.safeParse('openscad').success).toBe(true)
    expect(CADBackendSchema.safeParse('build123d').success).toBe(true)
  })

  it('rejects invalid backends', () => {
    expect(CADBackendSchema.safeParse('invalid').success).toBe(false)
    expect(CADBackendSchema.safeParse('').success).toBe(false)
    expect(CADBackendSchema.safeParse(null).success).toBe(false)
  })
})

describe('SettingsSchema', () => {
  const validSettings = {
    cadBackend: 'openscad' as const,
    openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe',
    build123dPythonPath: 'python',
    llm: {
      provider: 'gemini' as const,
      model: 'gemini-3-flash',
      apiKey: '',
      enabled: false,
      temperature: 0.7,
      maxTokens: 2048
    },
    recentFiles: []
  }

  it('validates complete settings object', () => {
    expect(SettingsSchema.safeParse(validSettings).success).toBe(true)
  })

  it('rejects invalid cadBackend', () => {
    expect(
      SettingsSchema.safeParse({ ...validSettings, cadBackend: 'invalid' }).success
    ).toBe(false)
  })

  it('rejects invalid llm provider', () => {
    expect(
      SettingsSchema.safeParse({
        ...validSettings,
        llm: { ...validSettings.llm, provider: 'invalid' }
      }).success
    ).toBe(false)
  })

  it('rejects oversized paths in settings', () => {
    const longPath = 'x'.repeat(513)
    expect(
      SettingsSchema.safeParse({
        ...validSettings,
        openscadPath: longPath
      }).success
    ).toBe(false)
  })

  it('accepts optional recentFiles and hasSeenDemo', () => {
    expect(
      SettingsSchema.safeParse({
        ...validSettings,
        hasSeenDemo: true
      }).success
    ).toBe(true)
    expect(
      SettingsSchema.safeParse({
        ...validSettings,
        recentFiles: [
          { filePath: '/path/to/file.scad', lastOpened: new Date().toISOString() }
        ]
      }).success
    ).toBe(true)
  })
})

describe('FilePathSchema', () => {
  it('accepts valid paths', () => {
    expect(FilePathSchema.safeParse('C:\\Users\\foo\\model.scad').success).toBe(true)
    expect(FilePathSchema.safeParse('/home/user/model.scad').success).toBe(true)
  })

  it('rejects oversized paths', () => {
    const longPath = 'x'.repeat(MAX_PATH_LENGTH + 1)
    expect(FilePathSchema.safeParse(longPath).success).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(FilePathSchema.safeParse(null).success).toBe(false)
    expect(FilePathSchema.safeParse(123).success).toBe(false)
  })
})

describe('GatewayRequestSchema', () => {
  it('accepts valid request with licenseKey and body', () => {
    expect(
      GatewayRequestSchema.safeParse({
        licenseKey: 'test-key',
        body: { message: 'hello' }
      }).success
    ).toBe(true)
  })

  it('accepts request with only licenseKey', () => {
    expect(
      GatewayRequestSchema.safeParse({ licenseKey: 'key' }).success
    ).toBe(true)
  })

  it('accepts empty object', () => {
    expect(GatewayRequestSchema.safeParse({}).success).toBe(true)
  })

  it('rejects oversized licenseKey', () => {
    expect(
      GatewayRequestSchema.safeParse({
        licenseKey: 'x'.repeat(501)
      }).success
    ).toBe(false)
  })
})

describe('WindowTitleSchema', () => {
  it('accepts valid titles', () => {
    expect(WindowTitleSchema.safeParse('Torrify - model.scad').success).toBe(true)
    expect(WindowTitleSchema.safeParse('').success).toBe(true)
  })

  it('rejects oversized titles', () => {
    expect(WindowTitleSchema.safeParse('x'.repeat(257)).success).toBe(false)
  })
})
