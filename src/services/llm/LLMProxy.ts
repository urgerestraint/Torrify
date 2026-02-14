import type { LLMService, LLMMessage, LLMResponse, CADBackend, StreamCallback, StreamController } from './types'
import { logger } from '../../utils/logger'

/**
 * Renderer-side proxy that forwards all LLM calls to the main process via IPC.
 * No API keys, endpoints, or secrets are held or used in the renderer.
 */
export class LLMProxy implements LLMService {
  private static readonly DEFAULT_BACKEND: CADBackend = 'openscad'

  /**
   * Forwards a non-streaming chat request to the main process.
   * 
   * @param messages - Complete conversation history
   * @param currentCode - Optional context: current code in the editor
   * @param cadBackend - Optional context: active CAD backend
   * @param apiContext - Optional context: relevant documentation snippets
   * @throws {Error} If the IPC call fails or the main process returns an error
   * @returns A promise resolving to the LLM's response
   */
  async sendMessage(
    messages: LLMMessage[],
    currentCode?: string,
    cadBackend: CADBackend = LLMProxy.DEFAULT_BACKEND,
    apiContext?: string
  ): Promise<LLMResponse> {
    const result = await window.electronAPI.llmSendMessage({
      messages,
      currentCode,
      cadBackend,
      apiContext
    })
    if (!result.success || result.response == null) {
      throw new Error(result.error ?? 'LLM request failed')
    }
    return result.response
  }

  /**
   * Initiates a streaming chat request via IPC.
   * Registers a listener for chunk events identified by a unique stream ID.
   * 
   * @param messages - Complete conversation history
   * @param onChunk - Callback triggered for each received text fragment
   * @param currentCode - Optional context: current code in the editor
   * @param cadBackend - Optional context: active CAD backend
   * @param apiContext - Optional context: relevant documentation snippets
   * @throws {Error} If the main process fails to initialize the stream
   * @returns A controller for aborting the IPC-managed stream
   */
  async streamMessage(
    messages: LLMMessage[],
    onChunk: StreamCallback,
    currentCode?: string,
    cadBackend: CADBackend = LLMProxy.DEFAULT_BACKEND,
    apiContext?: string
  ): Promise<StreamController> {
    const result = await window.electronAPI.llmStreamMessage({
      messages,
      currentCode,
      cadBackend,
      apiContext
    })
    if (result.error || result.streamId == null) {
      throw new Error(result.error ?? 'LLM stream failed')
    }
    const streamId = result.streamId
    window.electronAPI.onLlmStreamChunk(streamId, onChunk)
    return {
      abort: () => {
        void Promise.resolve(window.electronAPI.llmStreamAbort(streamId)).catch((error) => {
          logger.warn('Failed to abort LLM stream', error)
        })
      }
    }
  }

  /**
   * Returns true as the IPC bridge supports streaming for all underlying providers.
   */
  supportsStreaming(): boolean {
    return true
  }

  /**
   * Generic name for the proxy-based provider.
   */
  getProviderName(): string {
    return 'LLM'
  }
}
