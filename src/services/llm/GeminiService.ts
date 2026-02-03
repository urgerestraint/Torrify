import { GoogleGenerativeAI, type Part, type Content } from '@google/generative-ai'
import type { LLMService, LLMMessage, LLMResponse, LLMConfig, CADBackend, StreamCallback, StreamController } from './types'
import { getSystemPrompt } from './prompts'
import { logger } from '../../utils/logger'

export class GeminiService implements LLMService {
  private client: GoogleGenerativeAI
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
    this.client = new GoogleGenerativeAI(config.apiKey)
  }

  /**
   * Build parts array for Gemini API from a message
   */
  private buildParts(message: LLMMessage, overrideText?: string): Part[] {
    const parts: Part[] = []
    const text = overrideText ?? message.content
    if (text) {
      parts.push({ text })
    }
    const imageDataUrls = message.imageDataUrls ?? []
    for (const dataUrl of imageDataUrls) {
      const match = dataUrl.match(/^data:(.+);base64,(.*)$/)
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          }
        })
      }
    }
    return parts
  }

  /**
   * Build chat history for Gemini (must alternate user/model)
   */
  private buildHistory(messages: LLMMessage[], systemPrompt: string, cadBackend: CADBackend): Content[] {
    const readyMessage = cadBackend === 'build123d' 
      ? 'I understand. I\'m ready to help with build123d!' 
      : 'I understand. I\'m ready to help with OpenSCAD!'

    const history: Content[] = []
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i]
      history.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: this.buildParts(msg)
      })
    }

    // If history is empty or doesn't start with user, prepend system prompt as user message
    if (history.length === 0 || history[0].role !== 'user') {
      history.unshift({
        role: 'user',
        parts: [{ text: systemPrompt }]
      })
      history.push({
        role: 'model',
        parts: [{ text: readyMessage }]
      })
    }

    return history
  }

  async sendMessage(messages: LLMMessage[], currentCode?: string, cadBackend: CADBackend = 'openscad', apiContext?: string): Promise<LLMResponse> {
    // Validate input
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }
    if (!messages.some(m => m.role === 'user')) {
      throw new Error('At least one user message is required')
    }

    try {
      const model = this.client.getGenerativeModel({ model: this.config.model })
      const systemPrompt = getSystemPrompt(cadBackend, currentCode, apiContext)
      const history = this.buildHistory(messages, systemPrompt, cadBackend)

      // Start chat with history
      const chat = model.startChat({
        history,
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: this.config.maxTokens || 2048,
        },
      })

      // Send the last message with system context and current code
      const lastMessage = messages[messages.length - 1]
      const partsToSend = this.buildParts(lastMessage, `${systemPrompt}\n\n${lastMessage.content}`)
      const result = await chat.sendMessage(partsToSend)
      const response = await result.response
      const text = response.text()

      return {
        content: text,
        model: this.config.model,
        usage: {
          promptTokens: 0, // Gemini doesn't provide token counts in free tier
          completionTokens: 0,
          totalTokens: 0,
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Gemini API error', error)
      throw new Error(`Gemini API error: ${errorMessage}`)
    }
  }

  async streamMessage(
    messages: LLMMessage[],
    onChunk: StreamCallback,
    currentCode?: string,
    cadBackend: CADBackend = 'openscad',
    apiContext?: string
  ): Promise<StreamController> {
    // Validate input
    if (!messages || messages.length === 0) {
      throw new Error('Messages array cannot be empty')
    }
    if (!messages.some(m => m.role === 'user')) {
      throw new Error('At least one user message is required')
    }

    let aborted = false
    const controller: StreamController = {
      abort: () => { aborted = true }
    }

    // Start streaming in an async context
    ;(async () => {
      try {
        const model = this.client.getGenerativeModel({ model: this.config.model })
        const systemPrompt = getSystemPrompt(cadBackend, currentCode, apiContext)
        const history = this.buildHistory(messages, systemPrompt, cadBackend)

        // Start chat with history
        const chat = model.startChat({
          history,
          generationConfig: {
            temperature: this.config.temperature || 0.7,
            maxOutputTokens: this.config.maxTokens || 2048,
          },
        })

        // Send the last message with system context
        const lastMessage = messages[messages.length - 1]
        const partsToSend = this.buildParts(lastMessage, `${systemPrompt}\n\n${lastMessage.content}`)
        
        // Use streaming API
        const result = await chat.sendMessageStream(partsToSend)
        
        let accumulated = ''
        for await (const chunk of result.stream) {
          if (aborted) {
            break
          }
          const chunkText = chunk.text()
          accumulated += chunkText
          onChunk(chunkText, accumulated, false)
        }

        if (!aborted) {
          onChunk('', accumulated, true)
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('Gemini streaming error', error)
        // Signal error through callback with done=true
        onChunk(`\n\n[Error: ${errorMessage}]`, '', true)
      }
    })()

    return controller
  }

  supportsStreaming(): boolean {
    return true
  }

  getProviderName(): string {
    return 'Google Gemini'
  }
}
