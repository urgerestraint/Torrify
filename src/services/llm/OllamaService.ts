import type { LLMService, LLMMessage, LLMResponse, LLMConfig, CADBackend, StreamCallback, StreamController } from './types'
import { getSystemPrompt } from './prompts'
import { logger } from '../../utils/logger'

// Default Ollama endpoint (can be overridden via customEndpoint)
// Using 127.0.0.1 instead of localhost to avoid IPv6 connection issues on Windows
const DEFAULT_OLLAMA_ENDPOINT = 'http://127.0.0.1:11434'

/**
 * OllamaService - Integration with local Ollama models
 * 
 * Ollama runs a local HTTP API server. This service connects to it
 * to use locally-running LLM models without requiring external API keys.
 */
export class OllamaService implements LLMService {
  private config: LLMConfig
  private endpoint: string

  constructor(config: LLMConfig) {
    this.config = config
    // Use customEndpoint if provided, otherwise use default Ollama endpoint
    this.endpoint = config.customEndpoint || DEFAULT_OLLAMA_ENDPOINT
  }

  /**
   * Build the messages payload for Ollama API
   * Ollama uses OpenAI-compatible message format
   */
  private buildPayloadMessages(messages: LLMMessage[], systemPrompt: string): Array<{ role: string; content: string }> {
    // Ollama doesn't support images in the same way, so we'll just use text content
    // For now, we'll include image data URLs as text descriptions if present
    const payloadMessages: Array<{ role: string; content: string }> = []
    
    // Add system prompt as first message
    payloadMessages.push({
      role: 'system',
      content: systemPrompt
    })

    // Add conversation messages
    for (const message of messages) {
      let content = message.content
      
      // If there are images, append a note about them (Ollama doesn't support vision in standard API)
      if (message.imageDataUrls && message.imageDataUrls.length > 0) {
        content += `\n\n[Note: ${message.imageDataUrls.length} image(s) were attached but Ollama doesn't support vision in this implementation]`
      }
      
      payloadMessages.push({
        role: message.role,
        content: content
      })
    }

    return payloadMessages
  }

  async sendMessage(messages: LLMMessage[], currentCode?: string, cadBackend: CADBackend = 'openscad', apiContext?: string): Promise<LLMResponse> {
    // Validate input
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }
    if (!messages.some(m => m.role === 'user')) {
      throw new Error('At least one user message is required')
    }

    const systemPrompt = getSystemPrompt(cadBackend, currentCode, apiContext)
    const payloadMessages = this.buildPayloadMessages(messages, systemPrompt)

    const response = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: payloadMessages,
        stream: false,
        options: {
          temperature: this.config.temperature ?? 0.7,
          num_predict: this.config.maxTokens ?? 2048,
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ollama API error: ${errorText || response.statusText}`)
    }

    const data = await response.json()
    const content = data?.message?.content || ''

    return {
      content,
      model: this.config.model,
      usage: {
        // Ollama doesn't provide token counts in the response
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      }
    }
  }

  async streamMessage(
    messages: LLMMessage[],
    onChunk: StreamCallback,
    currentCode?: string,
    cadBackend: CADBackend = 'openscad',
    apiContext?: string
  ): Promise<StreamController> {
    // Validate input
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }
    if (!messages.some(m => m.role === 'user')) {
      throw new Error('At least one user message is required')
    }

    const abortController = new AbortController()
    const controller: StreamController = {
      abort: () => abortController.abort()
    }

    // Start streaming in an async context
    ;(async () => {
      try {
        const systemPrompt = getSystemPrompt(cadBackend, currentCode, apiContext)
        const payloadMessages = this.buildPayloadMessages(messages, systemPrompt)

        const response = await fetch(`${this.endpoint}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: payloadMessages,
            stream: true,  // Enable streaming
            options: {
              temperature: this.config.temperature ?? 0.7,
              num_predict: this.config.maxTokens ?? 2048,
            }
          }),
          signal: abortController.signal
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Ollama API error: ${errorText || response.statusText}`)
        }

        if (!response.body) {
          throw new Error('Response body is not available for streaming')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            onChunk('', accumulated, true)
            break
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true })
          
          // Ollama streams JSON objects, one per line
          const lines = chunk.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line)
              
              // Check if this is the final chunk
              if (parsed.done === true) {
                onChunk('', accumulated, true)
                return
              }
              
              // Extract content from the message
              const delta = parsed?.message?.content || ''
              
              if (delta) {
                accumulated += delta
                onChunk(delta, accumulated, false)
              }
            } catch (e) {
              // Skip malformed JSON chunks
              logger.warn('Failed to parse Ollama chunk:', line, e)
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Streaming was aborted - don't report as error
          return
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('Ollama streaming error', error)
        onChunk(`\n\n[Error: ${errorMessage}]`, '', true)
      }
    })()

    return controller
  }

  supportsStreaming(): boolean {
    return true
  }

  getProviderName(): string {
    return 'Ollama (Local)'
  }
}
