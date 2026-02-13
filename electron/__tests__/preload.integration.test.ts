import { beforeEach, describe, expect, it, vi } from 'vitest'

type ChunkPayload = { streamId: string; delta: string; full: string; done: boolean }

const { state } = vi.hoisted(() => ({
  state: (() => {
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
    const invoke = vi.fn()
    const on = vi.fn((channel: string, handler: (...args: unknown[]) => void) => {
      if (!listeners.has(channel)) {
        listeners.set(channel, new Set())
      }
      listeners.get(channel)?.add(handler)
    })
    const removeListener = vi.fn((channel: string, handler: (...args: unknown[]) => void) => {
      listeners.get(channel)?.delete(handler)
    })
    const removeAllListeners = vi.fn((channel: string) => {
      listeners.get(channel)?.clear()
    })
    return {
    exposedApi: null as Record<string, unknown> | null,
      listeners,
      invoke,
      on,
      removeListener,
      removeAllListeners
    }
  })()
}))

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn((_key: string, api: Record<string, unknown>) => {
      state.exposedApi = api
    })
  },
  ipcRenderer: {
    invoke: (...args: unknown[]) => state.invoke(...args),
    on: (...args: unknown[]) => state.on(...args),
    removeListener: (...args: unknown[]) => state.removeListener(...args),
    removeAllListeners: (...args: unknown[]) => state.removeAllListeners(...args)
  }
}))

import '../preload'

describe('preload IPC integration', () => {
  beforeEach(() => {
    state.invoke.mockReset()
    state.on.mockClear()
    state.removeListener.mockClear()
    state.removeAllListeners.mockClear()
    state.listeners.clear()
  })

  it('forwards LLM invoke channels with payload unchanged', async () => {
    state.invoke.mockResolvedValue({ success: true })

    const api = state.exposedApi as {
      llmSendMessage: (payload: unknown) => Promise<unknown>
      llmStreamMessage: (payload: unknown) => Promise<unknown>
      llmStreamAbort: (streamId: string) => Promise<unknown>
    }
    const payload = {
      messages: [{ role: 'user', content: 'hello' }],
      currentCode: 'cube([1,2,3]);',
      cadBackend: 'openscad',
      apiContext: 'fixture context'
    }

    await api.llmSendMessage(payload)
    await api.llmStreamMessage(payload)
    await api.llmStreamAbort('stream-1')

    expect(state.invoke).toHaveBeenNthCalledWith(1, 'llm-send-message', payload)
    expect(state.invoke).toHaveBeenNthCalledWith(2, 'llm-stream-message', payload)
    expect(state.invoke).toHaveBeenNthCalledWith(3, 'llm-stream-abort', 'stream-1')
  })

  it('forwards knowledge-base context channels with correct arguments', async () => {
    state.invoke.mockResolvedValue({ success: true })

    const api = state.exposedApi as {
      getContext: (backend: 'openscad' | 'build123d') => Promise<unknown>
      getContextStatus: () => Promise<unknown>
      updateContextFromCloud: (backend: 'openscad' | 'build123d', url: string) => Promise<unknown>
      resetContextToFactory: (backend?: 'openscad' | 'build123d') => Promise<unknown>
    }

    await api.getContext('build123d')
    await api.getContextStatus()
    await api.updateContextFromCloud('openscad', 'https://example.com/context.txt')
    await api.resetContextToFactory('openscad')

    expect(state.invoke).toHaveBeenNthCalledWith(1, 'get-context', 'build123d')
    expect(state.invoke).toHaveBeenNthCalledWith(2, 'get-context-status')
    expect(state.invoke).toHaveBeenNthCalledWith(
      3,
      'update-context-from-cloud',
      'openscad',
      'https://example.com/context.txt'
    )
    expect(state.invoke).toHaveBeenNthCalledWith(4, 'reset-context-to-factory', 'openscad')
  })

  it('filters stream events by streamId and removes listener on done=true', () => {
    const callback = vi.fn()
    const api = state.exposedApi as {
      onLlmStreamChunk: (streamId: string, callback: (delta: string, full: string, done: boolean) => void) => void
    }

    api.onLlmStreamChunk('target-stream', callback)

    const handler = state.on.mock.calls[0]?.[1] as (event: unknown, payload: ChunkPayload) => void
    expect(state.on).toHaveBeenCalledWith('llm-stream-chunk', expect.any(Function))

    handler({}, { streamId: 'other-stream', delta: 'x', full: 'x', done: false })
    expect(callback).not.toHaveBeenCalled()

    handler({}, { streamId: 'target-stream', delta: 'hi', full: 'hi', done: false })
    expect(callback).toHaveBeenCalledWith('hi', 'hi', false)

    handler({}, { streamId: 'target-stream', delta: '', full: 'hi', done: true })
    expect(callback).toHaveBeenCalledWith('', 'hi', true)
    expect(state.removeListener).toHaveBeenCalledWith('llm-stream-chunk', handler)
  })
})
