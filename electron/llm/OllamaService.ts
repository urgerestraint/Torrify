import type { LLMService, LLMMessage, LLMResponse, LLMConfig, CADBackend, StreamCallback, StreamController } from './types'
import { getSystemPrompt } from './prompts'
import { fetchWithTimeout } from './utils'
import { logger } from '../utils/logger'

const DEFAULT_OLLAMA_ENDPOINT = 'http://127.0.0.1:11434'

export class OllamaService implements LLMService {
  private config: LLMConfig
  private endpoint: string

  constructor(config: LLMConfig) {
    this.config = config
    this.endpoint = config.customEndpoint || DEFAULT_OLLAMA_ENDPOINT
  }

  private buildPayloadMessages(messages: LLMMessage[], systemPrompt: string): Array<{ role: string; content: string }> {
    const payloadMessages: Array<{ role: string; content: string }> = []
    payloadMessages.push({ role: 'system', content: systemPrompt })

    for (const message of messages) {
      let content = message.content
      if (message.imageDataUrls && message.imageDataUrls.length > 0) {
        content += `\n\n[Note: ${message.imageDataUrls.length} image(s) were attached but Ollama doesn't support vision in this implementation]`
      }
      payloadMessages.push({ role: message.role, content })
    }

    return payloadMessages
  }

  async sendMessage(messages: LLMMessage[], currentCode?: string, cadBackend: CADBackend = 'openscad', apiContext?: string): Promise<LLMResponse> {
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }
    if (!messages.some(m => m.role === 'user')) {
      throw new Error('At least one user message is required')
    }

    const systemPrompt = getSystemPrompt(cadBackend, currentCode, apiContext)
    const payloadMessages = this.buildPayloadMessages(messages, systemPrompt)

    const response = await fetchWithTimeout(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages: payloadMessages,
        stream: false,
        options: {
          temperature: this.config.temperature ?? 0.7,
          num_predict: this.config.maxTokens ?? 128000,
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
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
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

      ; (async () => {
        let accumulated = ''
        let watchdogTimer: NodeJS.Timeout | null = null
        let isFirstChunk = true
        let watchdogTriggered = false

        const resetWatchdog = () => {
          if (watchdogTimer) clearTimeout(watchdogTimer)
          const userTimeoutMs = (this.config.customTimeout ?? 60) * 1000
          const timeout = isFirstChunk ? Math.max(userTimeoutMs, 60000) : userTimeoutMs

          watchdogTimer = setTimeout(() => {
            watchdogTriggered = true
            logger.warn(`[Ollama] Stream watchdog triggered: No activity for ${timeout / 1000}s`)
            abortController.abort()
          }, timeout)
        }

        try {
          const systemPrompt = getSystemPrompt(cadBackend, currentCode, apiContext)
          const payloadMessages = this.buildPayloadMessages(messages, systemPrompt)

          resetWatchdog()
          const response = await fetchWithTimeout(`${this.endpoint}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: this.config.model,
              messages: payloadMessages,
              stream: true,
              options: {
                temperature: this.config.temperature ?? 0.7,
                num_predict: this.config.maxTokens ?? 128000,
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

          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              if (watchdogTimer) clearTimeout(watchdogTimer)
              onChunk('', accumulated, true)
              break
            }

            isFirstChunk = false
            resetWatchdog()
            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(line => line.trim())

            for (const line of lines) {
              try {
                const parsed = JSON.parse(line)
                if (parsed.done === true) {
                  if (watchdogTimer) clearTimeout(watchdogTimer)
                  onChunk('', accumulated, true)
                  return
                }
                const delta = parsed?.message?.content || ''
                if (delta) {
                  accumulated += delta
                  onChunk(delta, accumulated, false)
                }
              } catch (e) {
                logger.warn('Failed to parse Ollama chunk:', line, e)
              }
            }
          }
        } catch (error: unknown) {
          if (watchdogTimer) clearTimeout(watchdogTimer)

          if (watchdogTriggered) {
            const timeoutSec = (this.config.customTimeout ?? 60)
            const msg = `\n\n[System Error: Ollama stream timed out after ${timeoutSec}s of inactivity. If your local model is slow, try increasing the 'Stream Timeout' in Settings > AI.]`
            onChunk(msg, accumulated + msg, true)
            return
          }

          if (error instanceof Error && error.name === 'AbortError') {
            return
          }
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          logger.error('Ollama streaming error', error)
          accumulated += `\n\n[System Error: ${errorMessage}]`
          onChunk(`\n\n[System Error: ${errorMessage}]`, accumulated, true)
        } finally {
          if (watchdogTimer) clearTimeout(watchdogTimer)
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
