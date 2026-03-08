import { useEffect, useRef } from 'react'
import { DEFAULT_MODELS } from '../services/llm'
import type { Settings, SettingsTab } from '../components/settings/types'

/** Callback contract used to wire native menu actions into renderer behavior. */
export interface MenuHandlerConfig {
  handleNewFile: () => void
  handleOpenFile: () => void
  handleSaveFile: () => void
  handleSaveAs: () => void
  handleExportScad: () => void
  handleExportStl: () => void
  handleRender: () => void
  updateLlmSettings: (updater: (llm: Settings['llm']) => Settings['llm']) => Promise<void>
  onOpenSettings: (tab?: SettingsTab) => void
  onOpenHelpBot: () => void
  onShowDemo: () => void
}

export function useMenuHandlers(handlers: MenuHandlerConfig) {
  const handlersRef = useRef(handlers)

  // Always keep handlersRef up-to-date with the latest render closure context.
  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    // We register one set of stable proxy listeners that delegate to whatever is currently in handlersRef.
    const map: Record<string, () => void> = {
      'menu-new-file': () => handlersRef.current.handleNewFile(),
      'menu-open-file': () => handlersRef.current.handleOpenFile(),
      'menu-save-file': () => handlersRef.current.handleSaveFile(),
      'menu-save-as': () => handlersRef.current.handleSaveAs(),
      'menu-export-scad': () => handlersRef.current.handleExportScad(),
      'menu-export-stl': () => handlersRef.current.handleExportStl(),
      'menu-render': () => handlersRef.current.handleRender(),
      'menu-llm-toggle': () =>
        handlersRef.current.updateLlmSettings((llm) => ({ ...llm, enabled: !llm.enabled })),
      'menu-llm-byok': () =>
        handlersRef.current.updateLlmSettings((llm) => ({ ...llm, provider: 'gemini', model: DEFAULT_MODELS.gemini })),
      'menu-llm-pro': () =>
        handlersRef.current.updateLlmSettings((llm) => ({
          ...llm,
          provider: 'gateway',
          model: DEFAULT_MODELS.gateway,
          apiKey: '',
          gatewayLicenseKey: llm.gatewayLicenseKey ?? ''
        })),
      'menu-llm-settings': () => handlersRef.current.onOpenSettings('ai'),
      'menu-help-bot': () => handlersRef.current.onOpenHelpBot(),
      'menu-show-demo': () => handlersRef.current.onShowDemo(),
      'menu-settings': () => handlersRef.current.onOpenSettings('general')
    }

    Object.entries(map).forEach(([channel, handler]) => {
      window.electronAPI.onMenuEvent(channel, handler)
    })

    return () => {
      Object.keys(map).forEach((channel) => {
        window.electronAPI.removeMenuListener(channel)
      })
    }
  }, []) // Empty dependency array ensures we only bind IPC listeners exactly once on component mount.
}
