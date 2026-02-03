import { describe, it, expect } from 'vitest'
import { getErrorMessage } from '../utils/error'

describe('getErrorMessage', () => {
  it('returns message for Error instance', () => {
    expect(getErrorMessage(new Error('Something failed'))).toBe('Something failed')
  })

  it('returns message for Error subclass', () => {
    const err = new TypeError('Invalid type')
    expect(getErrorMessage(err)).toBe('Invalid type')
  })

  it('returns the string for string input', () => {
    expect(getErrorMessage('Custom error string')).toBe('Custom error string')
  })

  it('returns "Unknown error" for null', () => {
    expect(getErrorMessage(null)).toBe('Unknown error')
  })

  it('returns "Unknown error" for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Unknown error')
  })

  it('returns "Unknown error" for number', () => {
    expect(getErrorMessage(42)).toBe('Unknown error')
  })

  it('returns "Unknown error" for object', () => {
    expect(getErrorMessage({ code: 'ERR' })).toBe('Unknown error')
  })
})
