/// <reference types="vite/client" />

type CADBackend = 'openscad' | 'build123d'

interface LLMConfig {
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

interface RecentFile {
  filePath: string
  lastOpened: string
}

/** Loaded project shape from openRecentFile / loadProject */
interface LoadedProject {
  version?: number
  code?: string
  chat?: Array<{ id: number; text: string; sender: 'user' | 'bot'; timestamp: string; error?: boolean; imageDataUrls?: string[] }>
  stlBase64?: string | null
  cadBackend?: CADBackend
}

interface OpenRecentFileResult {
  canceled: boolean
  filePath?: string
  code?: string
  project?: LoadedProject
  isProject?: boolean
  error?: string
}

interface Settings {
  cadBackend: CADBackend
  openscadPath: string
  build123dPythonPath: string
  llm: LLMConfig
  recentFiles?: RecentFile[]
  hasSeenDemo?: boolean
}

interface CADValidationResult {
  valid: boolean
  error?: string
  version?: string
}

// Context management types
interface ContextResult {
  success: boolean
  content?: string
  source?: 'user' | 'bundled'
  filename?: string
  error?: string
}

interface ContextFileInfo {
  exists: boolean
  size: number
  modified: string | null
}

interface ContextStatusResult {
  success: boolean
  openscad?: {
    user: ContextFileInfo
    bundled: ContextFileInfo
    active: 'user' | 'bundled'
  }
  build123d?: {
    user: ContextFileInfo
    bundled: ContextFileInfo
    active: 'user' | 'bundled'
  }
  error?: string
}

interface ContextUpdateResult {
  success: boolean
  message?: string
  size?: number
  error?: string
}

interface ContextResetResult {
  success: boolean
  message?: string
  error?: string
}

interface ElectronAPI {
  renderScad: (code: string) => Promise<{
    success: boolean
    image: string
    timestamp: number
  }>
  renderStl: (code: string) => Promise<{
    success: boolean
    stlBase64?: string
    timestamp: number
    error?: string
  }>
  saveProject: (project: any, currentFilePath?: string) => Promise<{ canceled: boolean; filePath?: string; error?: string }>
  loadProject: () => Promise<{ canceled: boolean; project?: any; filePath?: string; error?: string }>
  exportScad: (code: string, backend?: CADBackend, currentFilePath?: string) => Promise<{ canceled: boolean; filePath?: string }>
  exportStl: (stlBase64: string | null, currentFilePath?: string) => Promise<{ canceled: boolean; filePath?: string }>
  getTempDir: () => Promise<string>
  getSettings: () => Promise<Settings>
  saveSettings: (settings: Settings) => Promise<{ success: boolean }>
  checkOpenscadPath: (path: string) => Promise<boolean>
  checkPythonPath: (path: string) => Promise<CADValidationResult>
  validateCadBackend: (backend: CADBackend) => Promise<CADValidationResult>
  selectOpenscadPath: () => Promise<{ canceled: boolean; filePath?: string }>
  shouldShowWelcome: () => Promise<boolean>
  resetSettings: () => Promise<{ success: boolean; error?: string }>
  openScadFile: (backend?: CADBackend) => Promise<{ canceled: boolean; filePath?: string; code?: string; error?: string }>
  saveScadFile: (code: string, filePath?: string, backend?: CADBackend) => Promise<{ canceled: boolean; filePath?: string; error?: string }>
  setWindowTitle: (title: string) => Promise<void>
  getOpenRouterConfigured: () => Promise<boolean>
  llmSendMessage: (payload: { messages: unknown[]; currentCode?: string; cadBackend?: string; apiContext?: string }) => Promise<{
    success: boolean
    response?: { content: string; model: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } }
    error?: string
  }>
  llmStreamMessage: (payload: { messages: unknown[]; currentCode?: string; cadBackend?: string; apiContext?: string }) => Promise<{ streamId: string | null; error?: string }>
  llmStreamAbort: (streamId: string) => Promise<void>
  onLlmStreamChunk: (streamId: string, callback: (delta: string, full: string, done: boolean) => void) => void
  getRecentFiles: () => Promise<RecentFile[]>
  clearRecentFiles: () => Promise<{ success: boolean }>
  removeRecentFile: (filePath: string) => Promise<{ success: boolean }>
  openRecentFile: (filePath: string) => Promise<OpenRecentFileResult>
  loadDocumentation: () => Promise<{ success: boolean; docs?: Record<string, string>; error?: string }>
  
  // Context management (Knowledge Base)
  getContext: (backend: CADBackend) => Promise<ContextResult>
  getContextStatus: () => Promise<ContextStatusResult>
  updateContextFromCloud: (backend: CADBackend, url: string) => Promise<ContextUpdateResult>
  resetContextToFactory: (backend?: CADBackend) => Promise<ContextResetResult>
  
  // Ollama models
  getOllamaModels: (endpoint?: string) => Promise<{ success: boolean; models: Array<{ name: string; size: number; modified: string }>; error?: string }>
  
  onMenuEvent: (channel: string, callback: () => void) => void
  removeMenuListener: (channel: string, callback: () => void) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
