import type { LLMService, LLMMessage, LLMResponse, LLMConfig, CADBackend, StreamCallback, StreamController } from './types'
import { buildMessageContent, buildSystemContent, extractContent, streamSseResponse, type MessageContent, type SystemMessageContent } from './utils'
import { logger } from '../../utils/logger'

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

export class OpenRouterService implements LLMService {
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  /**
   * Build the messages payload for OpenRouter API.
   * System content may be a string (non-cache path) or array of parts with cache_control (cache path).
   */
  private buildPayloadMessages(messages: LLMMessage[], systemContent: SystemMessageContent): Array<{ role: string; content: MessageContent }> {
    return [
      { role: 'system', content: systemContent },
      ...messages.map((message) => ({
        role: message.role,
        content: buildMessageContent(message)
      }))
    ]
  }

  async sendMessage(messages: LLMMessage[], currentCode?: string, cadBackend: CADBackend = 'openscad', apiContext?: string): Promise<LLMResponse> {
    // Validate input
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }
    if (!messages.some(m => m.role === 'user')) {
      throw new Error('At least one user message is required')
    }

    const apiKey = await window.electronAPI.getOpenRouterKey()
    if (!apiKey) {
      throw new Error('OpenRouter API key is not set. Restart the app after setting OPENROUTER_API_KEY.')
    }

    const systemContent = buildSystemContent({
      model: this.config.model,
      cadBackend,
      currentCode,
      apiContext,
      loggerPrefix: 'OpenRouter'
    })
    const payloadMessages = this.buildPayloadMessages(messages, systemContent)

    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Torrify'
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: payloadMessages,
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens ?? 2048
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter error: ${errorText || response.statusText}`)
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
    let latestContent = ''

    ;(async () => {
      try {
        const apiKey = await window.electronAPI.getOpenRouterKey()
        if (!apiKey) {
          throw new Error('OpenRouter API key is not set. Restart the app after setting OPENROUTER_API_KEY.')
        }

        const systemContent = buildSystemContent({
          model: this.config.model,
          cadBackend,
          currentCode,
          apiContext,
          loggerPrefix: 'OpenRouter'
        })
        const payloadMessages = this.buildPayloadMessages(messages, systemContent)

        const response = await fetch(OPENROUTER_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'Torrify'
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: payloadMessages,
            temperature: this.config.temperature ?? 0.7,
            max_tokens: this.config.maxTokens ?? 2048,
            stream: true  // Enable streaming
          }),
          signal: abortController.signal
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`OpenRouter error: ${errorText || response.statusText}`)
        }

        const handleChunk: StreamCallback = (delta, full, done) => {
          latestContent = full
          onChunk(delta, full, done)
        }

        await streamSseResponse(response, handleChunk, 'OpenRouter')
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Streaming was aborted - don't report as error
          return
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('OpenRouter streaming error', error)
        onChunk(`\n\n[Error: ${errorMessage}]`, latestContent, true)
      }
    })()

    return controller
  }

  supportsStreaming(): boolean {
    return true
  }

  getProviderName(): string {
    return 'OpenRouter'
  }
}

