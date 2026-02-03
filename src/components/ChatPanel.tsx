import { useRef, useEffect, useCallback, useState } from 'react'
import { createLLMService, PROVIDER_NAMES, requiresApiKey, type LLMMessage, type StreamController } from '../services/llm'
import type { CADBackend } from '../services/cad'
import { logger } from '../utils/logger'

export interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  error?: boolean
  imageDataUrls?: string[]  // Images attached to this message
  isStreaming?: boolean  // Whether this message is currently being streamed
}

interface PendingDiagnosis {
  error: string
  code: string
}

interface ChatPanelProps {
  currentCode?: string
  pendingSnapshots?: string[]
  onSnapshotsSent?: () => void
  onApplyCode?: (code: string) => void
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  cadBackend?: CADBackend
  pendingDiagnosis?: PendingDiagnosis | null
  onDiagnosisSent?: () => void
  settingsVersion?: number // Increment this to trigger LLM status refresh
}

// Extract code from LLM response based on backend type
const extractCodeFromResponse = (text: string, backend: CADBackend = 'openscad') => {
  const codeChunks: string[] = []
  let match: RegExpExecArray | null

  if (backend === 'openscad') {
    // OpenSCAD-specific extraction
    const openscadTagRegex = /<openscad>([\s\S]*?)<\/openscad>/gi
    while ((match = openscadTagRegex.exec(text)) !== null) {
      const chunk = match[1].trim()
      if (chunk) {
        codeChunks.push(chunk)
      }
    }

    const assistantMatch = text.match(/<assistant>([\s\S]*?)<\/assistant>/i)
    let cleanedText = assistantMatch ? assistantMatch[1].trim() : text.replace(openscadTagRegex, '').trim()

    if (codeChunks.length === 0) {
      const fencedRegex = /```(?:openscad|scad)\s*([\s\S]*?)```/gi
      while ((match = fencedRegex.exec(text)) !== null) {
        const chunk = match[1].trim()
        if (chunk) {
          codeChunks.push(chunk)
        }
      }
      if (!assistantMatch) {
        cleanedText = cleanedText.replace(fencedRegex, '').trim()
      }
    }

    const combinedCode = codeChunks.length > 0 ? `${codeChunks.join('\n\n')}\n` : null
    return {
      code: combinedCode,
      message: cleanedText,
    }
  } else {
    // build123d / Python extraction
    const pythonTagRegex = /<python>([\s\S]*?)<\/python>/gi
    while ((match = pythonTagRegex.exec(text)) !== null) {
      const chunk = match[1].trim()
      if (chunk) {
        codeChunks.push(chunk)
      }
    }

    const assistantMatch = text.match(/<assistant>([\s\S]*?)<\/assistant>/i)
    let cleanedText = assistantMatch ? assistantMatch[1].trim() : text.replace(pythonTagRegex, '').trim()

    if (codeChunks.length === 0) {
      const fencedRegex = /```(?:python|py|build123d)\s*([\s\S]*?)```/gi
      while ((match = fencedRegex.exec(text)) !== null) {
        const chunk = match[1].trim()
        if (chunk) {
          codeChunks.push(chunk)
        }
      }
      if (!assistantMatch) {
        cleanedText = cleanedText.replace(fencedRegex, '').trim()
      }
    }

    const combinedCode = codeChunks.length > 0 ? `${codeChunks.join('\n\n')}\n` : null
    return {
      code: combinedCode,
      message: cleanedText,
    }
  }
}

function ChatPanel({ currentCode, pendingSnapshots, onSnapshotsSent, onApplyCode, messages, setMessages, cadBackend = 'openscad', pendingDiagnosis, onDiagnosisSent, settingsVersion = 0 }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [llmStatus, setLlmStatus] = useState<string>('Loading...')
  const [codeAppliedAt, setCodeAppliedAt] = useState<number | null>(null)
  const [apiContext, setApiContext] = useState<string | undefined>(undefined)
  const [stagedImages, setStagedImages] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamControllerRef = useRef<StreamController | null>(null)
  const streamingMessageIdRef = useRef<number | null>(null)

  // Handle file selection for image import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        setStagedImages(prev => [...prev, dataUrl])
      }
      reader.readAsDataURL(file)
    })

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove a staged image
  const removeStagedImage = (index: number) => {
    setStagedImages(prev => prev.filter((_, i) => i !== index))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!codeAppliedAt) {
      return
    }

    const timer = window.setTimeout(() => {
      setCodeAppliedAt(null)
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [codeAppliedAt])

  useEffect(() => {
    // Load LLM status on mount and when settings change
    loadLLMStatus()
  }, [settingsVersion])

  // Load API context for the current backend
  useEffect(() => {
    const loadContext = async () => {
      try {
        const result = await window.electronAPI.getContext(cadBackend)
        if (result.success && result.content) {
          setApiContext(result.content)
        } else {
          setApiContext(undefined)
        }
      } catch (error) {
        logger.error('Failed to load API context', error)
        setApiContext(undefined)
      }
    }
    loadContext()
  }, [cadBackend])

  // Handle pending error diagnosis
  useEffect(() => {
    if (pendingDiagnosis && !isLoading) {
      const processDiagnosis = async () => {
        const backendName = cadBackend === 'build123d' ? 'build123d (Python)' : 'OpenSCAD'
        const codeBlockLang = cadBackend === 'build123d' ? 'python' : 'openscad'
        
        // Create a diagnostic prompt
        const diagnosisText = `I got this error when trying to render my ${backendName} code. Please help me understand and fix the error.

**Error:**
\`\`\`
${pendingDiagnosis.error}
\`\`\`

**My Code:**
\`\`\`${codeBlockLang}
${pendingDiagnosis.code}
\`\`\``

        // Add user message
        const userMessage: Message = {
          id: Date.now(),
          text: diagnosisText,
          sender: 'user',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, userMessage])
        
        // Clear the pending diagnosis
        onDiagnosisSent?.()
        
        // Send to LLM
        await sendToLlm(diagnosisText)
      }
      
      processDiagnosis()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sendToLlm is from useCallback below; effect only runs when pendingDiagnosis changes
  }, [pendingDiagnosis, isLoading, cadBackend, onDiagnosisSent, setMessages])

  const loadLLMStatus = async () => {
    try {
      const settings = await window.electronAPI.getSettings()
      if (settings.llm.enabled) {
        if (settings.llm.provider === 'gateway') {
          if (settings.llm.gatewayLicenseKey?.trim()) {
            setLlmStatus(`${PROVIDER_NAMES[settings.llm.provider]} (${settings.llm.model})`)
          } else {
            setLlmStatus('PRO License Key Required - Configure in Settings')
          }
        } else if (settings.llm.provider === 'openrouter') {
          const key = await window.electronAPI.getOpenRouterKey()
          if (key) {
            setLlmStatus(`${PROVIDER_NAMES[settings.llm.provider]} (${settings.llm.model})`)
          } else {
            setLlmStatus('OpenRouter API Key Required - Set OPENROUTER_API_KEY in environment')
          }
        } else if (!requiresApiKey(settings.llm.provider)) {
          setLlmStatus(`${PROVIDER_NAMES[settings.llm.provider]} (${settings.llm.model})`)
        } else if (settings.llm.apiKey?.trim()) {
          setLlmStatus(`${PROVIDER_NAMES[settings.llm.provider]} (${settings.llm.model})`)
        } else {
          setLlmStatus('API Key Required - Configure in Settings')
        }
      } else {
        setLlmStatus('AI Disabled')
      }
    } catch {
      setLlmStatus('AI Not Configured')
    }
  }

  const sendToLlm = useCallback(async (userInput: string, imageDataUrls?: string[]) => {
    try {
      // Get settings for LLM config
      const settings = await window.electronAPI.getSettings()
      
      if (!settings.llm.enabled) {
        throw new Error('AI is disabled. Enable it in Settings.')
      }

      // Check provider-specific requirements
      if (settings.llm.provider === 'gateway') {
        if (!settings.llm.gatewayLicenseKey?.trim()) {
          throw new Error('PRO license key not configured. Add it in Settings.')
        }
      } else if (settings.llm.provider === 'openrouter') {
        const key = await window.electronAPI.getOpenRouterKey()
        if (!key) {
          throw new Error('OpenRouter API key not configured. Set OPENROUTER_API_KEY in environment.')
        }
      } else if (requiresApiKey(settings.llm.provider) && !settings.llm.apiKey?.trim()) {
        // Debug logging to help diagnose provider value issues
        logger.debug('LLM Provider:', settings.llm.provider, 'Has API Key:', !!settings.llm.apiKey?.trim())
        throw new Error('API key not configured. Please add it in Settings.')
      }

      // Create LLM service
      const llmService = createLLMService(settings.llm)

      // Build conversation history
      const llmMessages: LLMMessage[] = messages
        .filter(m => !m.error && !m.isStreaming) // Exclude error and streaming messages
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }))

      // Add current user message
      llmMessages.push({
        role: 'user',
        content: userInput,
        imageDataUrls
      })

      // Check if streaming is supported and streamMessage is available
      if (llmService.supportsStreaming() && llmService.streamMessage) {
        // Create a placeholder bot message for streaming
        const streamingMessageId = Date.now() + 1
        streamingMessageIdRef.current = streamingMessageId
        
        const streamingMessage: Message = {
          id: streamingMessageId,
          text: '',
          sender: 'bot',
          timestamp: new Date(),
          isStreaming: true
        }
        setMessages(prev => [...prev, streamingMessage])
        setIsStreaming(true)

        // Start streaming
        const controller = await llmService.streamMessage(
          llmMessages,
          (_chunk, accumulated, done) => {
            if (done) {
              // Streaming complete - finalize the message
              setIsStreaming(false)
              streamControllerRef.current = null
              
              // Process the complete response for code extraction
              const extracted = extractCodeFromResponse(accumulated, cadBackend)
              if (extracted.code) {
                onApplyCode?.(extracted.code)
                setCodeAppliedAt(Date.now())
              }
              
              // Update the final message
              setMessages(prev => prev.map(m => 
                m.id === streamingMessageId 
                  ? { ...m, text: extracted.message || accumulated, isStreaming: false }
                  : m
              ))
              
              setIsLoading(false)
              if (imageDataUrls && imageDataUrls.length > 0) {
                onSnapshotsSent?.()
              }
            } else {
              // Update the streaming message with new content
              setMessages(prev => prev.map(m => 
                m.id === streamingMessageId 
                  ? { ...m, text: accumulated }
                  : m
              ))
            }
          },
          currentCode,
          cadBackend,
          apiContext
        )
        
        streamControllerRef.current = controller
      } else {
        // Fallback to non-streaming
        const response = await llmService.sendMessage(llmMessages, currentCode, cadBackend, apiContext)

        const extracted = extractCodeFromResponse(response.content, cadBackend)
        if (extracted.code) {
          onApplyCode?.(extracted.code)
          setCodeAppliedAt(Date.now())
        }

        if (extracted.message) {
          const botMessage: Message = {
            id: Date.now() + 1,
            text: extracted.message,
            sender: 'bot',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, botMessage])
        }
        
        setIsLoading(false)
        if (imageDataUrls && imageDataUrls.length > 0) {
          onSnapshotsSent?.()
        }
      }

    } catch (error: unknown) {
      logger.error('LLM error', error)
      const errorText = error instanceof Error ? error.message : 'Failed to get AI response'
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: `Error: ${errorText}`,
        sender: 'bot',
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)
      setIsStreaming(false)
      streamControllerRef.current = null
      if (imageDataUrls && imageDataUrls.length > 0) {
        onSnapshotsSent?.()
      }
    }
  }, [currentCode, messages, onSnapshotsSent, onApplyCode, cadBackend, setMessages, apiContext])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userInput = input
    setInput('')
    setIsLoading(true)

    // Combine staged images with pending snapshots
    const allImages = [...(pendingSnapshots || []), ...stagedImages]
    const hasImages = allImages.length > 0

    // Add user message with images
    const userMessage: Message = {
      id: Date.now(),
      text: userInput,
      sender: 'user',
      timestamp: new Date(),
      imageDataUrls: hasImages ? allImages : undefined
    }

    setMessages(prev => [...prev, userMessage])
    
    // Clear staged images after adding to message
    setStagedImages([])
    
    await sendToLlm(userInput, hasImages ? allImages : undefined)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStopStreaming = useCallback(() => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort()
      streamControllerRef.current = null
    }
    
    // Finalize any streaming message
    if (streamingMessageIdRef.current) {
      setMessages(prev => prev.map(m => 
        m.id === streamingMessageIdRef.current 
          ? { ...m, isStreaming: false, text: m.text + '\n\n[Stopped]' }
          : m
      ))
      streamingMessageIdRef.current = null
    }
    
    setIsStreaming(false)
    setIsLoading(false)
  }, [setMessages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamControllerRef.current) {
        streamControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#3e3e42]">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <p className="text-xs text-gray-400">
          {isStreaming ? (
            <span className="text-blue-400">Streaming...</span>
          ) : (
            llmStatus
          )}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.error
                  ? 'bg-red-900/30 text-red-300 border border-red-700'
                  : 'bg-[#2d2d30] text-gray-200'
              }`}
            >
              {/* Display attached images */}
              {message.imageDataUrls && message.imageDataUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.imageDataUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Attached ${i + 1}`}
                      className="max-w-full max-h-48 rounded cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(url, '_blank')}
                      title="Click to view full size"
                    />
                  ))}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">
                {message.text}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse" />
                )}
              </p>
              <p className="text-xs opacity-60 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {codeAppliedAt && (
          <div className="flex justify-center">
            <div className="text-xs text-green-300 bg-green-900/30 border border-green-700 px-2 py-1 rounded">
              Code applied to editor
            </div>
          </div>
        )}
        {!!pendingSnapshots?.length && (
          <div className="flex justify-center">
            <div className="text-xs text-blue-200 bg-blue-900/30 border border-blue-700 px-2 py-1 rounded">
              Images queued: {pendingSnapshots.length}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#3e3e42]">
        {/* Staged Images Preview */}
        {stagedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {stagedImages.map((dataUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={dataUrl}
                  alt={`Staged ${index + 1}`}
                  className="w-16 h-16 object-cover rounded border border-[#3e3e42]"
                />
                <button
                  onClick={() => removeStagedImage(index)}
                  type="button"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-700 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                  aria-label={`Remove staged image ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-3 py-2 bg-[#3e3e42] hover:bg-[#4e4e52] disabled:bg-[#2d2d30] disabled:cursor-not-allowed rounded transition-colors"
            title="Attach images"
            aria-label="Attach images"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-[#2d2d30] text-white px-3 py-2 rounded border border-[#3e3e42] focus:outline-none focus:border-blue-500 resize-none"
            rows={2}
            aria-label="Chat message"
          />
          {isStreaming ? (
            <button
              onClick={handleStopStreaming}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-medium transition-colors"
              title="Stop streaming"
              aria-label="Stop streaming response"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-medium transition-colors"
              aria-label="Send message"
            >
              {isLoading ? 'Thinking...' : 'Send'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPanel
