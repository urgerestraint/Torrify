import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OllamaService } from '../OllamaService'
import type { LLMConfig, LLMMessage } from '../types'

describe('OllamaService', () => {
  const mockConfig: LLMConfig = {
    provider: 'ollama',
    model: 'llama2',
    apiKey: '',
    enabled: true,
    temperature: 0.7,
    maxTokens: 2048
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  describe('constructor', () => {
    it('creates service with valid config', () => {
      const service = new OllamaService(mockConfig)
      expect(service.getProviderName()).toBe('Ollama (Local)')
      expect(service.supportsStreaming()).toBe(true)
    })
  })

  describe('sendMessage', () => {
    it('throws when messages array is empty', async () => {
      const service = new OllamaService(mockConfig)
      await expect(service.sendMessage([])).rejects.toThrow('Messages array cannot be empty')
    })

    it('throws when no user message', async () => {
      const service = new OllamaService(mockConfig)
      const messages: LLMMessage[] = [{ role: 'assistant', content: 'Hi' }]
      await expect(service.sendMessage(messages)).rejects.toThrow('At least one user message is required')
    })

    it('sends message and returns response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            message: { content: 'Hello from Ollama' }
          })
      } as Response)

      const service = new OllamaService(mockConfig)
      const messages: LLMMessage[] = [{ role: 'user', content: 'Hello' }]
      const result = await service.sendMessage(messages)

      expect(result.content).toBe('Hello from Ollama')
      expect(result.model).toBe('llama2')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      )
    })

    it('throws on API error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
        text: () => Promise.resolve('model not found')
      } as Response)

      const service = new OllamaService(mockConfig)
      const messages: LLMMessage[] = [{ role: 'user', content: 'Hello' }]
      await expect(service.sendMessage(messages)).rejects.toThrow('Ollama API error')
    })
  })

  describe('streamMessage', () => {
    it('returns controller with abort', async () => {
      const chunks = ['Hello', ' ', 'world']
      const stream = new ReadableStream({
        start(controller) {
          for (const c of chunks) {
            controller.enqueue(new TextEncoder().encode(JSON.stringify({ message: { content: c }, done: false }) + '\n'))
          }
          controller.enqueue(new TextEncoder().encode(JSON.stringify({ done: true }) + '\n'))
          controller.close()
        }
      })
      vi.mocked(fetch).mockResolvedValue({ ok: true, body: stream } as Response)

      const service = new OllamaService(mockConfig)
      const messages: LLMMessage[] = [{ role: 'user', content: 'Hi' }]
      const onChunk = vi.fn()
      const controller = await service.streamMessage(messages, onChunk)

      expect(controller).toBeDefined()
      expect(controller.abort).toBeDefined()
      expect(typeof controller.abort).toBe('function')
    })
  })
})
