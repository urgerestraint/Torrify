/**
 * Electron main process entry point.
 * Handles window lifecycle, application menu, and delegates IPC to ipc/ modules.
 */
import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { loadSettings } from './settings'
import { SETTINGS_FILE } from './constants'
import { buildApplicationMenu } from './menu/builder'
import { ensureTempDir, cleanupTempFiles, cleanupAllTempFiles } from './utils/temp'
import { registerAllHandlers } from './ipc'
import { logger } from './utils/logger'

// Initialize settings from disk when the main process loads
loadSettings()

let mainWindow: BrowserWindow | null = null

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

function createWindow(): void {
  if (mainWindow) {
    return
  }
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  buildApplicationMenu(mainWindow)
}

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

app.whenReady().then(() => {
  ensureTempDir()
  createWindow()
  registerAllHandlers(() => mainWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  cleanupAllTempFiles()
})

setInterval(() => {
  cleanupTempFiles()
}, 30 * 60 * 1000)
