/**
 * Electron Main Process Entry Point.
 * 
 * This module orchestrates the application lifecycle, manages the primary
 * window instance, enforces security policies (CSP), and delegates IPC 
 * communication to specialized handler modules.
 */
import { app, BrowserWindow, session } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { loadSettings } from './settings'
import { SETTINGS_FILE } from './constants'
import { buildApplicationMenu } from './menu/builder'
import { ensureTempDir, cleanupTempFiles, cleanupAllTempFiles } from './utils/temp'
import { registerAllHandlers } from './ipc'
import { logger } from './utils/logger'
import { initAutoUpdater } from './updater'

/** 
 * Content Security Policy (CSP) for production.
 * Restricts resource loading to trusted origins to mitigate XSS and data injection.
 */
const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://generativelanguage.googleapis.com https://openrouter.ai https://api.openai.com https://the-gatekeeper-production.up.railway.app https://raw.githubusercontent.com http://127.0.0.1:11434 http://localhost:11434 https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
].join('; ')

// Initialize application settings from disk immediately
loadSettings()

let mainWindow: BrowserWindow | null = null

function getRendererHtmlPath(): string {
  const candidates = [
    path.join(__dirname, '../../dist/index.html'),
    path.join(__dirname, '../dist/index.html'),
  ]
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]
}

/**
 * Enforce single instance lock.
 * If another instance is launched, focus the already running window.
 */
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  })
}

/**
 * Creates and configures the main application window.
 */
function createWindow(): void {
  if (mainWindow) {
    return
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      // Vite-plugin-electron bundles the preload to the same output directory
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Load either the Vite dev server or the production build
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(getRendererHtmlPath())
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  /**
   * Security: Restrict navigation to local app origins.
   * In development, also allow the Vite dev server URL so that HMR reloads work.
   */
  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isFile = url.startsWith('file://')
    const isDevServer = devServerUrl ? url.startsWith(devServerUrl) : false
    if (!isFile && !isDevServer) {
      event.preventDefault()
    }
  })

  /**
   * Security: Only allow specific protocols for new window requests (e.g., chat image previews).
   */
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return { action: 'allow' }
    }
    return { action: 'deny' }
  })

  // Attach the custom application menu
  buildApplicationMenu(mainWindow)
}

/**
 * Handle CLI flags for debugging and maintenance.
 */
const args = process.argv.slice(1)
if (args.includes('--reset-settings') || args.includes('--wipe-settings')) {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      fs.unlinkSync(SETTINGS_FILE)
      logger.info('Settings file deleted. Restarting with default settings.')
    }
    loadSettings()
  } catch (error) {
    logger.error('Failed to reset settings', error)
  }
}

/**
 * App initialization sequence.
 */
app.whenReady().then(() => {
  // Inject CSP headers in production
  if (!process.env.VITE_DEV_SERVER_URL) {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [PRODUCTION_CSP],
        },
      })
    })
  }

  // Set up infrastructure and window
  ensureTempDir()
  createWindow()

  // Register all IPC message handlers
  registerAllHandlers(() => mainWindow)
  initAutoUpdater(() => mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/**
 * Shutdown logic.
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  cleanupAllTempFiles()
})

/**
 * Periodic background maintenance: clean up stale temporary files.
 */
setInterval(() => {
  cleanupTempFiles()
}, 30 * 60 * 1000)
