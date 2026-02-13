/**
 * Preload script for Electron.
 * Exposes a secure API to the renderer process via `contextBridge`.
 */
import { contextBridge, ipcRenderer } from 'electron'

/** Supported CAD backends */
export type CADBackend = 'openscad' | 'build123d'

/** Configuration for an LLM provider */
export interface LLMConfig {
  readonly provider: 'gemini' | 'openai' | 'anthropic' | 'custom' | 'openrouter' | 'ollama' | 'gateway'
  readonly model: string
  readonly apiKey: string
  readonly enabled: boolean
  readonly customEndpoint?: string
  readonly temperature?: number
  readonly maxTokens?: number
  readonly gatewayBaseUrl?: string
  readonly gatewayLicenseKey?: string
}

/** Application-wide settings */
export interface Settings {
  readonly cadBackend: CADBackend
  readonly openscadPath: string
  readonly build123dPythonPath: string
  readonly llm: LLMConfig
  readonly recentFiles?: readonly RecentFile[]
  readonly hasSeenDemo?: boolean
}

/** Project file structure for persistence */
interface Project {
  readonly version: number
  readonly code: string
  readonly stlBase64: string | null
  readonly chat: readonly {
    readonly id: number
    readonly text: string
    readonly sender: 'user' | 'bot'
    readonly timestamp: string
    readonly error?: boolean
    readonly imageDataUrls?: readonly string[]
  }[]
  readonly cadBackend?: CADBackend
}

/**
 * The API exposed to the renderer process via `window.electronAPI`.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /** Renders OpenSCAD code to a preview image */
  renderScad: (code: string) => ipcRenderer.invoke('render-scad', code),
  
  /** Renders CAD code (OpenSCAD or build123d) to STL data */
  renderStl: (code: string) => ipcRenderer.invoke('render-stl', code),
  
  /** Saves a project file (.torrify) to disk */
  saveProject: (project: Project, currentFilePath?: string) =>
    ipcRenderer.invoke('save-project', project, currentFilePath),
    
  /** Opens a project file from disk */
  loadProject: () => ipcRenderer.invoke('load-project'),
  
  /** Exports the raw source code to a file (e.g., .scad or .py) */
  exportScad: (code: string, backend?: CADBackend, currentFilePath?: string) =>
    ipcRenderer.invoke('export-scad', code, backend, currentFilePath),
    
  /** Exports the rendered STL data to a file */
  exportStl: (stlBase64: string | null, currentFilePath?: string) =>
    ipcRenderer.invoke('export-stl', stlBase64, currentFilePath),
    
  /** Returns the application's temporary directory path */
  getTempDir: () => ipcRenderer.invoke('get-temp-dir'),
  
  /** Loads the current application settings */
  getSettings: () => ipcRenderer.invoke('get-settings'),
  
  /** Saves the provided settings to disk */
  saveSettings: (settings: Settings) => ipcRenderer.invoke('save-settings', settings),
  
  /** Verifies if the specified OpenSCAD executable path is valid */
  checkOpenscadPath: (path: string) => ipcRenderer.invoke('check-openscad-path', path),
  
  /** Verifies if the specified Python interpreter path is valid for build123d */
  checkPythonPath: (path: string) => ipcRenderer.invoke('check-python-path', path),
  
  /** Validates if the selected CAD backend is properly configured */
  validateCadBackend: (backend: CADBackend) => ipcRenderer.invoke('validate-cad-backend', backend),
  
  /** Opens a native file picker to select the OpenSCAD executable */
  selectOpenscadPath: () => ipcRenderer.invoke('select-openscad-path'),
  
  /** Checks if the welcome/onboarding screen should be displayed */
  shouldShowWelcome: () => ipcRenderer.invoke('should-show-welcome'),
  
  /** Resets application settings to factory defaults */
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  
  /** Opens a native file picker to load a raw CAD source file */
  openScadFile: (backend?: CADBackend) => ipcRenderer.invoke('open-scad-file', backend || 'openscad'),
  
  /** Saves raw CAD source code directly to a file */
  saveScadFile: (code: string, filePath?: string, backend?: CADBackend) => 
    ipcRenderer.invoke('save-scad-file', code, filePath, backend || 'openscad'),
    
  /** Updates the main window title bar */
  setWindowTitle: (title: string) => ipcRenderer.invoke('set-window-title', title),
  
  /** Checks if OpenRouter is properly configured (API key exists) */
  getOpenRouterConfigured: () => ipcRenderer.invoke('get-openrouter-configured') as Promise<boolean>,
  
  /** Sends a message to the AI and waits for a full response */
  llmSendMessage: (payload: { messages: unknown[]; currentCode?: string; cadBackend?: string; apiContext?: string }) =>
    ipcRenderer.invoke('llm-send-message', payload),
    
  /** Initiates a streaming response from the AI */
  llmStreamMessage: (payload: { messages: unknown[]; currentCode?: string; cadBackend?: string; apiContext?: string }) =>
    ipcRenderer.invoke('llm-stream-message', payload),
    
  /** Aborts an active LLM streaming request */
  llmStreamAbort: (streamId: string) => ipcRenderer.invoke('llm-stream-abort', streamId),
  
  /** Registers a listener for streaming chunks from the main process */
  onLlmStreamChunk: (streamId: string, callback: (delta: string, full: string, done: boolean) => void) => {
    const handler = (_: unknown, data: { streamId: string; delta: string; full: string; done: boolean }) => {
      if (data.streamId === streamId) {
        callback(data.delta, data.full, data.done)
        if (data.done) {
          ipcRenderer.removeListener('llm-stream-chunk', handler)
        }
      }
    }
    ipcRenderer.on('llm-stream-chunk', handler)
  },
  
  /** Retrieves the list of recently opened files */
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  
  /** Clears the recent files history */
  clearRecentFiles: () => ipcRenderer.invoke('clear-recent-files'),
  
  /** Removes a specific file from the recent files list */
  removeRecentFile: (filePath: string) => ipcRenderer.invoke('remove-recent-file', filePath),
  
  /** Opens a file from the recent files list */
  openRecentFile: (filePath: string) => ipcRenderer.invoke('open-recent-file', filePath),
  
  /** Loads embedded application documentation */
  loadDocumentation: () => ipcRenderer.invoke('load-documentation'),
  
  /** Retrieves the knowledge base context for a specific backend */
  getContext: (backend: CADBackend) => ipcRenderer.invoke('get-context', backend),
  
  /** Returns the current synchronization status of the knowledge base */
  getContextStatus: () => ipcRenderer.invoke('get-context-status'),
  
  /** Updates the local knowledge base from a cloud-hosted repository */
  updateContextFromCloud: (backend: CADBackend, url: string) => ipcRenderer.invoke('update-context-from-cloud', backend, url),
  
  /** Resets the knowledge base to the bundled factory version */
  resetContextToFactory: (backend?: CADBackend) => ipcRenderer.invoke('reset-context-to-factory', backend),
  
  /** Retrieves available models from a local Ollama instance */
  getOllamaModels: (endpoint?: string) => ipcRenderer.invoke('get-ollama-models', endpoint),
  
  /** Registers a listener for menu-driven application events */
  onMenuEvent: (channel: string, callback: () => void) => {
    const validChannels = [
      'menu-new-file', 'menu-open-file', 'menu-save-file', 'menu-save-as',
      'menu-export-scad', 'menu-export-stl', 'menu-render',
      'menu-llm-toggle', 'menu-llm-byok', 'menu-llm-pro', 'menu-llm-settings',
      'menu-help-bot', 'menu-show-demo', 'menu-settings'
    ]
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel)
      ipcRenderer.on(channel, callback)
    }
  },
  
  /** Removes all menu listeners for a given channel */
  removeMenuListener: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

/** Entry in the recent files list */
export interface RecentFile {
  readonly filePath: string
  readonly lastOpened: string
}

/** Result of a CAD validation check */
export interface CADValidationResult {
  readonly valid: boolean
  readonly error?: string
  readonly version?: string
}

/** The main API interface exposed to the renderer window */
export interface ElectronAPI {
  readonly renderScad: (code: string) => Promise<{
    readonly success: boolean
    readonly image: string
    readonly timestamp: number
  }>
  readonly renderStl: (code: string) => Promise<{
    readonly success: boolean
    readonly stlBase64: string
    readonly timestamp: number
  }>
  readonly saveProject: (project: Project, currentFilePath?: string) => Promise<{ readonly canceled: boolean; readonly filePath?: string; readonly error?: string }>
  readonly loadProject: () => Promise<{ readonly canceled: boolean; readonly project?: Project; readonly filePath?: string; readonly error?: string }>
  readonly exportScad: (code: string, backend?: CADBackend, currentFilePath?: string) => Promise<{ readonly canceled: boolean; readonly filePath?: string }>
  readonly exportStl: (stlBase64: string | null, currentFilePath?: string) => Promise<{ readonly canceled: boolean; readonly filePath?: string }>
  readonly getTempDir: () => Promise<string>
  readonly getSettings: () => Promise<Settings>
  readonly saveSettings: (settings: Settings) => Promise<{ readonly success: boolean }>
  readonly checkOpenscadPath: (path: string) => Promise<boolean>
  readonly checkPythonPath: (path: string) => Promise<CADValidationResult>
  readonly validateCadBackend: (backend: CADBackend) => Promise<CADValidationResult>
  readonly selectOpenscadPath: () => Promise<{ readonly canceled: boolean; readonly filePath?: string }>
  readonly shouldShowWelcome: () => Promise<boolean>
  readonly resetSettings: () => Promise<{ readonly success: boolean; readonly error?: string }>
  readonly openScadFile: (backend?: CADBackend) => Promise<{ readonly canceled: boolean; readonly filePath?: string; readonly code?: string; readonly error?: string }>
  readonly saveScadFile: (code: string, filePath?: string, backend?: CADBackend) => Promise<{ readonly canceled: boolean; readonly filePath?: string; readonly error?: string }>
  readonly setWindowTitle: (title: string) => Promise<void>
  readonly getOpenRouterConfigured: () => Promise<boolean>
  readonly llmSendMessage: (payload: { readonly messages: readonly unknown[]; readonly currentCode?: string; readonly cadBackend?: string; readonly apiContext?: string }) => Promise<{
    readonly success: boolean
    readonly response?: { readonly content: string; readonly model: string; readonly usage?: { readonly promptTokens: number; readonly completionTokens: number; readonly totalTokens: number } }
    readonly error?: string
  }>
  readonly llmStreamMessage: (payload: { readonly messages: readonly unknown[]; readonly currentCode?: string; readonly cadBackend?: string; readonly apiContext?: string }) => Promise<{ readonly streamId: string | null; readonly error?: string }>
  readonly llmStreamAbort: (streamId: string) => Promise<void>
  readonly onLlmStreamChunk: (streamId: string, callback: (delta: string, full: string, done: boolean) => void) => void
  readonly getRecentFiles: () => Promise<readonly RecentFile[]>
  readonly getOllamaModels: (endpoint?: string) => Promise<{ readonly success: boolean; readonly models?: readonly { readonly name: string; readonly size: number; readonly modified: string }[]; readonly error?: string }>
  readonly clearRecentFiles: () => Promise<{ readonly success: boolean }>
  readonly removeRecentFile: (filePath: string) => Promise<{ readonly success: boolean }>
  readonly openRecentFile: (filePath: string) => Promise<{ readonly canceled: boolean; readonly filePath?: string; readonly code?: string; readonly project?: Project; readonly isProject?: boolean; readonly error?: string }>
  readonly loadDocumentation: () => Promise<{ readonly success: boolean; readonly docs?: Readonly<Record<string, string>>; readonly error?: string }>
  
  readonly getContext: (backend: CADBackend) => Promise<ContextResult>
  readonly getContextStatus: () => Promise<ContextStatusResult>
  readonly updateContextFromCloud: (backend: CADBackend, url: string) => Promise<ContextUpdateResult>
  readonly resetContextToFactory: (backend?: CADBackend) => Promise<ContextResetResult>
  
  readonly onMenuEvent: (channel: string, callback: () => void) => void
  readonly removeMenuListener: (channel: string) => void
}

/** Result of a knowledge base context retrieval */
export interface ContextResult {
  readonly success: boolean
  readonly content?: string
  readonly source?: 'user' | 'bundled'
  readonly filename?: string
  readonly error?: string
}

/** Metadata for a context file on disk */
export interface ContextFileInfo {
  readonly exists: boolean
  readonly size: number
  readonly modified: string | null
}

/** Synchronization status of the knowledge base */
export interface ContextStatusResult {
  readonly success: boolean
  readonly openscad?: {
    readonly user: ContextFileInfo
    readonly bundled: ContextFileInfo
    readonly active: 'user' | 'bundled'
  }
  readonly build123d?: {
    readonly user: ContextFileInfo
    readonly bundled: ContextFileInfo
    readonly active: 'user' | 'bundled'
  }
  readonly error?: string
}

/** Result of a knowledge base update operation */
export interface ContextUpdateResult {
  readonly success: boolean
  readonly message?: string
  readonly size?: number
  readonly error?: string
}

/** Result of a knowledge base reset operation */
export interface ContextResetResult {
  readonly success: boolean
  readonly message?: string
  readonly error?: string
}

declare global {
  interface Window {
    readonly electronAPI: ElectronAPI
  }
}
