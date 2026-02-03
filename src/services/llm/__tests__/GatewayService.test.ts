import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GatewayService } from '../GatewayService'
import type { LLMConfig, LLMMessage } from '../types'

global.fetch = vi.fn()

describe('GatewayService', () => {
  let originalGatewayRequest: unknown

  const mockConfig: LLMConfig = {
    provider: 'gateway',
    apiKey: '',
    model: 'openai/gpt-4o-mini',
    enabled: true,
    gatewayLicenseKey: 'TEST-LICENSE-123',
    temperature: 0.7,
    maxTokens: 2048
  }

  const GATEWAY_URL = 'https://the-gatekeeper-production.up.railway.app/api/chat'

  beforeEach(() => {
    vi.clearAllMocks()
    if (typeof window !== 'undefined' && window.electronAPI) {
      originalGatewayRequest = window.electronAPI.gatewayRequest
      delete (window.electronAPI as { gatewayRequest?: unknown }).gatewayRequest
    }
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Mocked Gateway response'
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

  afterEach(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      if (originalGatewayRequest) {
        ;(window.electronAPI as { gatewayRequest?: unknown }).gatewayRequest = originalGatewayRequest
      } else {
        delete (window.electronAPI as { gatewayRequest?: unknown }).gatewayRequest
      }
    }
  })

  describe('constructor', () => {
    it('creates service with valid config', () => {
      const service = new GatewayService(mockConfig)
      expect(service).toBeDefined()
      expect(service.getProviderName()).toBe('PRO')
    })
  })

  describe('sendMessage', () => {
    it('throws error when messages array is empty', async () => {
      const service = new GatewayService(mockConfig)
      const messages: LLMMessage[] = []

      await expect(service.sendMessage(messages)).rejects.toThrow('Messages array cannot be empty')
    })

    it('throws error when no user message is present', async () => {
      const service = new GatewayService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'assistant', content: 'Hello' }
      ]

      await expect(service.sendMessage(messages)).rejects.toThrow('At least one user message is required')
    })

    it('throws error when gateway license key is not set', async () => {
      const service = new GatewayService({
        ...mockConfig,
        gatewayLicenseKey: ''
      })
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ]

      await expect(service.sendMessage(messages)).rejects.toThrow('Gateway license key is not set')
    })

    it('sends message with X-License-Key and correct endpoint', async () => {
      const service = new GatewayService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ]

      const response = await service.sendMessage(messages)
      expect(response).toBeDefined()
      expect(response.content).toBe('Mocked Gateway response')
      expect(response.model).toBe('openai/gpt-4o-mini')
      expect(response.usage?.promptTokens).toBe(10)
      expect(response.usage?.completionTokens).toBe(20)
      expect(response.usage?.totalTokens).toBe(30)

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, init] = (global.fetch as any).mock.calls[0]
      expect(url).toBe(GATEWAY_URL)
      expect(init?.headers?.['X-License-Key']).toBe('TEST-LICENSE-123')
      expect(init?.headers?.['Content-Type']).toBe('application/json')
      const body = JSON.parse(init?.body as string)
      expect(body.model).toBe('openai/gpt-4o-mini')
      expect(body.stream).toBe(false)
      expect(Array.isArray(body.messages)).toBe(true)
    })

    it('uses fixed production gateway URL', async () => {
      const service = new GatewayService(mockConfig)
      const messages: LLMMessage[] = [{ role: 'user', content: 'Hi' }]

      await service.sendMessage(messages)
      const [url] = (global.fetch as any).mock.calls[0]
      expect(url).toBe(GATEWAY_URL)
    })

    it('handles API error responses', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
        text: vi.fn().mockResolvedValue('Invalid license key')
      })

      const service = new GatewayService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ]

      await expect(service.sendMessage(messages)).rejects.toThrow('Gateway error')
    })
  })

  describe('streamMessage', () => {
    it('streams and sends X-License-Key and stream: true', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller: ReadableStreamDefaultController<Uint8Array>) {
            controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'))
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
            controller.close()
          }
        })
      })

      const service = new GatewayService(mockConfig)
      const messages: LLMMessage[] = [{ role: 'user', content: 'Hi' }]
      const chunks: string[] = []
      const controller = await service.streamMessage!(
        messages,
        (chunk) => { chunks.push(chunk) }
      )

      await new Promise((r) => setTimeout(r, 100))

      expect(global.fetch).toHaveBeenCalledTimes(1)
      const [url, init] = (global.fetch as any).mock.calls[0]
      expect(url).toBe(GATEWAY_URL)
      expect(init?.headers?.['X-License-Key']).toBe('TEST-LICENSE-123')
      const body = JSON.parse(init?.body as string)
      expect(body.stream).toBe(true)
      expect(chunks).toContain('Hi')
      controller.abort()
    })

    it('throws error when license key is not set', async () => {
      const service = new GatewayService({
        ...mockConfig,
        gatewayLicenseKey: ''
      })
      const messages: LLMMessage[] = [{ role: 'user', content: 'Hi' }]

      await expect(
        service.streamMessage!(messages, () => {})
      ).rejects.toThrow('Gateway license key is not set')
    })
  })

  describe('supportsStreaming', () => {
    it('returns true', () => {
      const service = new GatewayService(mockConfig)
      expect(service.supportsStreaming()).toBe(true)
    })
  })

  describe('getProviderName', () => {
    it('returns correct provider name', () => {
      const service = new GatewayService(mockConfig)
      expect(service.getProviderName()).toBe('PRO')
    })
  })
})
