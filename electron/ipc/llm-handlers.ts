/**
 * LLM IPC Handlers.
 * 
 * Manages communication between the renderer process and various AI providers.
 * Handles both synchronous (sendMessage) and asynchronous streaming (streamMessage)
 * requests, including unique stream ID generation and abort coordination.
 */
import { ipcMain } from 'electron'
import type { BrowserWindow } from 'electron'
import { getCurrentSettings } from '../settings'
import { createLLMService } from '../llm'
import type { CADBackend } from '../llm'
import { getErrorMessage } from '../utils/error'
import { LLMRequestPayloadSchema, StreamIdSchema } from '../validation/schemas'

/** Active streaming requests mapped by their unique streamId */
const streamAbortMap = new Map<string, { readonly abort: () => void }>()

/**
 * Generates a unique, sortable, and human-readable identifier for a new stream.
 */
function nextStreamId(): string {
  return `llm-stream-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Registers all LLM-related IPC handlers.
 * 
 * @param getMainWindow - Accessor for the primary application window
 */
export function registerLlmHandlers(getMainWindow: () => BrowserWindow | null): void {
  /**
   * Synchronous Chat Completion.
   * Sends a prompt and waits for the full response before returning.
   */
  ipcMain.handle('llm-send-message', async (_event, payload: unknown) => {
    const win = getMainWindow()
    if (!win) {
      return { success: false, error: 'Target window is no longer available' }
    }

    const parseResult = LLMRequestPayloadSchema.safeParse(payload)
    if (!parseResult.success) {
      return { success: false, error: 'Invalid message payload structure' }
    }
    const { messages, currentCode, apiContext } = parseResult.data
    const cadBackend: CADBackend = parseResult.data.cadBackend === 'build123d' ? 'build123d' : 'openscad'

    try {
      const settings = getCurrentSettings()
      const service = createLLMService(settings.llm)
      const response = await service.sendMessage(messages, currentCode, cadBackend, apiContext)
      return { success: true, response }
    } catch (error: unknown) {
      return {
        success: false,
        error: getErrorMessage(error)
      }
    }
  })

  /**
   * Streaming Chat Completion.
   * Returns a streamId immediately and pushes text chunks via the 'llm-stream-chunk' channel.
   */
  ipcMain.handle('llm-stream-message', async (_event, payload: unknown) => {
    const win = getMainWindow()
    if (!win) {
      return { streamId: null, error: 'Target window is no longer available' }
    }

    const parseResult = LLMRequestPayloadSchema.safeParse(payload)
    if (!parseResult.success) {
      return { streamId: null, error: 'Invalid streaming payload structure' }
    }
    const { messages, currentCode, apiContext } = parseResult.data
    const cadBackend: CADBackend = parseResult.data.cadBackend === 'build123d' ? 'build123d' : 'openscad'

    const streamId = nextStreamId()

    // Process stream in the background to avoid blocking the IPC response
    void (async () => {
      try {
        const settings = getCurrentSettings()
        const service = createLLMService(settings.llm)
        
        if (!service.streamMessage) {
          throw new Error(`Provider ${service.getProviderName()} does not support streaming`)
        }

        const controller = await service.streamMessage(
          messages,
          (delta, full, done) => {
            const currentWin = getMainWindow()
            if (currentWin) {
              currentWin.webContents.send('llm-stream-chunk', { streamId, delta, full, done })
            }
            if (done) {
              streamAbortMap.delete(streamId)
            }
          },
          currentCode,
          cadBackend,
          apiContext
        )
        streamAbortMap.set(streamId, controller)
      } catch (error: unknown) {
        const currentWin = getMainWindow()
        if (currentWin) {
          currentWin.webContents.send('llm-stream-chunk', {
            streamId,
            delta: `\n\n[System Error: ${getErrorMessage(error)}]`,
            full: '',
            done: true
          })
        }
        streamAbortMap.delete(streamId)
      }
    })()

    return { streamId }
  })

  /**
   * Abort Stream.
   * Forcefully terminates a network request for a specific stream ID.
   */
  ipcMain.handle('llm-stream-abort', (_event, streamId: unknown) => {
    const parseResult = StreamIdSchema.safeParse(streamId)
    if (!parseResult.success) {
      return
    }
    const entry = streamAbortMap.get(parseResult.data)
    if (entry) {
      entry.abort()
      streamAbortMap.delete(parseResult.data)
    }
  })
}
