/**
 * LLM Provider Types and Interfaces for the Main Process.
 * 
 * These types define the contract for AI service implementations running
 * in the Electron main process, which handle direct network communication
 * with AI vendors.
 */

/** Supported AI service providers */
export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'custom' | 'openrouter' | 'ollama' | 'gateway'

/** Supported CAD backends used for prompt context */
export type CADBackend = 'openscad' | 'build123d'

/**
 * Configuration for an LLM service instance.
 */
export interface LLMConfig {
  readonly provider: LLMProvider
  readonly model: string
  readonly apiKey: string
  readonly enabled: boolean
  readonly customEndpoint?: string
  readonly temperature?: number
  readonly maxTokens?: number
  readonly gatewayBaseUrl?: string
  readonly gatewayLicenseKey?: string
}

/**
 * A single message in a conversation history.
 */
export interface LLMMessage {
  readonly role: 'user' | 'assistant' | 'system'
  readonly content: string
  readonly imageDataUrls?: readonly string[]
}

/**
 * Final response object from a non-streaming LLM request.
 */
export interface LLMResponse {
  readonly content: string
  readonly model: string
  readonly usage?: {
    readonly promptTokens: number
    readonly completionTokens: number
    readonly totalTokens: number
  }
}

/**
 * Callback for receiving text chunks during a streaming response.
 * 
 * @param chunk - The new text fragment
 * @param accumulated - Full response concatenated so far
 * @param done - True if the stream is complete
 */
export type StreamCallback = (chunk: string, accumulated: string, done: boolean) => void

/**
 * Controller used by the consumer to abort an active streaming request.
 */
export interface StreamController {
  abort: () => void
}

/**
 * Interface for LLM service implementations in the main process.
 */
export interface LLMService {
  /**
   * Sends a synchronous message request and waits for completion.
   */
  sendMessage(
    messages: LLMMessage[], 
    currentCode?: string, 
    cadBackend?: CADBackend, 
    apiContext?: string
  ): Promise<LLMResponse>

  /**
   * Initiates a streaming response.
   */
  streamMessage?(
    messages: LLMMessage[],
    onChunk: StreamCallback,
    currentCode?: string,
    cadBackend?: CADBackend,
    apiContext?: string
  ): Promise<StreamController>

  /**
   * Returns true if the service implementation supports token streaming.
   */
  supportsStreaming(): boolean

  /**
   * Returns the human-friendly name of the provider.
   */
  getProviderName(): string
}
