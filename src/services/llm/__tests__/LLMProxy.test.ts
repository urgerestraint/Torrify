import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LLMProxy } from '../LLMProxy'
import type { LLMMessage } from '../types'

describe('LLMProxy', () => {
  const proxy = new LLMProxy()
  const messages: LLMMessage[] = [{ role: 'user', content: 'hello' }]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('forwards sendMessage payload and returns response', async () => {
    window.electronAPI.llmSendMessage = vi.fn().mockResolvedValue({
      success: true,
      response: {
        content: 'hi',
        model: 'test',
      },
    })

    const response = await proxy.sendMessage(messages, 'cube([1,2,3]);', 'openscad', 'context')

    expect(window.electronAPI.llmSendMessage).toHaveBeenCalledWith({
      messages,
      currentCode: 'cube([1,2,3]);',
      cadBackend: 'openscad',
      apiContext: 'context',
    })
    expect(response).toEqual({ content: 'hi', model: 'test' })
  })

  it('throws when sendMessage result is unsuccessful', async () => {
    window.electronAPI.llmSendMessage = vi.fn().mockResolvedValue({
      success: false,
      error: 'bad request',
    })

    await expect(proxy.sendMessage(messages)).rejects.toThrow('bad request')
  })

  it('throws default sendMessage error when response is missing', async () => {
    window.electronAPI.llmSendMessage = vi.fn().mockResolvedValue({
      success: true,
      response: null,
    })

    await expect(proxy.sendMessage(messages)).rejects.toThrow('LLM request failed')
  })

  it('registers stream callback and exposes abort', async () => {
    const onChunk = vi.fn()

    window.electronAPI.llmStreamMessage = vi.fn().mockResolvedValue({ streamId: 'stream-1' })
    window.electronAPI.onLlmStreamChunk = vi.fn()
    window.electronAPI.llmStreamAbort = vi.fn()

    const controller = await proxy.streamMessage(messages, onChunk, undefined, 'build123d')

    expect(window.electronAPI.llmStreamMessage).toHaveBeenCalledWith({
      messages,
      currentCode: undefined,
      cadBackend: 'build123d',
      apiContext: undefined,
    })
    expect(window.electronAPI.onLlmStreamChunk).toHaveBeenCalledWith('stream-1', onChunk)

    controller.abort()
    expect(window.electronAPI.llmStreamAbort).toHaveBeenCalledWith('stream-1')
  })

  it('throws when stream initialization fails', async () => {
    window.electronAPI.llmStreamMessage = vi.fn().mockResolvedValue({ error: 'stream failed' })

    await expect(proxy.streamMessage(messages, vi.fn())).rejects.toThrow('stream failed')
  })

  it('returns static capabilities metadata', () => {
    expect(proxy.supportsStreaming()).toBe(true)
    expect(proxy.getProviderName()).toBe('LLM')
  })
})
