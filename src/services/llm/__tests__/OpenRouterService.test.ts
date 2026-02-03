import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenRouterService } from '../OpenRouterService'
import type { LLMConfig, LLMMessage } from '../types'

// Mock window.electronAPI
global.window.electronAPI = {
  getOpenRouterKey: vi.fn().mockResolvedValue('test-openrouter-key')
} as any

// Mock fetch
global.fetch = vi.fn()

describe('OpenRouterService', () => {
  const mockConfig: LLMConfig = {
    provider: 'openrouter',
    apiKey: '', // OpenRouter uses env-based key, not config apiKey
    model: 'anthropic/claude-3.7-sonnet:thinking',
    enabled: true,
    temperature: 0.7,
    maxTokens: 2048
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Mocked OpenRouter response'
          }
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      })
    })
  })

  describe('constructor', () => {
    it('creates service with valid config', () => {
      const service = new OpenRouterService(mockConfig)
      expect(service).toBeDefined()
      expect(service.getProviderName()).toBe('OpenRouter')
    })
  })

  describe('sendMessage', () => {
    it('throws error when messages array is empty', async () => {
      const service = new OpenRouterService(mockConfig)
      const messages: LLMMessage[] = []
      
      await expect(service.sendMessage(messages)).rejects.toThrow('Messages array cannot be empty')
    })

    it('throws error when no user message is present', async () => {
      const service = new OpenRouterService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'assistant', content: 'Hello' }
      ]
      
      await expect(service.sendMessage(messages)).rejects.toThrow('At least one user message is required')
    })

    it('throws error when OpenRouter key is not set', async () => {
      window.electronAPI.getOpenRouterKey = vi.fn().mockResolvedValue(null)
      const service = new OpenRouterService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ]
      
      await expect(service.sendMessage(messages)).rejects.toThrow('OpenRouter API key is not set')
    })

    it('sends message with valid input', async () => {
      window.electronAPI.getOpenRouterKey = vi.fn().mockResolvedValue('test-key')
      const service = new OpenRouterService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ]
      
      const response = await service.sendMessage(messages)
      expect(response).toBeDefined()
      expect(response.content).toBe('Mocked OpenRouter response')
      expect(response.model).toBe('anthropic/claude-3.7-sonnet:thinking')
      expect(response.usage?.promptTokens).toBe(10)
      expect(response.usage?.completionTokens).toBe(20)
      expect(response.usage?.totalTokens).toBe(30)
    })

    it('handles messages with images', async () => {
      window.electronAPI.getOpenRouterKey = vi.fn().mockResolvedValue('test-key')
      const service = new OpenRouterService(mockConfig)
      const messages: LLMMessage[] = [
        { 
          role: 'user', 
          content: 'What is this?',
          imageDataUrls: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==']
        }
      ]
      
      const response = await service.sendMessage(messages)
      expect(response).toBeDefined()
    })

    it('includes current code in system prompt', async () => {
      window.electronAPI.getOpenRouterKey = vi.fn().mockResolvedValue('test-key')
      const service = new OpenRouterService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Modify this code' }
      ]
      const currentCode = 'cube([10, 10, 10]);'
      
      const response = await service.sendMessage(messages, currentCode)
      expect(response).toBeDefined()
    })

    it('includes API context in system prompt', async () => {
      window.electronAPI.getOpenRouterKey = vi.fn().mockResolvedValue('test-key')
      const service = new OpenRouterService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Use the API' }
      ]
      const apiContext = 'cube(size) - Creates a cube'
      
      const response = await service.sendMessage(messages, undefined, 'openscad', apiContext)
      expect(response).toBeDefined()
    })

    it('handles API error responses', async () => {
      window.electronAPI.getOpenRouterKey = vi.fn().mockResolvedValue('test-key')
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
        text: vi.fn().mockResolvedValue('Invalid API key')
      })
      
      const service = new OpenRouterService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ]
      
      await expect(service.sendMessage(messages)).rejects.toThrow('OpenRouter error')
    })

    it('handles array content in response', async () => {
      window.electronAPI.getOpenRouterKey = vi.fn().mockResolvedValue('test-key')
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: [
                { type: 'text', text: 'Part 1' },
                { type: 'text', text: 'Part 2' }
              ]
            }
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
          }
        })
      })
      
      const service = new OpenRouterService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ]
      
      const response = await service.sendMessage(messages)
      expect(response.content).toBe('Part 1Part 2')
    })

    it('uses cache_control content array for cache-capable model (anthropic)', async () => {
      window.electronAPI.getOpenRouterKey = vi.fn().mockResolvedValue('test-key')
      let capturedBody: { messages: Array<{ role: string; content: unknown }> } | null = null
      ;(global.fetch as any).mockImplementation(async (_url: string, init?: RequestInit) => {
        capturedBody = JSON.parse(init?.body as string) as { messages: Array<{ role: string; content: unknown }> }
        return {
          ok: true,
          json: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'ok' } }],
            usage: { prompt_tokens: 100, completion_tokens: 10, total_tokens: 110 }
          })
        }
      })

      const service = new OpenRouterService({
        ...mockConfig,
        model: 'anthropic/claude-3.5-sonnet'
      })
      const messages: LLMMessage[] = [{ role: 'user', content: 'Hi' }]
      const currentCode = 'cube(1);'
      const apiContext = 'cube(s) - cube'

      await service.sendMessage(messages, currentCode, 'openscad', apiContext)
      expect(capturedBody).not.toBeNull()
      const systemMsg = capturedBody!.messages.find((m) => m.role === 'system')
      expect(systemMsg).toBeDefined()
      expect(Array.isArray(systemMsg!.content)).toBe(true)
      const parts = systemMsg!.content as Array<{ type: string; text: string; cache_control?: { type: string } }>
      expect(parts.length).toBeGreaterThanOrEqual(2)
      const staticParts = parts.filter((p) => p.cache_control?.type === 'ephemeral')
      expect(staticParts.length).toBe(2)
      const dynamicPart = parts.find((p) => !p.cache_control)
      expect(dynamicPart).toBeDefined()
      expect(dynamicPart!.text).toContain('Current code in editor')
      expect(dynamicPart!.text).toContain('cube(1);')
    })

    it('uses string system content for non-cache-capable model', async () => {
      window.electronAPI.getOpenRouterKey = vi.fn().mockResolvedValue('test-key')
      let capturedBody: { messages: Array<{ role: string; content: unknown }> } | null = null
      ;(global.fetch as any).mockImplementation(async (_url: string, init?: RequestInit) => {
        capturedBody = JSON.parse(init?.body as string) as { messages: Array<{ role: string; content: unknown }> }
        return {
          ok: true,
          json: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'ok' } }],
            usage: { prompt_tokens: 100, completion_tokens: 10, total_tokens: 110 }
          })
        }
      })

      const service = new OpenRouterService({
        ...mockConfig,
        model: 'openai/gpt-4o'
      })
      const messages: LLMMessage[] = [{ role: 'user', content: 'Hi' }]
      const currentCode = 'cube(1);'
      const apiContext = 'cube(s) - cube'

      await service.sendMessage(messages, currentCode, 'openscad', apiContext)
      expect(capturedBody).not.toBeNull()
      const systemMsg = capturedBody!.messages.find((m) => m.role === 'system')
      expect(systemMsg).toBeDefined()
      expect(typeof systemMsg!.content).toBe('string')
      expect((systemMsg!.content as string)).toContain('Current code in editor')
      expect((systemMsg!.content as string)).toContain('cube(1);')
      expect((systemMsg!.content as string)).toContain('API Reference')
    })

    it('streamMessage uses same cache vs fallback logic as sendMessage', async () => {
      window.electronAPI.getOpenRouterKey = vi.fn().mockResolvedValue('test-key')
      let capturedBody: { messages: Array<{ role: string; content: unknown }> } | null = null
      ;(global.fetch as any).mockImplementation(async (_url: string, init?: RequestInit) => {
        capturedBody = JSON.parse(init?.body as string) as { messages: Array<{ role: string; content: unknown }> }
        return {
          ok: true,
          body: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'))
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
              controller.close()
            }
          })
        }
      })

      const service = new OpenRouterService({
        ...mockConfig,
        model: 'google/gemini-2.0-flash-001'
      })
      const messages: LLMMessage[] = [{ role: 'user', content: 'Hi' }]
      const chunks: string[] = []
      const controller = await service.streamMessage!(
        messages,
        (chunk) => { chunks.push(chunk) },
        'cube(1);',
        'openscad',
        'cube(s)'
      )
      await new Promise((r) => setTimeout(r, 150))

      expect(capturedBody).not.toBeNull()
      const systemMsg = capturedBody!.messages!.find((m: { role: string }) => m.role === 'system')
      expect(systemMsg).toBeDefined()
      expect(Array.isArray(systemMsg!.content)).toBe(true)
      const parts = systemMsg!.content as Array<{ cache_control?: { type: string } }>
      expect(parts.some((p) => p.cache_control?.type === 'ephemeral')).toBe(true)
      controller.abort()
    })
  })

  describe('supportsStreaming', () => {
    it('returns true', () => {
      const service = new OpenRouterService(mockConfig)
      expect(service.supportsStreaming()).toBe(true)
    })
  })

  describe('getProviderName', () => {
    it('returns correct provider name', () => {
      const service = new OpenRouterService(mockConfig)
      expect(service.getProviderName()).toBe('OpenRouter')
    })
  })
})
