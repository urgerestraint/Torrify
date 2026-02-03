import { describe, it, expect, vi } from 'vitest'
import {
  buildSystemContent,
  buildMessageContent,
  extractContent,
  streamSseResponse
} from '../utils'
import type { LLMMessage } from '../types'

vi.mock('../prompts', () => ({
  getSystemPrompt: vi.fn((_backend: string, _code?: string, _ctx?: string) => 'mock system prompt'),
  getSystemPromptBlocks: vi.fn(() => ({
    staticBlocks: ['block1'],
    dynamicBlock: null
  }))
}))

describe('buildSystemContent', () => {
  it('returns string for non-cache-capable model', () => {
    const result = buildSystemContent({
      model: 'gpt-4',
      cadBackend: 'openscad'
    })
    expect(typeof result).toBe('string')
    expect(result).toBe('mock system prompt')
  })

  it('returns array of parts for cache-capable model', () => {
    const result = buildSystemContent({
      model: 'anthropic/claude-3',
      cadBackend: 'openscad'
    })
    expect(Array.isArray(result)).toBe(true)
    expect((result as Array<{ type: string; text: string }>).length).toBeGreaterThan(0)
    expect((result as Array<{ type: string; text: string }>)[0]).toHaveProperty('type', 'text')
  })
})

describe('buildMessageContent', () => {
  it('returns string when no images', () => {
    const message: LLMMessage = { role: 'user', content: 'Hello' }
    expect(buildMessageContent(message)).toBe('Hello')
  })

  it('returns array with text and image parts when images present', () => {
    const message: LLMMessage = {
      role: 'user',
      content: 'What is this?',
      imageDataUrls: ['data:image/png;base64,abc']
    }
    const result = buildMessageContent(message)
    expect(Array.isArray(result)).toBe(true)
    expect((result as Array<{ type: string }>).length).toBe(2)
    expect((result as Array<{ type: string }>)[0].type).toBe('text')
    expect((result as Array<{ type: string; image_url?: { url: string } }>)[1].type).toBe('image_url')
  })
})

describe('extractContent', () => {
  it('returns string as-is', () => {
    expect(extractContent('hello')).toBe('hello')
  })

  it('extracts text from array of parts', () => {
    const content = [
      { type: 'text', text: 'Hello ' },
      { type: 'text', text: 'world' }
    ]
    expect(extractContent(content)).toBe('Hello world')
  })

  it('returns empty string for non-string non-array', () => {
    expect(extractContent(null)).toBe('')
    expect(extractContent(42)).toBe('')
  })
})

describe('streamSseResponse', () => {
  it('throws when response body is null', async () => {
    const res = { body: null } as Response
    await expect(streamSseResponse(res, vi.fn())).rejects.toThrow('Response body is not available')
  })

  it('calls onChunk with parsed delta from SSE data', async () => {
    const chunks = [
      new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n'),
      new TextEncoder().encode('data: [DONE]\n\n')
    ]
    let i = 0
    const stream = new ReadableStream({
      pull(controller) {
        if (i < chunks.length) {
          controller.enqueue(chunks[i++])
        } else {
          controller.close()
        }
      }
    })
    const res = { body: stream } as Response
    const onChunk = vi.fn()
    await streamSseResponse(res, onChunk)
    expect(onChunk).toHaveBeenCalled()
  })
})
