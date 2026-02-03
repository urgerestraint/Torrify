import type { CADBackend } from '../cad'

export interface LLMConfig {
  provider: 'gemini' | 'openai' | 'anthropic' | 'custom' | 'openrouter' | 'ollama' | 'gateway'
  model: string
  apiKey: string
  enabled: boolean
  customEndpoint?: string
  temperature?: number
  maxTokens?: number
  gatewayBaseUrl?: string
  gatewayLicenseKey?: string
}

export interface RecentFile {
  filePath: string
  lastOpened: string
}

export interface Settings {
  cadBackend: CADBackend
  openscadPath: string
  build123dPythonPath: string
  llm: LLMConfig
  recentFiles: RecentFile[]
  hasSeenDemo?: boolean
}
