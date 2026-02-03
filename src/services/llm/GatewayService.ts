import type { LLMService, LLMMessage, LLMResponse, LLMConfig, CADBackend, StreamCallback, StreamController } from './types'
import { buildMessageContent, buildSystemContent, extractContent, streamSseResponse, type MessageContent, type SystemMessageContent } from './utils'
import { logger } from '../../utils/logger'

/** Production gateway URL; not exposed in UI. */
const GATEWAY_BASE_URL = 'https://the-gatekeeper-production.up.railway.app'

function getGatewayEndpoint(): string {
  const base = GATEWAY_BASE_URL.replace(/\/$/, '')
  return `${base}/api/chat`
}

export class GatewayService implements LLMService {
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  private useElectronGateway(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI?.gatewayRequest
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

    const payload = {
      model: this.config.model,
      messages: payloadMessages,
      stream: false,
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 2048
    }

    let data: unknown
    if (this.useElectronGateway()) {
      const result = await window.electronAPI.gatewayRequest({
        licenseKey,
        body: payload
      })
      if (!result.ok) {
        throw new Error(`Gateway error: ${result.errorText || result.statusText}`)
      }
      data = result.data
    } else {
      const response = await fetch(endpoint, {
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

      data = await response.json()
    }
    const dataObj = data as Record<string, unknown> | null | undefined
    const message = dataObj?.choices && Array.isArray(dataObj.choices)
      ? (dataObj.choices[0] as Record<string, unknown>)?.message
      : undefined
    if (!message || typeof message !== 'object' || !('content' in message)) {
      throw new Error('Invalid response format from gateway')
    }
    const content = extractContent((message as { content?: unknown }).content)
    const usage = dataObj?.usage && typeof dataObj.usage === 'object' && dataObj.usage !== null
      ? (dataObj.usage as Record<string, number>)
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

    ;(async () => {
      try {
        if (this.useElectronGateway()) {
          const response = await this.sendMessage(messages, currentCode, cadBackend, apiContext)
          latestContent = response.content
          onChunk(response.content, response.content, true)
          return
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

        const response = await fetch(endpoint, {
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
            max_tokens: this.config.maxTokens ?? 2048
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
        onChunk(`\n\n[Error: ${errorMessage}]`, latestContent, true)
      }
    })()

    return controller
  }

  supportsStreaming(): boolean {
    return !this.useElectronGateway()
  }

  getProviderName(): string {
    return 'PRO'
  }
}
