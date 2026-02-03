// LLM Service Factory

import type { LLMService, LLMConfig, LLMProvider } from './types'
import { GeminiService } from './GeminiService'
import { OpenRouterService } from './OpenRouterService'
import { OllamaService } from './OllamaService'
import { GatewayService } from './GatewayService'

export * from './types'

const PROVIDERS_WITHOUT_API_KEY: LLMProvider[] = ['openrouter', 'ollama', 'custom', 'gateway']

export const requiresApiKey = (provider: LLMProvider): boolean =>
  !PROVIDERS_WITHOUT_API_KEY.includes(provider)

export function createLLMService(config: LLMConfig): LLMService {
  if (!config.enabled) {
    throw new Error('LLM is not enabled')
  }

  if (!config.apiKey && requiresApiKey(config.provider)) {
    throw new Error('API key is required')
  }

  switch (config.provider) {
    case 'gemini':
      return new GeminiService(config)
    
    case 'openai':
      // TODO: Implement OpenAI service
      throw new Error('OpenAI provider not yet implemented')
    
    case 'anthropic':
      // TODO: Implement Anthropic service
      throw new Error('Anthropic provider not yet implemented')
    
    case 'custom':
      // TODO: Implement custom provider (for local models)
      throw new Error('Custom provider not yet implemented')

    case 'openrouter':
      return new OpenRouterService(config)

    case 'gateway':
      return new GatewayService(config)
    
    case 'ollama':
      return new OllamaService(config)
    
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`)
  }
}

// Provider display names (gateway = PRO tier, openrouter = BYOK)
export const PROVIDER_NAMES: Record<string, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI (GPT)',
  anthropic: 'Anthropic (Claude)',
  custom: 'Custom / Local Model',
  openrouter: 'OpenRouter',
  ollama: 'Ollama (Local)',
  gateway: 'PRO'
}

// Default models for each provider
export const DEFAULT_MODELS: Record<string, string> = {
  gemini: 'gemini-2.0-flash-exp',
  openai: 'gpt-4-turbo-preview',
  anthropic: 'claude-3-5-sonnet-20241022',
  custom: '',
  openrouter: 'anthropic/claude-3.7-sonnet:thinking',
  gateway: 'openai/gpt-4o-mini',
  ollama: 'gpt-oss:20b' // Default to a common model, user can change
}
