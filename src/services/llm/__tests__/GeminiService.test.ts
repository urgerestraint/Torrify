import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeminiService } from '../GeminiService'
import type { LLMConfig, LLMMessage } from '../types'

// Mock @google/generative-ai
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn(() => ({
      startChat: vi.fn(() => ({
        sendMessage: vi.fn().mockResolvedValue({
          response: {
            text: vi.fn().mockReturnValue('Mocked AI response')
          }
        }),
        sendMessageStream: vi.fn().mockResolvedValue({
          stream: (async function* () {
            yield { text: vi.fn().mockReturnValue('Streamed ') }
            yield { text: vi.fn().mockReturnValue('response') }
          }())
        })
      }))
    }))
  }))
}))

describe('GeminiService', () => {
  const mockConfig: LLMConfig = {
    provider: 'gemini',
    apiKey: 'test-api-key',
    model: 'gemini-2.0-flash-exp',
    enabled: true,
    temperature: 0.7,
    maxTokens: 2048
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('creates service with valid config', () => {
      const service = new GeminiService(mockConfig)
      expect(service).toBeDefined()
      expect(service.getProviderName()).toBe('Google Gemini')
    })
  })

  describe('sendMessage', () => {
    it('throws error when messages array is empty', async () => {
      const service = new GeminiService(mockConfig)
      const messages: LLMMessage[] = []
      
      await expect(service.sendMessage(messages)).rejects.toThrow('Messages array cannot be empty')
    })

    it('throws error when no user message is present', async () => {
      const service = new GeminiService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'assistant', content: 'Hello' }
      ]
      
      await expect(service.sendMessage(messages)).rejects.toThrow('At least one user message is required')
    })

    it('sends message with valid input', async () => {
      const service = new GeminiService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ]
      
      const response = await service.sendMessage(messages)
      expect(response).toBeDefined()
      expect(response.content).toBe('Mocked AI response')
      expect(response.model).toBe('gemini-2.0-flash-exp')
    })

    it('handles messages with images', async () => {
      const service = new GeminiService(mockConfig)
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
      const service = new GeminiService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Modify this code' }
      ]
      const currentCode = 'cube([10, 10, 10]);'
      
      const response = await service.sendMessage(messages, currentCode)
      expect(response).toBeDefined()
    })

    it('includes API context in system prompt', async () => {
      const service = new GeminiService(mockConfig)
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Use the API' }
      ]
      const apiContext = 'cube(size) - Creates a cube'
      
      const response = await service.sendMessage(messages, undefined, 'openscad', apiContext)
      expect(response).toBeDefined()
    })
  })

  describe('streamMessage', () => {
    it('throws when messages array is empty', async () => {
      const service = new GeminiService(mockConfig)
      await expect(
        service.streamMessage([], vi.fn())
      ).rejects.toThrow('Messages array cannot be empty')
    })

    it('returns controller and calls onChunk with streamed content', async () => {
      const service = new GeminiService(mockConfig)
      const onChunk = vi.fn()
      const controller = await service.streamMessage(
        [{ role: 'user', content: 'Hello' }],
        onChunk
      )
      expect(controller).toBeDefined()
      expect(controller.abort).toBeDefined()
      await new Promise((r) => setTimeout(r, 50))
      expect(onChunk).toHaveBeenCalled()
    })
  })

  describe('supportsStreaming', () => {
    it('returns true', () => {
      const service = new GeminiService(mockConfig)
      expect(service.supportsStreaming()).toBe(true)
    })
  })

  describe('getProviderName', () => {
    it('returns correct provider name', () => {
      const service = new GeminiService(mockConfig)
      expect(service.getProviderName()).toBe('Google Gemini')
    })
  })
})
