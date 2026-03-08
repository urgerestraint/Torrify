import { describe, expect, it, vi } from 'vitest'
import { streamSseResponse } from '../llm/utils'
import type { StreamCallback } from '../llm/types'

describe('streamSseResponse parsing variants', () => {
    const makeStreamResponse = (chunks: string[]): Response => {
        const encoder = new TextEncoder()
        const body = new ReadableStream<Uint8Array>({
            start(controller) {
                for (const chunk of chunks) {
                    controller.enqueue(encoder.encode(chunk))
                }
                controller.close()
            }
        })
        return {
            ok: true,
            statusText: 'OK',
            body,
        } as unknown as Response
    }

    it('handles standard data prefix with space', async () => {
        const response = makeStreamResponse([
            'data: {"choices":[{"delta":{"content":"hello"}}]}\n\n',
            'data: [DONE]\n\n'
        ])
        const seen: string[] = []
        const onChunk: StreamCallback = (delta) => {
            if (delta) seen.push(delta)
        }

        await streamSseResponse(response, onChunk)
        expect(seen).toEqual(['hello'])
    })

    it('handles data prefix without space (common in some providers)', async () => {
        const response = makeStreamResponse([
            'data:{"choices":[{"delta":{"content":"world"}}]}\n\n',
            'data:[DONE]\n\n'
        ])
        const seen: string[] = []
        const onChunk: StreamCallback = (delta) => {
            if (delta) seen.push(delta)
        }

        await streamSseResponse(response, onChunk)
        expect(seen).toEqual(['world'])
    })

    it('handles concatenated data chunks in a single read', async () => {
        const response = makeStreamResponse([
            'data: {"choices":[{"delta":{"content":"foo"}}]}\n\ndata: {"choices":[{"delta":{"content":"bar"}}]}\n\n'
        ])
        const seen: string[] = []
        const onChunk: StreamCallback = (delta) => {
            if (delta) seen.push(delta)
        }

        await streamSseResponse(response, onChunk)
        expect(seen).toEqual(['foo', 'bar'])
    })

    it('handles chunks split across reads', async () => {
        const response = makeStreamResponse([
            'data: {"choices":[{"delta":{"content":"split',
            '"}}]}\n\n'
        ])
        const seen: string[] = []
        const onChunk: StreamCallback = (delta) => {
            if (delta) seen.push(delta)
        }

        await streamSseResponse(response, onChunk)
        expect(seen).toEqual(['split'])
    })

    it('processes trailing buffer content if it looks like data but lacks double newline', async () => {
        // This is a common failure mode if the provider doesn't send the final \n\n
        const response = makeStreamResponse([
            'data: {"choices":[{"delta":{"content":"final"}}]}'
        ])
        const seen: string[] = []
        const onChunk: StreamCallback = (delta) => {
            if (delta) seen.push(delta)
        }

        await streamSseResponse(response, onChunk)
        expect(seen).toEqual(['final'])
    })

    it('handles naked carriage return (\\r) line endings', async () => {
        const response = makeStreamResponse([
            'data: {"choices":[{"delta":{"content":"cr"}}]}\r\rdata: [DONE]\r\r'
        ])
        const seen: string[] = []
        const onChunk: StreamCallback = (delta) => {
            if (delta) seen.push(delta)
        }

        await streamSseResponse(response, onChunk)
        // This is expected to FAIL with the current implementation if it only splits by \n
        expect(seen).toEqual(['cr'])
    })

    it('handles mixed \\r\\n and \\n line endings', async () => {
        const response = makeStreamResponse([
            'data: {"choices":[{"delta":{"content":"mixed1"}}]}\r\n',
            '\r\ndata: {"choices":[{"delta":{"content":"mixed2"}}]}\n\n'
        ])
        const seen: string[] = []
        const onChunk: StreamCallback = (delta) => {
            if (delta) seen.push(delta)
        }

        await streamSseResponse(response, onChunk)
        expect(seen).toEqual(['mixed1', 'mixed2'])
    })

    it('handles multiple data: prefixes in a single "line" (hyper-robust)', async () => {
        // This simulates a failure in the line-splitting logic or a weird provider
        const response = makeStreamResponse([
            'data: {"choices":[{"delta":{"content":"part1"}}]}data: {"choices":[{"delta":{"content":"part2"}}]}\n\n'
        ])
        const seen: string[] = []
        const onChunk: StreamCallback = (delta) => {
            if (delta) seen.push(delta)
        }

        await streamSseResponse(response, onChunk)
        expect(seen).toEqual(['part1', 'part2'])
    })
})
