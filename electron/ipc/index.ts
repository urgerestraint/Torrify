import type { BrowserWindow } from 'electron'
import { registerRenderHandlers } from './render-handlers'
import { registerSettingsHandlers } from './settings-handlers'
import { registerFileHandlers } from './file-handlers'
import { registerProjectHandlers } from './project-handlers'
import { registerRecentHandlers } from './recent-handlers'
import { registerContextHandlers } from './context-handlers'
import { registerWindowDocHandlers } from './window-doc-handlers'
import { registerLlmHandlers } from './llm-handlers'

/**
 * Registers all IPC handlers. Call once when the app is ready.
 * getMainWindow is a getter so window-doc handlers can access the current main window.
 */
export function registerAllHandlers(getMainWindow: () => BrowserWindow | null): void {
  registerRenderHandlers()
  registerSettingsHandlers()
  registerFileHandlers()
  registerProjectHandlers()
  registerRecentHandlers()
  registerContextHandlers()
  registerWindowDocHandlers(getMainWindow)
  registerLlmHandlers(getMainWindow)
}
