import type { CADBackend, LLMMessage, StreamCallback } from './types'
import { getSystemPrompt, getSystemPromptBlocks } from './prompts'
import { logger } from '../utils/logger'
import { FETCH_TIMEOUT_MS } from '../constants'

export type MessageContentPart = { type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }
export type MessageContent = string | MessageContentPart[]

export type SystemContentPart = { type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }
export type SystemMessageContent = string | SystemContentPart[]

const CACHE_CAPABLE_MODEL_PREFIXES = [
  'anthropic/',
  'google/',
] as const

const supportsPromptCaching = (model: string): boolean => {
  const normalized = model.toLowerCase().trim()
  return CACHE_CAPABLE_MODEL_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

export const buildSystemContent = ({
  model,
  cadBackend,
  currentCode,
  apiContext,
  loggerPrefix
}: {
  model: string
  cadBackend: CADBackend
  currentCode?: string
  apiContext?: string
  loggerPrefix?: string
}): SystemMessageContent => {
  if (!supportsPromptCaching(model)) {
    return getSystemPrompt(cadBackend, currentCode, apiContext)
  }

  if (loggerPrefix) {
    logger.debug(`[${loggerPrefix}] Prompt caching enabled for model:`, model)
  }

  const { staticBlocks, dynamicBlock } = getSystemPromptBlocks(cadBackend, currentCode, apiContext)
  const parts: SystemContentPart[] = []
  for (const block of staticBlocks) {
    parts.push({ type: 'text', text: block, cache_control: { type: 'ephemeral' } })
  }
  if (dynamicBlock) {
    parts.push({ type: 'text', text: dynamicBlock })
  }
  return parts
}

export const buildMessageContent = (message: LLMMessage): MessageContent => {
  const imageDataUrls = message.imageDataUrls ?? []
  if (imageDataUrls.length === 0) {
    return message.content
  }

  const parts: MessageContentPart[] = []
  if (message.content) {
    parts.push({ type: 'text', text: message.content })
  }
  for (const url of imageDataUrls) {
    parts.push({ type: 'image_url', image_url: { url } })
  }
  return parts
}

export const extractContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim()
  }
  return ''
}

export const streamSseResponse = async (
  response: Response,
  onChunk: StreamCallback,
  loggerPrefix?: string
): Promise<void> => {
  if (!response.body) {
    throw new Error('Response body is not available for streaming')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''
  let buffer = ''

  const processLines = (lines: string[]) => {
    for (const line of lines) {
      if (!line.trim()) continue

      // Split by 'data:' prefix in case multiple events are merged into one line
      const segments = line.split(/(?=data:)/)

      for (const segment of segments) {
        const trimmedSegment = segment.trim()
        if (!trimmedSegment || !trimmedSegment.startsWith('data:')) {
          logger.debug(`${loggerPrefix ? `[${loggerPrefix}] ` : ''}Non-conforming line ignored:`, trimmedSegment)
          continue
        }

        const data = trimmedSegment.replace(/^data:\s*/, '')
        if (data === '[DONE]') {
          logger.debug(`${loggerPrefix ? `[${loggerPrefix}] ` : ''}SSE [DONE]`, { accumulatedLength: accumulated.length })
          onChunk('', accumulated, true)
          return
        }

        try {
          const parsed = JSON.parse(data)
          const delta = parsed?.choices?.[0]?.delta?.content
          if (delta) {
            accumulated += delta
            onChunk(delta, accumulated, false)
          }
        } catch {
          logger.warn(`${loggerPrefix ? `[${loggerPrefix}] ` : ''}Failed to parse SSE chunk:`, data)
        }
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      if (buffer.trim()) {
        processLines([buffer])
      }
      logger.debug(`${loggerPrefix ? `[${loggerPrefix}] ` : ''}SSE stream reader done`, { accumulatedLength: accumulated.length })
      onChunk('', accumulated, true)
      break
    }

    const chunk = decoder.decode(value, { stream: true })
    if (loggerPrefix) {
      logger.debug(`[${loggerPrefix}] Raw chunk received (${value.length} bytes)`)
    }

    buffer += chunk
    const lines = buffer.split(/\r\n|\r|\n/)
    buffer = lines.pop() || ''

    processLines(lines)
  }
}

export const fetchWithTimeout = async (
  input: string | URL,
  init: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> => {
  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs)

  const signals: AbortSignal[] = [timeoutController.signal]
  if (init.signal) {
    signals.push(init.signal)
  }

  // Modern AbortSignal.any (Chrome 116+, Node 20+)
  // Falls back to a manual listener-based implementation for older environments/test runners.
  let combinedSignal: AbortSignal
  if (typeof (AbortSignal as any).any === 'function') {
    combinedSignal = (AbortSignal as any).any(signals)
  } else {
    const controller = new AbortController()
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason)
        break
      }
      signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
    }
    combinedSignal = controller.signal
  }

  try {
    const response = await fetch(input, {
      ...init,
      signal: combinedSignal
    })
    return response
  } catch (error) {
    const errorName =
      typeof error === 'object' && error !== null && 'name' in error
        ? String((error as { name?: unknown }).name)
        : ''
    if (
      timeoutController.signal.aborted &&
      errorName === 'AbortError'
    ) {
      throw new Error(`Request timed out after ${Math.ceil(timeoutMs / 1000)} seconds`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
