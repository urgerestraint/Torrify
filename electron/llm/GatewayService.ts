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
import { GATEWAY_BASE_URL } from '../constants'

const GATEWAY_CONTEXT_WINDOW_TOKENS = 128000
const TOKEN_SAFETY_MARGIN = 2048
const MIN_COMPLETION_TOKENS = 256

function getGatewayEndpoint(): string {
  const base = GATEWAY_BASE_URL.replace(/\/$/, '')
  return `${base}/api/chat`
}

function estimateTokensFromText(text: string): number {
  if (!text) {
    return 0
  }
  // Heuristic approximation for GPT-like tokenization.
  return Math.ceil(text.length / 4)
}

function estimateTokensFromContent(content: MessageContent | SystemMessageContent): number {
  if (typeof content === 'string') {
    return estimateTokensFromText(content)
  }

  let total = 0
  for (const part of content) {
    if (typeof part.text === 'string') {
      total += estimateTokensFromText(part.text)
    }
    if ('image_url' in part && part.image_url?.url) {
      // Keep a fixed allowance for image parts to avoid optimistic budgeting.
      total += 512
    }
  }
  return total
}

export class GatewayService implements LLMService {
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

  private getMaxOutputTokens(payloadMessages: Array<{ role: string; content: MessageContent }>): number {
    const configuredMax = this.config.maxTokens ?? GATEWAY_CONTEXT_WINDOW_TOKENS
    const estimatedPromptTokens = payloadMessages.reduce((sum, message) => {
      return sum + estimateTokensFromContent(message.content)
    }, 0)

    const available = GATEWAY_CONTEXT_WINDOW_TOKENS - estimatedPromptTokens - TOKEN_SAFETY_MARGIN
    if (available < MIN_COMPLETION_TOKENS) {
      throw new Error('Prompt is too large for gateway context window. Reduce context/code size and retry.')
    }

    const bounded = Math.max(MIN_COMPLETION_TOKENS, Math.min(configuredMax, available))
    if (bounded < configuredMax) {
      logger.info('[Gateway] Reduced max_tokens to fit context window', {
        configuredMax,
        bounded,
        estimatedPromptTokens
      })
    }
    return bounded
  }

  async sendMessage(messages: LLMMessage[], currentCode?: string, cadBackend: CADBackend = 'openscad', apiContext?: string): Promise<LLMResponse> {
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }
    if (!messages.some(m => m.role === 'user')) {
      throw new Error('At least one user message is required')
    }

    const licenseKey = (this.config.gatewayLicenseKey ?? '').trim()
    if (!licenseKey) {
      throw new Error('Gateway license key is not set. Add it in Settings.')
    }

    const endpoint = getGatewayEndpoint()
    const systemContent = buildSystemContent({
      model: this.config.model,
      cadBackend,
      currentCode,
      apiContext,
      loggerPrefix: 'Gateway'
    })
    const payloadMessages = this.buildPayloadMessages(messages, systemContent)
    const maxOutputTokens = this.getMaxOutputTokens(payloadMessages)

    const payload = {
      model: this.config.model,
      messages: payloadMessages,
      stream: false,
      temperature: this.config.temperature ?? 0.7,
      max_tokens: maxOutputTokens
    }

    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-License-Key': licenseKey
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gateway error: ${errorText || response.statusText}`)
    }

    const data = await response.json() as Record<string, unknown> | null | undefined
    const message = data?.choices && Array.isArray(data.choices)
      ? (data.choices[0] as Record<string, unknown>)?.message
      : undefined
    if (!message || typeof message !== 'object' || !('content' in message)) {
      throw new Error('Invalid response format from gateway')
    }
    const content = extractContent((message as { content?: unknown }).content)
    const usage = data?.usage && typeof data.usage === 'object' && data.usage !== null
      ? (data.usage as Record<string, number>)
      : {}

    return {
      content,
      model: this.config.model,
      usage: {
        promptTokens: usage.prompt_tokens ?? 0,
        completionTokens: usage.completion_tokens ?? 0,
        totalTokens: usage.total_tokens ?? 0,
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

    const licenseKey = (this.config.gatewayLicenseKey ?? '').trim()
    if (!licenseKey) {
      throw new Error('Gateway license key is not set. Add it in Settings.')
    }

    const abortController = new AbortController()
    const controller: StreamController = {
      abort: () => abortController.abort()
    }

    let latestContent = ''

      ; (async () => {
        try {
          const endpoint = getGatewayEndpoint()
          const systemContent = buildSystemContent({
            model: this.config.model,
            cadBackend,
            currentCode,
            apiContext,
            loggerPrefix: 'Gateway'
          })
          const payloadMessages = this.buildPayloadMessages(messages, systemContent)
          const maxOutputTokens = this.getMaxOutputTokens(payloadMessages)

          const response = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-License-Key': licenseKey
            },
            body: JSON.stringify({
              model: this.config.model,
              messages: payloadMessages,
              stream: true,
              temperature: this.config.temperature ?? 0.7,
              max_tokens: maxOutputTokens
            }),
            signal: abortController.signal
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Gateway error: ${errorText || response.statusText}`)
          }

          const handleChunk: StreamCallback = (delta, full, done) => {
            latestContent = full
            onChunk(delta, full, done)
          }

          await streamSseResponse(response, handleChunk, 'Gateway')
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            return
          }
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          logger.error('Gateway streaming error', error)
          latestContent += `\n\n[Error: ${errorMessage}]`
          onChunk(`\n\n[Error: ${errorMessage}]`, latestContent, true)
        }
      })()

    return controller
  }

  supportsStreaming(): boolean {
    return true
  }

  getProviderName(): string {
    return 'PRO'
  }
}
