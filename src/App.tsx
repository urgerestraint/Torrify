import { useState, useEffect, useCallback, useRef } from 'react'
import ChatPanel, { type Message } from './components/ChatPanel'
import EditorPanel from './components/EditorPanel'
import PreviewPanel from './components/PreviewPanel'
import SettingsModal from './components/SettingsModal'
import WelcomeModal from './components/WelcomeModal'
import DemoDialog from './components/DemoDialog'
import HelpBot from './components/HelpBot'
import ConfirmDialog from './components/ConfirmDialog'
import { FileToolbar } from './components/FileToolbar'
import { ProjectToolbar } from './components/ProjectToolbar'
import { BACKEND_NAMES } from './services/cad'
import type { CADBackend } from './services/cad'
import { logger } from './utils/logger'
import {
  useFileOperations,
  useRecentFiles,
  useMenuHandlers,
  useDemo,
  getDefaultMessages
} from './hooks'
import type { Settings } from './components/settings'

interface DialogState {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  showCancel: boolean
  onConfirm: () => void
  onCancel?: () => void
}

function getErrorMsg(error: unknown): string {
  if (error instanceof Error) return error.message
  return typeof error === 'string' ? error : 'Unknown error'
}

function App() {
  const [code, setCode] = useState('')
  const [messages, setMessages] = useState<Message[]>(() => getDefaultMessages('openscad'))
  const hasUnsavedChangesRef = useRef(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [stlBase64, setStlBase64] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false)
  const [, setLlmSettings] = useState<Settings['llm'] | null>(null)
  const [cadBackend, setCadBackend] = useState<CADBackend>('openscad')
  const [, setOpenRouterKeySet] = useState<boolean | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [settingsVersion, setSettingsVersion] = useState(0)
  const [dialogState, setDialogState] = useState<DialogState | null>(null)
  const [pendingSnapshots, setPendingSnapshots] = useState<string[]>([])
  const [pendingDiagnosis, setPendingDiagnosis] = useState<{ error: string; code: string } | null>(null)

  const showConfirm = useCallback(
    (title: string, message: string, options?: { confirmLabel?: string; cancelLabel?: string }) => {
      return new Promise<boolean>((resolve) => {
        setDialogState({
          title,
          message,
          confirmLabel: options?.confirmLabel ?? 'Continue',
          cancelLabel: options?.cancelLabel ?? 'Cancel',
          showCancel: true,
          onConfirm: () => {
            setDialogState(null)
            resolve(true)
          },
          onCancel: () => {
            setDialogState(null)
            resolve(false)
          }
        })
      })
    },
    []
  )

  const showAlert = useCallback((title: string, message: string, confirmLabel = 'OK') => {
    return new Promise<void>((resolve) => {
      setDialogState({
        title,
        message,
        confirmLabel,
        showCancel: false,
        onConfirm: () => {
          setDialogState(null)
          resolve()
        }
      })
    })
  }, [])

  const recentFilesState = useRecentFiles()
  const {
    recentFiles,
    isRecentMenuOpen,
    setIsRecentMenuOpen,
    recentMenuRef,
    recentMenuButtonRef,
    recentMenuItemsRef,
    loadRecentFiles,
    handleRecentMenuKeyDown,
    handleRecentMenuButtonKeyDown
  } = recentFilesState

  const fileOpsSetters = {
    setCode,
    setMessages,
    setStlBase64,
    setPreviewImage,
    setRenderError,
    setEditorKey
  }
  const confirmUnsavedChanges = useCallback(async () => {
    if (!hasUnsavedChangesRef.current) return true
    return showConfirm(
      'Unsaved changes',
      'You have unsaved changes. Do you want to continue without saving?',
      { confirmLabel: 'Continue', cancelLabel: 'Cancel' }
    )
  }, [showConfirm])

  const fileOpsCallbacks = {
    confirmUnsavedChanges,
    showAlert,
    loadRecentFiles
  }

  const fileOps = useFileOperations(code, cadBackend, fileOpsSetters, fileOpsCallbacks)

  useEffect(() => {
    hasUnsavedChangesRef.current = fileOps.hasUnsavedChanges
  }, [fileOps.hasUnsavedChanges])

  const demoSetters = {
    setMessages,
    setCode,
    setOriginalCode: fileOps.setOriginalCode,
    setHasUnsavedChanges: fileOps.setHasUnsavedChanges,
    setCurrentFilePath: fileOps.setCurrentFilePath,
    setEditorKey,
    setStlBase64,
    setPreviewImage,
    setRenderError,
    setIsRendering
  }
  const demoState = useDemo(demoSetters)
  const { isDemoDialogOpen, setIsDemoDialogOpen, runDemo } = demoState

  useEffect(() => {
    const checkWelcome = async () => {
      try {
        const shouldShow = await window.electronAPI.shouldShowWelcome()
        setIsWelcomeOpen(shouldShow)
        if (!shouldShow) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          const settings = await window.electronAPI.getSettings()
          if (!settings.hasSeenDemo) setIsDemoDialogOpen(true)
        }
      } catch (error) {
        logger.error('Failed to check welcome status', error)
        setIsWelcomeOpen(true)
      }
    }
    checkWelcome()
  }, [setIsDemoDialogOpen])

  const refreshSettings = useCallback(async () => {
    try {
      const settings = await window.electronAPI.getSettings()
      setLlmSettings(settings.llm)
      setCadBackend(settings.cadBackend || 'openscad')
      if (settings.llm.provider === 'gateway') {
        setOpenRouterKeySet(!!settings.llm.gatewayLicenseKey?.trim())
      } else if (settings.llm.provider === 'openrouter') {
        const key = await window.electronAPI.getOpenRouterKey()
        setOpenRouterKeySet(!!key)
      } else {
        setOpenRouterKeySet(null)
      }
      setSettingsVersion((v) => v + 1)
    } catch (error) {
      logger.error('Failed to load settings', error)
    }
  }, [])

  useEffect(() => {
    refreshSettings()
  }, [refreshSettings])

  const prevCadBackendRef = useRef<CADBackend>(cadBackend)
  useEffect(() => {
    if (prevCadBackendRef.current !== cadBackend) {
      setMessages(fileOps.getDefaultMessages(cadBackend))
      setCode(fileOps.DEFAULT_CODE)
      fileOps.setOriginalCode(fileOps.DEFAULT_CODE)
      fileOps.setCurrentFilePath(null)
      fileOps.setHasUnsavedChanges(false)
      setStlBase64(null)
      setPreviewImage(null)
      setRenderError(null)
      setEditorKey((k) => k + 1)
      setPendingSnapshots([])
      setPendingDiagnosis(null)
      prevCadBackendRef.current = cadBackend
    }
  }, [cadBackend, fileOps])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recentMenuRef.current && !recentMenuRef.current.contains(event.target as Node)) {
        setIsRecentMenuOpen(false)
      }
    }
    if (isRecentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isRecentMenuOpen, recentMenuRef, setIsRecentMenuOpen])

  const handleRender = useCallback(async () => {
    setIsRendering(true)
    setRenderError(null)
    try {
      const result = await window.electronAPI.renderStl(code)
      if (result.success) {
        setStlBase64(result.stlBase64)
        setPreviewImage(null)
      }
    } catch (error) {
      logger.error('Render error', error)
      setRenderError(getErrorMsg(error) || 'Failed to render')
    } finally {
      setIsRendering(false)
    }
  }, [code])

  useEffect(() => {
    const updateTitle = async () => {
      let title = 'Torrify'
      if (fileOps.currentFilePath) {
        const fileName = fileOps.currentFilePath.split(/[/\\]/).pop() || 'Untitled'
        title = `${fileOps.hasUnsavedChanges ? '* ' : ''}${fileName} - Torrify`
      } else {
        title = `${fileOps.hasUnsavedChanges ? '* ' : ''}Untitled - Torrify`
      }
      await window.electronAPI.setWindowTitle(title)
    }
    updateTitle()
  }, [fileOps.currentFilePath, fileOps.hasUnsavedChanges])

  const handleOpenRecentFile = useCallback(
    async (filePath: string) => {
      const confirmed = await confirmUnsavedChanges()
      if (!confirmed) return
      try {
        const result = await window.electronAPI.openRecentFile(filePath)
        if (!result.canceled && result.filePath) {
          if (result.isProject && result.project) {
            const project = result.project
            const chat: Message[] = project.chat
              ? project.chat.map((m) => ({
                  ...m,
                  timestamp: typeof m.timestamp === 'string' ? new Date(m.timestamp) : (m.timestamp as Date)
                }))
              : fileOps.getDefaultMessages(cadBackend)
            setCode(project.code ?? fileOps.DEFAULT_CODE)
            setMessages(chat)
            setStlBase64(project.stlBase64 ?? null)
            setPreviewImage(null)
            setRenderError(null)
            fileOps.setCurrentFilePath(null)
            fileOps.setOriginalCode(project.code ?? fileOps.DEFAULT_CODE)
            fileOps.setHasUnsavedChanges(false)
            setEditorKey((prev) => prev + 1)
          } else if (result.code !== undefined) {
            setCode(result.code)
            fileOps.setCurrentFilePath(result.filePath)
            fileOps.setOriginalCode(result.code)
            fileOps.setHasUnsavedChanges(false)
            setMessages(fileOps.getDefaultMessages(cadBackend))
            setStlBase64(null)
            setPreviewImage(null)
            setRenderError(null)
            setEditorKey((prev) => prev + 1)
          }
          setIsRecentMenuOpen(false)
          await loadRecentFiles()
        } else if (result.error) {
          if (result.error.includes('no longer exists')) {
            const remove = await showConfirm(
              'Remove recent file?',
              `File no longer exists:\n${filePath}\n\nRemove from recent files?`,
              { confirmLabel: 'Remove', cancelLabel: 'Keep' }
            )
            if (remove) {
              await window.electronAPI.removeRecentFile(filePath)
              await loadRecentFiles()
            }
          } else {
            await showAlert('Open File Failed', `Failed to open file: ${result.error}`)
          }
        }
      } catch (error) {
        await showAlert('Open File Failed', `Failed to open file: ${getErrorMsg(error)}`)
      }
    },
    [
      confirmUnsavedChanges,
      loadRecentFiles,
      cadBackend,
      showAlert,
      showConfirm,
      fileOps,
      setIsRecentMenuOpen
    ]
  )

  const handleClearRecentFiles = useCallback(async () => {
    const confirmed = await showConfirm('Clear recent files?', 'Clear all recent files?', {
      confirmLabel: 'Clear',
      cancelLabel: 'Cancel'
    })
    if (confirmed) {
      try {
        await window.electronAPI.clearRecentFiles()
        await loadRecentFiles()
      } catch (error) {
        logger.error('Failed to clear recent files', error)
      }
    }
  }, [loadRecentFiles, showConfirm])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault()
        fileOps.handleOpenFile()
      }
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        fileOps.handleNewFile()
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        fileOps.handleSaveAs()
      }
      if (e.ctrlKey && e.key === 's' && !e.shiftKey && fileOps.currentFilePath) {
        e.preventDefault()
        fileOps.handleSaveFile()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fileOps.handleOpenFile, fileOps.handleNewFile, fileOps.handleSaveAs, fileOps.handleSaveFile, fileOps.currentFilePath, fileOps])

  const handleSaveProject = useCallback(async () => {
    const project = {
      version: 1,
      savedAt: new Date().toISOString(),
      code,
      stlBase64,
      chat: messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() }))
    }
    try {
      await window.electronAPI.saveProject(project)
    } catch (error) {
      logger.error('Save project failed', error)
    }
  }, [code, stlBase64, messages])

  const handleLoadProject = useCallback(async () => {
    try {
      const result = await window.electronAPI.loadProject()
      if (!result || result.canceled) {
        if (result?.error) await showAlert('Load Project Failed', `Failed to load project: ${result.error}`)
        return
      }
      if (!result.project) {
        await showAlert('Load Project Failed', 'Invalid project file')
        return
      }
      const project = result.project
      setCode(project.code ?? fileOps.DEFAULT_CODE)
      setStlBase64(project.stlBase64 ?? null)
      setPreviewImage(null)
      setRenderError(null)
      fileOps.setCurrentFilePath(null)
      fileOps.setOriginalCode(project.code ?? fileOps.DEFAULT_CODE)
      fileOps.setHasUnsavedChanges(false)
      setEditorKey((prev) => prev + 1)
      if (Array.isArray(project.chat)) {
        setMessages(
          project.chat.map((m: Message & { timestamp: string }) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        )
      } else {
        setMessages(fileOps.getDefaultMessages(cadBackend))
      }
    } catch (error) {
      await showAlert('Load Project Failed', `Failed to load project: ${getErrorMsg(error)}`)
    }
  }, [showAlert, fileOps, cadBackend])

  const handleExportScad = useCallback(async () => {
    try {
      await window.electronAPI.exportScad(code, cadBackend)
    } catch (error) {
      logger.error('Export source failed', error)
    }
  }, [code, cadBackend])

  const handleExportStl = useCallback(async () => {
    try {
      await window.electronAPI.exportStl(stlBase64)
    } catch (error) {
      logger.error('Export STL failed', error)
    }
  }, [stlBase64])

  const updateLlmSettings = useCallback(async (updater: (llm: Settings['llm']) => Settings['llm']) => {
    const settings = await window.electronAPI.getSettings()
    const updated = { ...settings, llm: updater(settings.llm) }
    await window.electronAPI.saveSettings(updated)
    setLlmSettings(updated.llm)
    if (updated.llm.provider === 'gateway') {
      setOpenRouterKeySet(!!updated.llm.gatewayLicenseKey?.trim())
    } else if (updated.llm.provider === 'openrouter') {
      const key = await window.electronAPI.getOpenRouterKey()
      setOpenRouterKeySet(!!key)
    } else {
      setOpenRouterKeySet(null)
    }
  }, [])

  const [isHelpBotOpen, setIsHelpBotOpen] = useState(false)

  useMenuHandlers({
    handleNewFile: fileOps.handleNewFile,
    handleOpenFile: fileOps.handleOpenFile,
    handleSaveFile: fileOps.handleSaveFile,
    handleSaveAs: fileOps.handleSaveAs,
    handleExportScad,
    handleExportStl,
    handleRender,
    updateLlmSettings,
    onOpenSettings: () => setIsSettingsOpen(true),
    onOpenHelpBot: () => setIsHelpBotOpen(true),
    onShowDemo: () => setIsDemoDialogOpen(true)
  })

  const handleSendSnapshot = useCallback((dataUrl: string) => {
    setPendingSnapshots((prev) => [...prev, dataUrl])
  }, [])

  const handleDiagnoseError = useCallback(
    (errorMessage: string) => {
      setPendingDiagnosis({ error: errorMessage, code })
    },
    [code]
  )

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-white overflow-hidden">
      <div className="h-12 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Torrify</h1>
          <span className="text-xs text-gray-400">{BACKEND_NAMES[cadBackend]} IDE</span>
        </div>
        <div className="flex items-center gap-2">
          <FileToolbar
            currentFilePath={fileOps.currentFilePath}
            recentFiles={recentFiles}
            isRecentMenuOpen={isRecentMenuOpen}
            setIsRecentMenuOpen={setIsRecentMenuOpen}
            recentMenuRef={recentMenuRef}
            recentMenuButtonRef={recentMenuButtonRef}
            recentMenuItemsRef={recentMenuItemsRef}
            onNewFile={fileOps.handleNewFile}
            onOpenFile={fileOps.handleOpenFile}
            onSaveFile={fileOps.handleSaveFile}
            onSaveAs={fileOps.handleSaveAs}
            onOpenRecentFile={handleOpenRecentFile}
            onClearRecentFiles={handleClearRecentFiles}
            onRecentMenuKeyDown={handleRecentMenuKeyDown}
            onRecentMenuButtonKeyDown={handleRecentMenuButtonKeyDown}
          />
          <ProjectToolbar
            stlBase64={stlBase64}
            onSaveProject={handleSaveProject}
            onLoadProject={handleLoadProject}
            onExportScad={handleExportScad}
            onExportStl={handleExportStl}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[30%] border-r border-[#3e3e42]">
          <ChatPanel
            key={cadBackend}
            currentCode={code}
            pendingSnapshots={pendingSnapshots}
            onSnapshotsSent={() => setPendingSnapshots([])}
            onApplyCode={fileOps.handleCodeChange}
            messages={messages}
            setMessages={setMessages}
            cadBackend={cadBackend}
            pendingDiagnosis={pendingDiagnosis}
            onDiagnosisSent={() => setPendingDiagnosis(null)}
            settingsVersion={settingsVersion}
          />
        </div>
        <div className="w-[40%] border-r border-[#3e3e42]">
          <EditorPanel
            code={code}
            onChange={fileOps.handleCodeChange}
            onRender={handleRender}
            editorKey={editorKey}
            cadBackend={cadBackend}
          />
        </div>
        <div className="w-[30%]">
          <PreviewPanel
            image={previewImage}
            stlBase64={stlBase64}
            isRendering={isRendering}
            error={renderError}
            onRender={handleRender}
            onSendSnapshot={handleSendSnapshot}
            onDiagnoseError={handleDiagnoseError}
            cadBackend={cadBackend}
            hasCode={code.trim().length > 0}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!dialogState}
        title={dialogState?.title ?? ''}
        message={dialogState?.message ?? ''}
        confirmLabel={dialogState?.confirmLabel}
        cancelLabel={dialogState?.cancelLabel}
        showCancel={dialogState?.showCancel}
        onConfirm={() => dialogState?.onConfirm()}
        onCancel={() => dialogState?.onCancel?.()}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={async () => {
          setIsSettingsOpen(false)
          await refreshSettings()
          const shouldShow = await window.electronAPI.shouldShowWelcome()
          setIsWelcomeOpen(shouldShow)
          if (!shouldShow) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            const settings = await window.electronAPI.getSettings()
            if (!settings.hasSeenDemo) setIsDemoDialogOpen(true)
          }
        }}
      />

      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onOpenSettings={() => {
          setIsWelcomeOpen(false)
          setIsSettingsOpen(true)
        }}
      />

      <DemoDialog
        isOpen={isDemoDialogOpen}
        onClose={() => setIsDemoDialogOpen(false)}
        onRunDemo={runDemo}
      />

      <HelpBot isOpen={isHelpBotOpen} onClose={() => setIsHelpBotOpen(false)} />
    </div>
  )
}

export default App
