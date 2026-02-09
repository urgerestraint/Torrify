import type { LLMService, LLMMessage, LLMResponse, LLMConfig, CADBackend, StreamCallback, StreamController } from './types'
import { buildMessageContent, buildSystemContent, extractContent, streamSseResponse, type MessageContent, type SystemMessageContent } from './utils'
import { logger } from '../utils/logger'

/** Standard OpenAI chat completions endpoint */
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

/**
 * Implementation of LLMService for OpenAI (GPT) models.
 */
export class OpenAIService implements LLMService {
  private readonly config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  /**
   * Transforms a generic LLM conversation into the format expected by the 
   * OpenAI Chat Completions API.
   * 
   * @param messages - Application-level message objects
   * @param systemContent - The formatted system prompt
   * @returns Array of OpenAI-compatible message objects
   */
  private buildPayloadMessages(messages: LLMMessage[], systemContent: SystemMessageContent): Array<{ role: string; content: MessageContent }> {
    const systemContentStr = typeof systemContent === 'string'
      ? systemContent
      : systemContent.map((part) => part.text).join('')
      
    return [
      { role: 'system', content: systemContentStr },
      ...messages.map((message) => ({
        role: message.role,
        content: buildMessageContent(message)
      }))
    ]
  }

  /**
   * Sends a synchronous message request to OpenAI.
   * 
   * @param messages - Conversation history
   * @param currentCode - Optional context code from the editor
   * @param cadBackend - The active CAD backend context
   * @param apiContext - Documentation snippets for the active backend
   * @returns Final completion response and usage metrics
   */
  async sendMessage(
    messages: LLMMessage[], 
    currentCode?: string, 
    cadBackend: CADBackend = 'openscad', 
    apiContext?: string
  ): Promise<LLMResponse> {
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }
    if (!messages.some(m => m.role === 'user')) {
      throw new Error('At least one user message is required')
    }

    const systemContent = buildSystemContent({
      model: this.config.model,
      cadBackend,
      currentCode,
      apiContext,
      loggerPrefix: 'OpenAI'
    })
    const payloadMessages = this.buildPayloadMessages(messages, systemContent)

    const response = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: payloadMessages,
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 128000,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI error: ${errorText || response.statusText}`)
    }

    const data = await response.json()
    const content = extractContent(data?.choices?.[0]?.message?.content)

    return {
      content,
      model: this.config.model,
      usage: {
        promptTokens: data?.usage?.prompt_tokens ?? 0,
        completionTokens: data?.usage?.completion_tokens ?? 0,
        totalTokens: data?.usage?.total_tokens ?? 0,
      }
    }
  }

  /**
   * Initiates a streaming response from OpenAI.
   * 
   * @param messages - Conversation history
   * @param onChunk - Callback for each text fragment
   * @param currentCode - Optional context code
   * @param cadBackend - The active CAD backend context
   * @param apiContext - Documentation snippets
   * @returns A controller for aborting the active stream
   */
  async streamMessage(
    messages: LLMMessage[],
    onChunk: StreamCallback,
    currentCode?: string,
    cadBackend: CADBackend = 'openscad',
    apiContext?: string
  ): Promise<StreamController> {
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

    let latestContent = ''

    // Background stream processing
    ;(async () => {
      try {
        const systemContent = buildSystemContent({
          model: this.config.model,
          cadBackend,
          currentCode,
          apiContext,
          loggerPrefix: 'OpenAI'
        })
        const payloadMessages = this.buildPayloadMessages(messages, systemContent)

        const response = await fetch(OPENAI_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: payloadMessages,
            temperature: this.config.temperature ?? 0.7,
            max_tokens: this.config.maxTokens ?? 128000,
            stream: true,
          }),
          signal: abortController.signal
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`OpenAI error: ${errorText || response.statusText}`)
        }

        const handleChunk: StreamCallback = (delta, full, done) => {
          latestContent = full
          onChunk(delta, full, done)
        }

        await streamSseResponse(response, handleChunk, 'OpenAI')
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('OpenAI streaming error', error)
        onChunk(`\n\n[Error: ${errorMessage}]`, latestContent, true)
      }
    })()

    return controller
  }

  /**
   * Standard completion-style models support streaming via SSE.
   */
  supportsStreaming(): boolean {
    return true
  }

  /**
   * Display name for the provider.
   */
  getProviderName(): string {
    return 'OpenAI (GPT)'
  }
}
