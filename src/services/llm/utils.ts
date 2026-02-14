import type { CADBackend, LLMMessage, StreamCallback } from './types'
import { getSystemPrompt, getSystemPromptBlocks } from './prompts'
import { logger } from '../../utils/logger'

/**
 * Represents a single part of a multi-modal message (text or image).
 */
export type MessageContentPart =
  | {
      readonly type: 'text'
      readonly text: string
    }
  | {
      readonly type: 'image_url'
      readonly image_url: { readonly url: string }
    }

/**
 * The content of an LLM message, either a raw string or an array of parts.
 */
export type MessageContent = string | readonly MessageContentPart[]

/**
 * Represents a part of a system message, potentially with cache control.
 */
export type SystemContentPart = { 
  readonly type: 'text'
  readonly text: string
  readonly cache_control?: { readonly type: 'ephemeral' } 
}

/**
 * The content of a system prompt, potentially optimized for caching.
 */
export type SystemMessageContent = string | readonly SystemContentPart[]

/**
 * Provider-specific prefixes for models that support prompt caching.
 */
const CACHE_CAPABLE_MODEL_PREFIXES: readonly string[] = [
  'anthropic/',
  'google/',
] as const

function getTextPart(part: unknown): string {
  if (
    part !== null &&
    typeof part === 'object' &&
    'text' in part &&
    typeof (part as { text: unknown }).text === 'string'
  ) {
    return (part as { text: string }).text
  }
  return ''
}

function getSseDelta(data: string): string | null {
  try {
    const parsed = JSON.parse(data) as {
      choices?: ReadonlyArray<{
        readonly delta?: {
          readonly content?: unknown
        }
      }>
    }
    const delta = parsed.choices?.[0]?.delta?.content
    return typeof delta === 'string' ? delta : null
  } catch {
    return null
  }
}

/**
 * Checks if the specified model identifier supports prompt caching features.
 * 
 * @param model - The model identifier string
 * @returns True if the model supports prompt caching
 */
const supportsPromptCaching = (model: string): boolean => {
  const normalized = model.toLowerCase().trim()
  return CACHE_CAPABLE_MODEL_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

/**
 * Constructs the system prompt content, potentially using multi-part caching blocks.
 * 
 * @param params - Construction parameters including model, backend, and context
 * @returns The structured system message content
 */
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
    parts.push({ 
      type: 'text', 
      text: block, 
      cache_control: { type: 'ephemeral' } 
    })
  }

  if (dynamicBlock) {
    parts.push({ type: 'text', text: dynamicBlock })
  }

  return parts
}

/**
 * Transforms an internal LLMMessage into the format expected by multi-modal providers.
 * 
 * @param message - The internal message object
 * @returns Structured content part array or a raw string
 */
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

/**
 * Safely extracts text content from various LLM response structures.
 * 
 * @param content - The raw content value from an LLM response
 * @returns The extracted string content, or an empty string if invalid
 */
export const extractContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content
  }
  if (Array.isArray(content)) {
    return content
      .map(getTextPart)
      .join('')
      .trim()
  }
  return ''
}

/**
 * Streams a Server-Sent Events (SSE) response and parses chat completion chunks.
 * Specifically handles the OpenAI/OpenRouter standard data format.
 * 
 * @param response - The Fetch API Response object
 * @param onChunk - Callback for each received text fragment
 * @param loggerPrefix - Optional prefix for debug log messages
 * @throws {Error} If the response body is not readable
 */
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

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        if (loggerPrefix) {
          logger.debug(`[${loggerPrefix}] SSE stream reader done`, { 
            accumulatedLength: accumulated.length 
          })
        }
        onChunk('', accumulated, true)
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || trimmedLine.startsWith(':')) {
          continue
        }
        
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6)
          
          if (data === '[DONE]') {
            if (loggerPrefix) {
              logger.debug(`[${loggerPrefix}] SSE [DONE]`, { 
                accumulatedLength: accumulated.length 
              })
            }
            onChunk('', accumulated, true)
            return
          }

          const delta = getSseDelta(data)
          if (delta !== null) {
            accumulated += delta
            onChunk(delta, accumulated, false)
          } else {
            if (loggerPrefix) {
              logger.warn(`[${loggerPrefix}] Failed to parse SSE chunk:`, data)
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error(`${loggerPrefix ? `[${loggerPrefix}] ` : ''}SSE streaming error`, error)
    throw error
  } finally {
    reader.releaseLock()
  }
}
