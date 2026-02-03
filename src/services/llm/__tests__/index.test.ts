import { describe, it, expect, vi } from 'vitest'
import type { LLMConfig } from '../types'

// Unmock the LLM module for this test file so we can test the actual factory
vi.unmock('../index')
vi.unmock('..')

// Import after unmocking
const { createLLMService, PROVIDER_NAMES, DEFAULT_MODELS } = await import('../index')

describe('LLM Service Factory', () => {
  describe('createLLMService', () => {
    it('creates GeminiService for gemini provider', () => {
      const config: LLMConfig = {
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'gemini-2.0-flash-exp',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048
      }
      
      const service = createLLMService(config)
      expect(service).toBeDefined()
      expect(service.getProviderName()).toBe('Google Gemini')
    })

    it('creates OpenRouterService for openrouter provider', () => {
      const config: LLMConfig = {
        provider: 'openrouter',
        apiKey: '', // OpenRouter uses env-based key, not config apiKey
        model: 'anthropic/claude-3.7-sonnet:thinking',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048
      }
      
      const service = createLLMService(config)
      expect(service).toBeDefined()
      expect(service.getProviderName()).toBe('OpenRouter')
    })

    it('creates GatewayService for gateway provider', () => {
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
      expect(service.getProviderName()).toBe('PRO')
    })

    it('throws error when LLM is not enabled', () => {
      const config: LLMConfig = {
        provider: 'gemini',
        apiKey: 'test-key',
        model: 'gemini-2.0-flash-exp',
        enabled: false,
        temperature: 0.7,
        maxTokens: 2048
      }
      
      expect(() => createLLMService(config)).toThrow('LLM is not enabled')
    })

    it('throws error when API key is missing for gemini', () => {
      const config: LLMConfig = {
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-2.0-flash-exp',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048
      }
      
      expect(() => createLLMService(config)).toThrow('API key is required')
    })

    it('does not require API key for openrouter', () => {
      const config: LLMConfig = {
        provider: 'openrouter',
        apiKey: '', // OpenRouter uses env-based key, not config apiKey
        model: 'anthropic/claude-3.7-sonnet:thinking',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048
      }
      
      // Should not throw even without apiKey
      const service = createLLMService(config)
      expect(service).toBeDefined()
    })

    it('does not require API key for gateway', () => {
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
    })

    it('does not require API key for custom provider', () => {
      const config: LLMConfig = {
        provider: 'custom',
        apiKey: '',
        model: 'local-model',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048
      }
      
      expect(() => createLLMService(config)).toThrow('Custom provider not yet implemented')
    })

    it('throws error for unimplemented openai provider', () => {
      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048
      }
      
      expect(() => createLLMService(config)).toThrow('OpenAI provider not yet implemented')
    })

    it('throws error for unimplemented anthropic provider', () => {
      const config: LLMConfig = {
        provider: 'anthropic',
        apiKey: 'test-key',
        model: 'claude-3-5-sonnet',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048
      }
      
      expect(() => createLLMService(config)).toThrow('Anthropic provider not yet implemented')
    })

    it('throws error for unimplemented custom provider', () => {
      const config: LLMConfig = {
        provider: 'custom',
        apiKey: 'test-key',
        model: 'local-model',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048
      }
      
      expect(() => createLLMService(config)).toThrow('Custom provider not yet implemented')
    })

    it('throws error for unknown provider', () => {
      const config = {
        provider: 'unknown' as any,
        apiKey: 'test-key',
        model: 'test-model',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048
      }
      
      expect(() => createLLMService(config)).toThrow('Unknown LLM provider: unknown')
    })
  })

  describe('PROVIDER_NAMES', () => {
    it('has correct provider names', () => {
      expect(PROVIDER_NAMES.gemini).toBe('Google Gemini')
      expect(PROVIDER_NAMES.openai).toBe('OpenAI (GPT)')
      expect(PROVIDER_NAMES.anthropic).toBe('Anthropic (Claude)')
      expect(PROVIDER_NAMES.custom).toBe('Custom / Local Model')
      expect(PROVIDER_NAMES.openrouter).toBe('OpenRouter')
      expect(PROVIDER_NAMES.gateway).toBe('PRO')
    })
  })

  describe('DEFAULT_MODELS', () => {
    it('has default models for each provider', () => {
      expect(DEFAULT_MODELS.gemini).toBe('gemini-2.0-flash-exp')
      expect(DEFAULT_MODELS.openai).toBe('gpt-4-turbo-preview')
      expect(DEFAULT_MODELS.anthropic).toBe('claude-3-5-sonnet-20241022')
      expect(DEFAULT_MODELS.custom).toBe('')
      expect(DEFAULT_MODELS.openrouter).toBe('anthropic/claude-3.7-sonnet:thinking')
      expect(DEFAULT_MODELS.gateway).toBe('openai/gpt-4o-mini')
    })
  })
})
