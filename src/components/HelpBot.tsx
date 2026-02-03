import { useState, useEffect, useRef, useCallback } from 'react'
import { createLLMService } from '../services/llm'
import type { LLMMessage } from '../services/llm'
import { logger } from '../utils/logger'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  error?: boolean
}

interface HelpBotProps {
  isOpen: boolean
  onClose: () => void
}

function HelpBot({ isOpen, onClose }: HelpBotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [documentation, setDocumentation] = useState<Record<string, string>>({})
  const [isLoadingDocs, setIsLoadingDocs] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load documentation on mount
  useEffect(() => {
    if (isOpen) {
      loadDocumentation()
    }
  }, [isOpen])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const loadDocumentation = async () => {
    setIsLoadingDocs(true)
    try {
      const result = await window.electronAPI.loadDocumentation()
      if (result.success && result.docs) {
        setDocumentation(result.docs)
        
        // Initialize with welcome message
        setMessages([{
          id: 1,
          text: 'Hello! I\'m the Torrify Help Bot. I have access to all the project documentation and can answer questions about:\n\n• How to get started\n• Development workflows\n• Features and capabilities\n• AI configuration and PRO models\n• CAD backends (OpenSCAD, build123d)\n• Troubleshooting\n• Project architecture\n\nFor bugs, complaints, or suggestions, contact hello@torrify.org.\n\nWhat would you like to know?',
          sender: 'bot',
          timestamp: new Date()
        }])
      } else {
        setMessages([{
          id: 1,
          text: 'Failed to load documentation. Please try again later.',
          sender: 'bot',
          timestamp: new Date(),
          error: true
        }])
      }
    } catch (error) {
      logger.error('Failed to load documentation', error)
      setMessages([{
        id: 1,
        text: 'Failed to load documentation. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
        error: true
      }])
    } finally {
      setIsLoadingDocs(false)
    }
  }

  const buildDocumentationContext = useCallback((): string => {
    if (Object.keys(documentation).length === 0) return ''
    
    return `\n\n## Project Documentation Context\n\nThe following documentation is available for reference:\n\n${Object.entries(documentation)
      .map(([file, content]) => {
        // Truncate very long files to keep context manageable
        const truncated = content.length > 3000 ? content.substring(0, 3000) + '...' : content
        return `### ${file}\n${truncated}`
      })
      .join('\n\n---\n\n')}`
  }, [documentation])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Get LLM settings
      const settings = await window.electronAPI.getSettings()
      
      if (!settings.llm.enabled) {
        throw new Error('AI is not enabled. Please enable AI in settings to use the Help Bot.')
      }

      // Create LLM service
      const llmService = createLLMService(settings.llm)

      // Build conversation history
      const conversationHistory: LLMMessage[] = []
      
      // Check if this is the first user question - if so, include documentation context
      const isFirstQuestion = messages.filter(m => m.sender === 'user').length === 0
      
      if (isFirstQuestion) {
        // For first question, include documentation context
        const docsContext = buildDocumentationContext()
        conversationHistory.push({
          role: 'user',
          content: `I'm asking questions about Torrify IDE. Here's the project documentation for context:${docsContext}\n\nPlease use this documentation to answer my questions. I'll ask my question next.`
        })
      }

      // Add previous conversation (excluding welcome message)
      const previousMessages: LLMMessage[] = messages
        .filter(msg => !msg.error && msg.id !== 1) // Exclude welcome and errors
        .map(msg => ({
          role: (msg.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: msg.text
        }))
      
      conversationHistory.push(...previousMessages)

      // Add current user message with context reminder if needed
      let userQuestion = userMessage.text
      if (!isFirstQuestion && conversationHistory.length < 3) {
        // If we're early in conversation, remind about docs
        userQuestion = `[Context: You have access to Torrify project documentation. Use it to answer this question.]\n\n${userQuestion}`
      }

      conversationHistory.push({
        role: 'user',
        content: userQuestion
      })

      // Send to LLM
      // The LLM service will build its system prompt, but our context in messages will guide it
      const response = await llmService.sendMessage(conversationHistory.slice(-10)) // Keep last 10 messages for context

      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.content,
        sender: 'bot',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error: unknown) {
      logger.error('Help Bot error', error)
      const errorText = error instanceof Error ? error.message : 'Failed to get response. Please make sure AI is enabled in settings.'
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: `Error: ${errorText}`,
        sender: 'bot',
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#2d2d30] rounded-lg shadow-xl w-[900px] h-[700px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3e3e42] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Help Bot</h2>
            <p className="text-xs text-gray-400 mt-1">
              Ask questions about Torrify - I have access to all project documentation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#3e3e42] rounded transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoadingDocs ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">Loading documentation...</div>
            </div>
          ) : (
            <>
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
                        ? 'bg-red-900/50 text-red-200 border border-red-700'
                        : 'bg-[#1e1e1e] text-gray-200 border border-[#3e3e42]'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">{message.text}</div>
                    <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg px-4 py-2">
                    <div className="text-sm text-gray-400">Thinking...</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-[#3e3e42]">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about Torrify..."
              className="flex-1 bg-[#1e1e1e] border border-[#3e3e42] rounded px-4 py-2 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-500"
              rows={2}
              disabled={isLoading || isLoadingDocs}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isLoadingDocs}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-[#3e3e42] disabled:cursor-not-allowed rounded font-medium transition-colors"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}

export default HelpBot

