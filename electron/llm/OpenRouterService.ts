import type { LLMService, LLMMessage, LLMResponse, LLMConfig, CADBackend, StreamCallback, StreamController } from './types'
import {
  buildMessageContent,
  buildSystemContent,
  extractContent,
  fetchWithTimeout,
  streamSseResponse,
  type MessageContent,
  type SystemMessageContent
} from './utils'
import { logger } from '../utils/logger'

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

function getOpenRouterApiKey(): string | null {
  return process.env.OPENROUTER_API_KEY?.trim() || null
}

export class OpenRouterService implements LLMService {
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

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
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }
    if (!messages.some(m => m.role === 'user')) {
      throw new Error('At least one user message is required')
    }

    const apiKey = getOpenRouterApiKey()
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

    const response = await fetchWithTimeout(OPENROUTER_ENDPOINT, {
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
        max_tokens: this.config.maxTokens ?? 128000
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

    ;(async () => {
      try {
        const apiKey = getOpenRouterApiKey()
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

        const response = await fetchWithTimeout(OPENROUTER_ENDPOINT, {
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
            max_tokens: this.config.maxTokens ?? 128000,
            stream: true
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
