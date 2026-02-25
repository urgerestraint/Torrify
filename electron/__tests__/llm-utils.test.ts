import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWithTimeout } from '../llm/utils'

describe('fetchWithTimeout', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns response when fetch succeeds', async () => {
    const response = { ok: true } as Response
    fetchMock.mockResolvedValue(response)

    const result = await fetchWithTimeout('https://example.com', { method: 'GET' }, 5000)
    expect(result).toBe(response)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ method: 'GET', signal: expect.any(AbortSignal) })
    )
  })

  it('throws a timeout error when request exceeds timeout', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(
      (_url: string | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          const signal = init?.signal
          if (!signal) {
            return
          }
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
        })
    )

    const pending = fetchWithTimeout('https://example.com', { method: 'GET' }, 100)
    const assertion = expect(pending).rejects.toThrow('Request timed out after 1 seconds')
    await vi.advanceTimersByTimeAsync(200)
    await assertion
  })

  it('preserves abort behavior from caller-provided signal', async () => {
    fetchMock.mockImplementation(
      (_url: string | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          const signal = init?.signal
          if (!signal) {
            return
          }
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
        })
    )

    const controller = new AbortController()
    const pending = fetchWithTimeout('https://example.com', { method: 'GET', signal: controller.signal }, 5000)
    controller.abort()

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })
})
