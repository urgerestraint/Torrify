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
  const {
    handleNewFile,
    handleOpenFile,
    handleSaveFile,
    handleSaveAs,
    handleExportScad,
    handleExportStl,
    handleRender,
    updateLlmSettings,
    onOpenSettings,
    onOpenHelpBot,
    onShowDemo
  } = handlers

  useEffect(() => {
    Object.keys(menuHandlersRef.current).forEach((channel) => {
      window.electronAPI.removeMenuListener(channel)
    })

    const map: Record<string, () => void> = {
      'menu-new-file': handleNewFile,
      'menu-open-file': handleOpenFile,
      'menu-save-file': handleSaveFile,
      'menu-save-as': handleSaveAs,
      'menu-export-scad': handleExportScad,
      'menu-export-stl': handleExportStl,
      'menu-render': handleRender,
      'menu-llm-toggle': () => updateLlmSettings((llm) => ({ ...llm, enabled: !llm.enabled })),
      'menu-llm-byok': () =>
        updateLlmSettings((llm) => ({ ...llm, provider: 'gemini', model: DEFAULT_MODELS.gemini })),
      'menu-llm-pro': () =>
        updateLlmSettings((llm) => ({
          ...llm,
          provider: 'gateway',
          model: DEFAULT_MODELS.gateway,
          apiKey: '',
          gatewayLicenseKey: llm.gatewayLicenseKey ?? ''
        })),
      'menu-llm-settings': onOpenSettings,
      'menu-help-bot': onOpenHelpBot,
      'menu-show-demo': onShowDemo,
      'menu-settings': onOpenSettings
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
    handleNewFile,
    handleOpenFile,
    handleSaveFile,
    handleSaveAs,
    handleExportScad,
    handleExportStl,
    handleRender,
    updateLlmSettings,
    onOpenSettings,
    onOpenHelpBot,
    onShowDemo
  ])
}
