import { describe, it, expect } from 'vitest'
import { validateProject } from '../validation/projectValidation'

describe('validateProject', () => {
  const validProject = {
    version: 1,
    code: 'cube([10, 10, 10]);',
    stlBase64: null,
    chat: [
      { id: 1, text: 'Hello', sender: 'user', timestamp: '2024-01-01T00:00:00.000Z' },
      { id: 2, text: 'Hi there', sender: 'bot', timestamp: '2024-01-01T00:00:01.000Z' }
    ]
  }

  it('accepts valid project with all required fields', () => {
    expect(validateProject(validProject)).toBe(true)
  })

  it('accepts valid project with stlBase64 string', () => {
    expect(validateProject({ ...validProject, stlBase64: 'base64data' })).toBe(true)
  })

  it('accepts valid project with empty chat', () => {
    expect(validateProject({ ...validProject, chat: [] })).toBe(true)
  })

  it('rejects null', () => {
    expect(validateProject(null)).toBe(false)
  })

  it('rejects non-object', () => {
    expect(validateProject(42)).toBe(false)
    expect(validateProject('string')).toBe(false)
  })

  it('rejects project with version < 1', () => {
    expect(validateProject({ ...validProject, version: 0 })).toBe(false)
  })

  it('rejects project with missing version', () => {
    const { version, ...rest } = validProject as Record<string, unknown>
    expect(validateProject(rest)).toBe(false)
  })

  it('rejects project with non-string code', () => {
    expect(validateProject({ ...validProject, code: 123 })).toBe(false)
  })

  it('rejects project with non-array chat', () => {
    expect(validateProject({ ...validProject, chat: {} })).toBe(false)
  })

  it('rejects project with invalid chat message (missing id)', () => {
    const invalidChat = [
      { text: 'Hello', sender: 'user', timestamp: '2024-01-01T00:00:00.000Z' }
    ]
    expect(validateProject({ ...validProject, chat: invalidChat })).toBe(false)
  })

  it('rejects project with invalid chat message (invalid sender)', () => {
    const invalidChat = [
      { id: 1, text: 'Hello', sender: 'system', timestamp: '2024-01-01T00:00:00.000Z' }
    ]
    expect(validateProject({ ...validProject, chat: invalidChat })).toBe(false)
  })
})
