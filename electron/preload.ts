import { contextBridge, ipcRenderer } from 'electron'

export type CADBackend = 'openscad' | 'build123d'

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

export interface Settings {
  cadBackend: CADBackend
  openscadPath: string
  build123dPythonPath: string
  llm: LLMConfig
  recentFiles?: RecentFile[]
  hasSeenDemo?: boolean
}

// Project interface for type safety
interface Project {
  version: number
  code: string
  stlBase64: string | null
  chat: Array<{
    id: number
    text: string
    sender: 'user' | 'bot'
    timestamp: string
    error?: boolean
    imageDataUrls?: string[]
  }>
  cadBackend?: CADBackend
}

contextBridge.exposeInMainWorld('electronAPI', {
  renderScad: (code: string) => ipcRenderer.invoke('render-scad', code),
  renderStl: (code: string) => ipcRenderer.invoke('render-stl', code),
  saveProject: (project: Project) => ipcRenderer.invoke('save-project', project),
  loadProject: () => ipcRenderer.invoke('load-project'),
  exportScad: (code: string, backend?: CADBackend) => ipcRenderer.invoke('export-scad', code, backend),
  exportStl: (stlBase64: string | null) => ipcRenderer.invoke('export-stl', stlBase64),
  getTempDir: () => ipcRenderer.invoke('get-temp-dir'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Settings) => ipcRenderer.invoke('save-settings', settings),
  checkOpenscadPath: (path: string) => ipcRenderer.invoke('check-openscad-path', path),
  checkPythonPath: (path: string) => ipcRenderer.invoke('check-python-path', path),
  validateCadBackend: (backend: CADBackend) => ipcRenderer.invoke('validate-cad-backend', backend),
  selectOpenscadPath: () => ipcRenderer.invoke('select-openscad-path'),
  shouldShowWelcome: () => ipcRenderer.invoke('should-show-welcome'),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  openScadFile: (backend?: CADBackend) => ipcRenderer.invoke('open-scad-file', backend || 'openscad'),
  saveScadFile: (code: string, filePath?: string, backend?: CADBackend) => ipcRenderer.invoke('save-scad-file', code, filePath, backend || 'openscad'),
  setWindowTitle: (title: string) => ipcRenderer.invoke('set-window-title', title),
  getOpenRouterKey: () => ipcRenderer.invoke('get-openrouter-key'),
  gatewayRequest: (request: { licenseKey?: string; body?: unknown }) => ipcRenderer.invoke('gateway-request', request),
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  clearRecentFiles: () => ipcRenderer.invoke('clear-recent-files'),
  removeRecentFile: (filePath: string) => ipcRenderer.invoke('remove-recent-file', filePath),
  openRecentFile: (filePath: string) => ipcRenderer.invoke('open-recent-file', filePath),
  loadDocumentation: () => ipcRenderer.invoke('load-documentation'),
  
  // Context management (Knowledge Base)
  getContext: (backend: CADBackend) => ipcRenderer.invoke('get-context', backend),
  getContextStatus: () => ipcRenderer.invoke('get-context-status'),
  updateContextFromCloud: (backend: CADBackend, url: string) => ipcRenderer.invoke('update-context-from-cloud', backend, url),
  resetContextToFactory: (backend?: CADBackend) => ipcRenderer.invoke('reset-context-to-factory', backend),
  
  // Ollama models
  getOllamaModels: (endpoint?: string) => ipcRenderer.invoke('get-ollama-models', endpoint),
  
  // Menu event listeners
  onMenuEvent: (channel: string, callback: () => void) => {
    const validChannels = [
      'menu-new-file', 'menu-open-file', 'menu-save-file', 'menu-save-as',
      'menu-export-scad', 'menu-export-stl', 'menu-render',
      'menu-llm-toggle', 'menu-llm-byok', 'menu-llm-pro', 'menu-llm-settings',
      'menu-help-bot', 'menu-show-demo', 'menu-settings'
    ]
    if (validChannels.includes(channel)) {
      // Remove existing listeners to prevent duplicates/leaks
      ipcRenderer.removeAllListeners(channel)
      ipcRenderer.on(channel, callback)
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- callback kept for API symmetry with onMenuEvent
  removeMenuListener: (channel: string, callback: () => void) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// Type definitions for window
export interface RecentFile {
  filePath: string
  lastOpened: string
}

export interface CADValidationResult {
  valid: boolean
  error?: string
  version?: string
}

export interface ElectronAPI {
  renderScad: (code: string) => Promise<{
    success: boolean
    image: string
    timestamp: number
  }>
  renderStl: (code: string) => Promise<{
    success: boolean
    stlBase64: string
    timestamp: number
  }>
  saveProject: (project: Project) => Promise<{ canceled: boolean; filePath?: string; error?: string }>
  loadProject: () => Promise<{ canceled: boolean; project?: Project; filePath?: string; error?: string }>
  exportScad: (code: string) => Promise<{ canceled: boolean; filePath?: string }>
  exportStl: (stlBase64: string | null) => Promise<{ canceled: boolean; filePath?: string }>
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
  getOpenRouterKey: () => Promise<string | null>
  gatewayRequest: (request: { licenseKey?: string; body?: unknown }) => Promise<{
    ok: boolean
    status: number
    statusText: string
    data?: unknown
    errorText?: string
  }>
  getRecentFiles: () => Promise<RecentFile[]>
  clearRecentFiles: () => Promise<{ success: boolean }>
  removeRecentFile: (filePath: string) => Promise<{ success: boolean }>
  openRecentFile: (filePath: string) => Promise<{ canceled: boolean; filePath?: string; code?: string; project?: Project; isProject?: boolean; error?: string }>
  loadDocumentation: () => Promise<{ success: boolean; docs?: Record<string, string>; error?: string }>
  
  // Context management (Knowledge Base)
  getContext: (backend: CADBackend) => Promise<ContextResult>
  getContextStatus: () => Promise<ContextStatusResult>
  updateContextFromCloud: (backend: CADBackend, url: string) => Promise<ContextUpdateResult>
  resetContextToFactory: (backend?: CADBackend) => Promise<ContextResetResult>
  
  onMenuEvent: (channel: string, callback: () => void) => void
  removeMenuListener: (channel: string, callback: () => void) => void
}

// Context management types
export interface ContextResult {
  success: boolean
  content?: string
  source?: 'user' | 'bundled'
  filename?: string
  error?: string
}

export interface ContextFileInfo {
  exists: boolean
  size: number
  modified: string | null
}

export interface ContextStatusResult {
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

export interface ContextUpdateResult {
  success: boolean
  message?: string
  size?: number
  error?: string
}

export interface ContextResetResult {
  success: boolean
  message?: string
  error?: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
