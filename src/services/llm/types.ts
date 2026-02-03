// LLM Provider types and interfaces

export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'custom' | 'openrouter' | 'ollama' | 'gateway'
export type CADBackend = 'openscad' | 'build123d'

export interface LLMConfig {
  provider: LLMProvider
  model: string
  apiKey: string
  enabled: boolean
  customEndpoint?: string // For custom/local models
  temperature?: number
  maxTokens?: number
  /** Gateway provider: base URL (e.g. http://localhost:3000) */
  gatewayBaseUrl?: string
  /** Gateway provider: license key for X-License-Key header */
  gatewayLicenseKey?: string
}

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  imageDataUrls?: string[]
}

export interface LLMResponse {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Callback for streaming responses.
 * @param chunk - The new text chunk received
 * @param accumulated - The full accumulated response so far
 * @param done - Whether streaming is complete
 */
export type StreamCallback = (chunk: string, accumulated: string, done: boolean) => void

/**
 * Controller for aborting streaming requests
 */
export interface StreamController {
  abort: () => void
}

export interface LLMService {
  /**
   * Send a message and get a complete response (non-streaming)
   */
  sendMessage(messages: LLMMessage[], currentCode?: string, cadBackend?: CADBackend, apiContext?: string): Promise<LLMResponse>
  
  /**
   * Stream a message response, calling the callback for each chunk
   * Returns a controller that can be used to abort the stream
   */
  streamMessage?(
    messages: LLMMessage[],
    onChunk: StreamCallback,
    currentCode?: string,
    cadBackend?: CADBackend,
    apiContext?: string
  ): Promise<StreamController>
  
  /**
   * Whether this provider supports streaming responses
   */
  supportsStreaming(): boolean
  
  /**
   * Get the display name for this provider
   */
  getProviderName(): string
}
