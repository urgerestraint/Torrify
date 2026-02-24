import { app, dialog, type BrowserWindow, type MessageBoxOptions } from 'electron'
import { autoUpdater } from 'electron-updater'
import { logger } from './utils/logger'

const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

let updateTimer: NodeJS.Timeout | null = null

function canRunAutoUpdater(): boolean {
  if (process.env.VITE_DEV_SERVER_URL) {
    return false
  }
  if (process.env.ELECTRON_DISABLE_AUTO_UPDATE === '1') {
    return false
  }
  return true
}

async function promptAndInstall(mainWindow: BrowserWindow | null): Promise<void> {
  const options: MessageBoxOptions = {
    type: 'info',
    buttons: ['Restart now', 'Later'],
    defaultId: 0,
    cancelId: 1,
    title: 'Update ready',
    message: 'A new version of Torrify has been downloaded.',
    detail: 'Restart now to apply the update.',
  }

  const result = mainWindow
    ? await dialog.showMessageBox(mainWindow, options)
    : await dialog.showMessageBox(options)

  if (result.response === 0) {
    autoUpdater.quitAndInstall()
  }
}

export function initAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  if (!canRunAutoUpdater()) {
    logger.info('Auto-updater disabled in this environment.')
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for app updates...')
  })

  autoUpdater.on('update-available', (info) => {
    logger.info('Update available:', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    logger.info('No update available.')
  })

  autoUpdater.on('error', (error) => {
    logger.error('Auto-updater failed', error)
  })

  autoUpdater.on('download-progress', (progress) => {
    logger.info(`Update download progress: ${Math.round(progress.percent)}%`)
  })

  autoUpdater.on('update-downloaded', () => {
    void promptAndInstall(getMainWindow()).catch((error) => {
      logger.error('Failed to show update prompt', error)
    })
  })

  app.whenReady().then(() => {
    setTimeout(() => {
      void autoUpdater.checkForUpdates().catch((error) => {
        logger.error('Initial update check failed', error)
      })
    }, 5000)

    updateTimer = setInterval(() => {
      void autoUpdater.checkForUpdates().catch((error) => {
        logger.error('Periodic update check failed', error)
      })
    }, UPDATE_CHECK_INTERVAL_MS)
  })

  app.on('before-quit', () => {
    if (updateTimer) {
      clearInterval(updateTimer)
      updateTimer = null
    }
  })
}
