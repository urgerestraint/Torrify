import type { CADBackend } from '../../services/cad'

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
  recentFiles?: RecentFile[]
  hasSeenDemo?: boolean
}

export type SettingsTab = 'general' | 'ai' | 'knowledge'

export interface ContextStatusInfo {
  user: { exists: boolean; size: number; modified: string | null }
  bundled: { exists: boolean; size: number; modified: string | null }
  active: 'user' | 'bundled'
}

export interface ContextStatus {
  openscad?: ContextStatusInfo
  build123d?: ContextStatusInfo
}
