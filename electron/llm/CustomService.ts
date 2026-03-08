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

/**
 * Implementation of LLMService for Custom (OpenAI-compatible) endpoints.
 * Targets any API that implements the OpenAI /v1/chat/completions contract.
 */
export class CustomService implements LLMService {
    private readonly config: LLMConfig

    constructor(config: LLMConfig) {
        this.config = config
    }

    /**
     * Transforms a generic LLM conversation into the format expected by the 
     * OpenAI Chat Completions API.
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
   * Helper to ensure the endpoint ends correctly.
   * If the user provides a URL that already contains /chat/completions,
   * it won't be appended again.
   */
    private getFullEndpoint(): string {
        if (!this.config.customEndpoint) {
            throw new Error('Custom endpoint URL is required for the Custom provider')
        }
        const baseUrl = this.config.customEndpoint.trim().replace(/\/+$/, '')
        if (baseUrl.endsWith('/chat/completions')) {
            return baseUrl
        }
        return `${baseUrl}/chat/completions`
    }

    /**
     * Sends a synchronous message request to the custom endpoint.
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
            loggerPrefix: 'Custom'
        })
        const payloadMessages = this.buildPayloadMessages(messages, systemContent)

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
        }
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`
        }

        try {
            const fullEndpoint = this.getFullEndpoint()
            const response = await fetchWithTimeout(fullEndpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: this.config.model,
                    messages: payloadMessages,
                    temperature: this.config.temperature ?? 0.7,
                    max_tokens: this.config.maxTokens ?? 4096,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Custom API returned ${response.status}: ${errorText}`)
            }

            const data = await response.json() as {
                choices?: Array<{ message?: { content?: unknown } }>;
                model?: string;
                usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
            }
            const choice = data.choices?.[0]
            const content = extractContent(choice?.message?.content)

            return {
                content,
                model: data.model || this.config.model,
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0,
                },
            }
        } catch (error) {
            logger.error('[Custom] sendMessage failed', error)
            throw error
        }
    }

    /**
     * Initiates a streaming response from the custom endpoint.
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

        const systemContent = buildSystemContent({
            model: this.config.model,
            cadBackend,
            currentCode,
            apiContext,
            loggerPrefix: 'Custom'
        })
        const payloadMessages = this.buildPayloadMessages(messages, systemContent)

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
        }
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`
        }

        const abortController = new AbortController()
        const controller: StreamController = {
            abort: () => abortController.abort()
        }

        let latestContent = ''

            // Background stream processing
            ; (async () => {
                let watchdogTimer: NodeJS.Timeout | null = null
                let isFirstChunk = true
                let watchdogTriggered = false

                const resetWatchdog = () => {
                    if (watchdogTimer) clearTimeout(watchdogTimer)
                    // Use user-configured timeout (seconds) or default to 60s
                    const userTimeoutMs = (this.config.customTimeout ?? 60) * 1000
                    const timeout = isFirstChunk ? Math.max(userTimeoutMs, 60000) : userTimeoutMs

                    watchdogTimer = setTimeout(() => {
                        watchdogTriggered = true
                        logger.warn(`[Custom] Stream watchdog triggered: No activity for ${timeout / 1000}s`)
                        abortController.abort()
                    }, timeout)
                }

                try {
                    const fullEndpoint = this.getFullEndpoint()
                    logger.info(`[Custom] Starting stream request to: ${fullEndpoint}`)
                    resetWatchdog()

                    const response = await fetchWithTimeout(fullEndpoint, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            model: this.config.model,
                            messages: payloadMessages,
                            temperature: this.config.temperature ?? 0.7,
                            max_tokens: this.config.maxTokens ?? 4096,
                            stream: true,
                        }),
                        signal: abortController.signal
                    })

                    logger.info(`[Custom] Response headers received: ${response.status} ${response.statusText}`)

                    if (!response.ok) {
                        const errorText = await response.text()
                        throw new Error(`Custom API returned ${response.status}: ${errorText}`)
                    }

                    const handleChunk: StreamCallback = (delta, full, done) => {
                        isFirstChunk = false
                        resetWatchdog()
                        if (done && watchdogTimer) clearTimeout(watchdogTimer)
                        latestContent = full
                        onChunk(delta, full, done)
                    }

                    await streamSseResponse(response, handleChunk, 'Custom')
                } catch (error: unknown) {
                    if (watchdogTimer) clearTimeout(watchdogTimer)

                    if (watchdogTriggered) {
                        const timeoutSec = (this.config.customTimeout ?? 60)
                        const msg = `\n\n[System Error: Stream timed out after ${timeoutSec}s of inactivity. If your local model is slow, try increasing the 'Stream Timeout' in Settings > AI.]`
                        onChunk(msg, latestContent + msg, true)
                        return
                    }

                    if (error instanceof DOMException && error.name === 'AbortError') {
                        logger.info('[Custom] Stream aborted')
                        return
                    }

                    logger.error('[Custom] Stream error', error)
                    const errorMessage = error instanceof Error ? error.message : 'Unknown custom provider error'
                    onChunk(`\n\n[System Error: ${errorMessage}]`, latestContent, true)
                } finally {
                    if (watchdogTimer) clearTimeout(watchdogTimer)
                }
            })()

        return controller
    }

    /**
     * Custom endpoints follow OpenAI SSE standard.
     */
    supportsStreaming(): boolean {
        return true
    }

    /**
     * Display name for the provider.
     */
    getProviderName(): string {
        return 'Custom (OpenAI-compatible)'
    }
}
