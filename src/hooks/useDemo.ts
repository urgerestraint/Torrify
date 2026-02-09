import { useState, useCallback } from 'react'
import type { Message } from '../components/ChatPanel'
import { DEMO_CODE, DEMO_PROMPT, DEMO_RESPONSE } from '../constants/demo'
import { logger } from '../utils/logger'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return typeof error === 'string' ? error : 'Unknown error'
}

export interface UseDemoSetters {
  setMessages: (v: Message[] | ((prev: Message[]) => Message[])) => void
  setCode: (v: string) => void
  setOriginalCode: (v: string) => void
  setHasUnsavedChanges: (v: boolean) => void
  setCurrentFilePath: (v: string | null) => void
  setEditorKey: (v: number | ((prev: number) => number)) => void
  setStlBase64: (v: string | null) => void
  setPreviewImage: (v: string | null) => void
  setRenderError: (v: string | null) => void
  setIsRendering: (v: boolean) => void
}

export function useDemo(setters: UseDemoSetters) {
  const [isDemoRunning, setIsDemoRunning] = useState(false)
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false)

  const {
    setMessages,
    setCode,
    setOriginalCode,
    setHasUnsavedChanges,
    setCurrentFilePath,
    setEditorKey,
    setStlBase64,
    setPreviewImage,
    setRenderError,
    setIsRendering
  } = setters

  const runDemo = useCallback(async () => {
    if (isDemoRunning) return
    setIsDemoRunning(true)
    setIsDemoDialogOpen(false)

    const userMessage: Message = {
      id: Date.now(),
      text: DEMO_PROMPT,
      sender: 'user',
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, userMessage])

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const botMessage: Message = {
      id: Date.now() + 1,
      text: DEMO_RESPONSE,
      sender: 'bot',
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, botMessage])

    await new Promise((resolve) => setTimeout(resolve, 500))
    setCode(DEMO_CODE)
    setOriginalCode(DEMO_CODE)
    setHasUnsavedChanges(false)
    setCurrentFilePath(null)
    setEditorKey((prev) => prev + 1)

    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsRendering(true)
    setRenderError(null)
    try {
      const result = await window.electronAPI.renderStl(DEMO_CODE)
      if (result.success && result.stlBase64) {
        setStlBase64(result.stlBase64)
        setPreviewImage(null)
      }
    } catch (error) {
      logger.error('Demo render error', error)
      setRenderError(getErrorMessage(error) || 'Failed to render demo')
    } finally {
      setIsRendering(false)
    }

    try {
      const settings = await window.electronAPI.getSettings()
      await window.electronAPI.saveSettings({ ...settings, hasSeenDemo: true })
    } catch (error) {
      logger.error('Failed to save demo status', error)
    } finally {
      setIsDemoRunning(false)
    }
  }, [
    isDemoRunning,
    setMessages,
    setCode,
    setOriginalCode,
    setHasUnsavedChanges,
    setCurrentFilePath,
    setEditorKey,
    setStlBase64,
    setPreviewImage,
    setRenderError,
    setIsRendering
  ])

  return {
    isDemoRunning,
    isDemoDialogOpen,
    setIsDemoDialogOpen,
    runDemo
  }
}
