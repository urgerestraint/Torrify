import { useEffect, useRef } from 'react'
import { DEFAULT_MODELS } from '../services/llm'
import type { Settings } from '../components/settings/types'

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
  onOpenSettings: () => void
  onOpenHelpBot: () => void
  onShowDemo: () => void
}

/**
 * Registers and cleans up Electron menu event handlers.
 *
 * The preload bridge manages listeners per channel. On each effect pass and unmount,
 * listeners are removed before re-registering to avoid duplicate invocations.
 */
export function useMenuHandlers(handlers: MenuHandlerConfig) {
  const menuHandlersRef = useRef<Record<string, () => void>>({})

  useEffect(() => {
    Object.keys(menuHandlersRef.current).forEach((channel) => {
      window.electronAPI.removeMenuListener(channel)
    })

    const map: Record<string, () => void> = {
      'menu-new-file': handlers.handleNewFile,
      'menu-open-file': handlers.handleOpenFile,
      'menu-save-file': handlers.handleSaveFile,
      'menu-save-as': handlers.handleSaveAs,
      'menu-export-scad': handlers.handleExportScad,
      'menu-export-stl': handlers.handleExportStl,
      'menu-render': handlers.handleRender,
      'menu-llm-toggle': () => handlers.updateLlmSettings((llm) => ({ ...llm, enabled: !llm.enabled })),
      'menu-llm-byok': () =>
        handlers.updateLlmSettings((llm) => ({ ...llm, provider: 'gemini', model: DEFAULT_MODELS.gemini })),
      'menu-llm-pro': () =>
        handlers.updateLlmSettings((llm) => ({
          ...llm,
          provider: 'gateway',
          model: DEFAULT_MODELS.gateway,
          apiKey: '',
          gatewayLicenseKey: llm.gatewayLicenseKey ?? ''
        })),
      'menu-llm-settings': handlers.onOpenSettings,
      'menu-help-bot': handlers.onOpenHelpBot,
      'menu-show-demo': handlers.onShowDemo,
      'menu-settings': handlers.onOpenSettings
    }

    menuHandlersRef.current = map
    Object.entries(map).forEach(([channel, handler]) => {
      window.electronAPI.onMenuEvent(channel, handler)
    })

    return () => {
      Object.keys(menuHandlersRef.current).forEach((channel) => {
        window.electronAPI.removeMenuListener(channel)
      })
    }
  }, [
    handlers.handleNewFile,
    handlers.handleOpenFile,
    handlers.handleSaveFile,
    handlers.handleSaveAs,
    handlers.handleExportScad,
    handlers.handleExportStl,
    handlers.handleRender,
    handlers.updateLlmSettings,
    handlers.onOpenSettings,
    handlers.onOpenHelpBot,
    handlers.onShowDemo,
    handlers
  ])
}
