import { describe, it, expect, vi } from 'vitest'
import type { LLMConfig } from '../types'

vi.unmock('../index')
vi.unmock('..')

const { createLLMService, requiresApiKey, PROVIDER_NAMES, DEFAULT_MODELS } = await import('../index')

describe('LLM Service Factory', () => {
  describe('createLLMService', () => {
    it('returns an LLM proxy for any enabled provider', () => {
      const config: LLMConfig = {
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'gemini-3-flash',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048
      }
      const service = createLLMService(config)
      expect(service).toBeDefined()
      expect(service.getProviderName()).toBe('LLM')
      expect(service.supportsStreaming()).toBe(true)
      expect(typeof service.sendMessage).toBe('function')
      expect(typeof service.streamMessage).toBe('function')
    })

    it('returns proxy for gateway provider without requiring apiKey in config', () => {
      const config: LLMConfig = {
        provider: 'gateway',
        apiKey: '',
        model: 'openai/gpt-4o-mini',
        enabled: true,
        gatewayLicenseKey: 'TEST-LICENSE-123',
        temperature: 0.7,
        maxTokens: 2048
      }
      const service = createLLMService(config)
      expect(service).toBeDefined()
      expect(service.getProviderName()).toBe('LLM')
    })

    it('throws error when LLM is not enabled', () => {
      const config: LLMConfig = {
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'gemini-3-flash',
        enabled: false,
        temperature: 0.7,
        maxTokens: 2048
      }
      expect(() => createLLMService(config)).toThrow('LLM is not enabled')
    })
  })

  describe('requiresApiKey', () => {
    it('returns true for providers that need an API key', () => {
      expect(requiresApiKey('gemini')).toBe(true)
      expect(requiresApiKey('openai')).toBe(true)
      expect(requiresApiKey('anthropic')).toBe(true)
    })
    it('returns false for providers without API key in config', () => {
      expect(requiresApiKey('openrouter')).toBe(false)
      expect(requiresApiKey('ollama')).toBe(false)
      expect(requiresApiKey('gateway')).toBe(false)
      expect(requiresApiKey('custom')).toBe(false)
    })
  })

  describe('PROVIDER_NAMES', () => {
    it('has correct provider names', () => {
      expect(PROVIDER_NAMES.gemini).toBe('Google Gemini')
      expect(PROVIDER_NAMES.openai).toBe('OpenAI (GPT)')
      expect(PROVIDER_NAMES.anthropic).toBe('Anthropic (Claude)')
      expect(PROVIDER_NAMES.custom).toBe('Custom / Local Model')
      expect(PROVIDER_NAMES.openrouter).toBe('OpenRouter')
      expect(PROVIDER_NAMES.ollama).toBe('Ollama (Local)')
      expect(PROVIDER_NAMES.gateway).toBe('PRO')
    })
  })

  describe('DEFAULT_MODELS', () => {
    it('has default models for each provider', () => {
      expect(DEFAULT_MODELS.gemini).toBe('gemini-3-flash')
      expect(DEFAULT_MODELS.openai).toBe('gpt-5.2')
      expect(DEFAULT_MODELS.anthropic).toBe('claude-3-5-sonnet-20241022')
      expect(DEFAULT_MODELS.custom).toBe('')
      expect(DEFAULT_MODELS.openrouter).toBe('anthropic/claude-3.7-sonnet:thinking')
      expect(DEFAULT_MODELS.gateway).toBe('openai/gpt-4o-mini')
      expect(DEFAULT_MODELS.ollama).toBe('gpt-oss:20b')
    })
  })
})
