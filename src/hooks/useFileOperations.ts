import { useState, useCallback } from 'react'
import type { Message } from '../components/ChatPanel'
import type { CADBackend } from '../services/cad'

const DEFAULT_CODE = ''

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return typeof error === 'string' ? error : 'Unknown error'
}

export function getDefaultMessages(backend: CADBackend): Message[] {
  return [
    {
      id: 1,
      text:
        backend === 'build123d'
          ? "Hello! I'm your build123d assistant powered by AI. Ask me anything about build123d Python CAD, and I can help you write code, debug issues, or explain concepts!"
          : "Hello! I'm your OpenSCAD assistant powered by AI. Ask me anything about OpenSCAD, and I can help you write code, debug issues, or explain concepts!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]
}

export interface UseFileOperationsSetters {
  setCode: (v: string) => void
  setMessages: (v: Message[] | ((prev: Message[]) => Message[])) => void
  setStlBase64: (v: string | null) => void
  setPreviewImage: (v: string | null) => void
  setRenderError: (v: string | null) => void
  setEditorKey: (v: number | ((prev: number) => number)) => void
}

export interface UseFileOperationsCallbacks {
  confirmUnsavedChanges: () => Promise<boolean>
  showAlert: (title: string, message: string) => Promise<void>
  loadRecentFiles: () => Promise<void>
}

export function useFileOperations(
  code: string,
  cadBackend: CADBackend,
  setters: UseFileOperationsSetters,
  callbacks: UseFileOperationsCallbacks
) {
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [originalCode, setOriginalCode] = useState(DEFAULT_CODE)

  const { setCode, setMessages, setStlBase64, setPreviewImage, setRenderError, setEditorKey } = setters
  const { confirmUnsavedChanges, showAlert, loadRecentFiles } = callbacks

  const handleNewFile = useCallback(async () => {
    const confirmed = await confirmUnsavedChanges()
    if (!confirmed) return
    setCode(DEFAULT_CODE)
    setCurrentFilePath(null)
    setOriginalCode(DEFAULT_CODE)
    setHasUnsavedChanges(false)
    setMessages(getDefaultMessages(cadBackend))
    setStlBase64(null)
    setPreviewImage(null)
    setRenderError(null)
    setEditorKey((prev) => prev + 1)
  }, [cadBackend, confirmUnsavedChanges, setCode, setMessages, setStlBase64, setPreviewImage, setRenderError, setEditorKey])

  const handleOpenFile = useCallback(async () => {
    const confirmed = await confirmUnsavedChanges()
    if (!confirmed) return
    try {
      const result = await window.electronAPI.openScadFile(cadBackend)
      if (!result.canceled && result.filePath && result.code !== undefined) {
        setCode(result.code)
        setCurrentFilePath(result.filePath)
        setOriginalCode(result.code)
        setHasUnsavedChanges(false)
        setMessages(getDefaultMessages(cadBackend))
        setStlBase64(null)
        setPreviewImage(null)
        setRenderError(null)
        setEditorKey((prev) => prev + 1)
        await loadRecentFiles()
      } else if (result.error) {
        await showAlert('Open File Failed', `Failed to open file: ${result.error}`)
      }
    } catch (error) {
      await showAlert('Open File Failed', `Failed to open file: ${getErrorMessage(error)}`)
    }
  }, [cadBackend, confirmUnsavedChanges, showAlert, loadRecentFiles, setCode, setMessages, setStlBase64, setPreviewImage, setRenderError, setEditorKey])

  const handleSaveFile = useCallback(async () => {
    try {
      const result = await window.electronAPI.saveScadFile(code, currentFilePath || undefined, cadBackend)
      if (!result.canceled && result.filePath) {
        setCurrentFilePath(result.filePath)
        setOriginalCode(code)
        setHasUnsavedChanges(false)
        await loadRecentFiles()
      } else if (result.error) {
        await showAlert('Save Failed', `Failed to save file: ${result.error}`)
      }
    } catch (error) {
      await showAlert('Save Failed', `Failed to save file: ${getErrorMessage(error)}`)
    }
  }, [code, currentFilePath, cadBackend, showAlert, loadRecentFiles])

  const handleSaveAs = useCallback(async () => {
    try {
      const result = await window.electronAPI.saveScadFile(code, undefined, cadBackend)
      if (!result.canceled && result.filePath) {
        setCurrentFilePath(result.filePath)
        setOriginalCode(code)
        setHasUnsavedChanges(false)
        await loadRecentFiles()
      } else if (result.error) {
        await showAlert('Save As Failed', `Failed to save file: ${result.error}`)
      }
    } catch (error) {
      await showAlert('Save As Failed', `Failed to save file: ${getErrorMessage(error)}`)
    }
  }, [code, cadBackend, showAlert, loadRecentFiles])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode)
      setHasUnsavedChanges(newCode !== originalCode)
    },
    [originalCode, setCode]
  )

  return {
    currentFilePath,
    setCurrentFilePath,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    originalCode,
    setOriginalCode,
    handleNewFile,
    handleOpenFile,
    handleSaveFile,
    handleSaveAs,
    handleCodeChange,
    DEFAULT_CODE,
    getDefaultMessages
  }
}
