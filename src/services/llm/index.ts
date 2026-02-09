/**
 * LLM Service Factory and Provider Configuration.
 * 
 * In the renderer process, this factory creates a proxy that communicates 
 * with the Electron main process via IPC.
 */

import type { LLMService, LLMConfig, LLMProvider } from './types'
import { LLMProxy } from './LLMProxy'

export * from './types'

/**
 * List of providers that do not require an API key to be set manually in the 
 * application settings (e.g. handled by environment variables or local services).
 */
const PROVIDERS_WITHOUT_API_KEY: readonly LLMProvider[] = [
  'openrouter', 
  'ollama', 
  'custom', 
  'gateway'
] as const

/**
 * Determines if a given provider requires a manual API key configuration.
 * 
 * @param provider - The LLM provider to check
 * @returns True if the provider requires an API key in the settings
 */
export const requiresApiKey = (provider: LLMProvider): boolean =>
  !PROVIDERS_WITHOUT_API_KEY.includes(provider)

/**
 * Factory function to create an LLM service instance.
 * 
 * @param config - The current LLM configuration
 * @throws {Error} If the AI features are not enabled in the configuration
 * @returns An implementation of LLMService (currently always returns LLMProxy)
 */
export function createLLMService(config: LLMConfig): LLMService {
  if (!config.enabled) {
    throw new Error('LLM is not enabled')
  }
  return new LLMProxy()
}

/**
 * Human-readable display names for supported LLM providers.
 */
export const PROVIDER_NAMES: Readonly<Record<LLMProvider, string>> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI (GPT)',
  anthropic: 'Anthropic (Claude)',
  custom: 'Custom / Local Model',
  openrouter: 'OpenRouter',
  ollama: 'Ollama (Local)',
  gateway: 'PRO'
} as const

/**
 * Default model identifiers recommended for each provider.
 */
export const DEFAULT_MODELS: Readonly<Record<LLMProvider, string>> = {
  gemini: 'gemini-3-flash',
  openai: 'gpt-5.2',
  anthropic: 'claude-3-5-sonnet-20241022',
  custom: '',
  openrouter: 'anthropic/claude-3.7-sonnet:thinking',
  gateway: 'openai/gpt-4o-mini',
  ollama: 'gpt-oss:20b'
} as const
