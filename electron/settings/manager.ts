import * as fs from 'fs'
import { SETTINGS_DIR, SETTINGS_FILE, LEGACY_SETTINGS_FILE, MAX_RECENT_FILES } from '../constants'
import { getDefaultSettings } from './defaults'
import type { Settings } from './types'
import { logger } from '../utils/logger'

let currentSettings = getDefaultSettings()

export function getCurrentSettings(): Settings {
  return currentSettings
}

export function setCurrentSettings(settings: Settings): void {
  currentSettings = settings
}

function normalizeLoaded(loaded: Settings): Settings {
  if (!Array.isArray(loaded.recentFiles)) {
    loaded.recentFiles = []
  }
  if (!loaded.cadBackend) {
    loaded.cadBackend = 'openscad'
  }
  if (!loaded.build123dPythonPath) {
    loaded.build123dPythonPath = 'python'
  }
  return loaded
}

/** Load persisted settings from disk (current path, or legacy path with migration). */
export function loadSettings(): Settings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8')
      const loaded = normalizeLoaded({ ...getDefaultSettings(), ...JSON.parse(data) })
      currentSettings = loaded
      return loaded
    }
    if (fs.existsSync(LEGACY_SETTINGS_FILE)) {
      const data = fs.readFileSync(LEGACY_SETTINGS_FILE, 'utf-8')
      const loaded = normalizeLoaded({ ...getDefaultSettings(), ...JSON.parse(data) })
      currentSettings = loaded
      saveSettings(loaded)
      return loaded
    }
  } catch (error) {
    logger.error('Error loading settings', error)
  }
  currentSettings = getDefaultSettings()
  return currentSettings
}

/** Persist settings to disk; creates directory if needed and restricts permissions on non-Windows. */
export function saveSettings(settings: Settings): void {
  try {
    if (!fs.existsSync(SETTINGS_DIR)) {
      fs.mkdirSync(SETTINGS_DIR, { recursive: true })
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')

    if (process.platform !== 'win32') {
      fs.chmodSync(SETTINGS_FILE, 0o600)
    }
  } catch (error) {
    logger.error('Error saving settings', error)
  }
}

/** Prepend a file to the recent-files list, dedupe and trim to max size, then persist. */
export function addToRecentFiles(filePath: string): void {
  try {
    currentSettings.recentFiles = currentSettings.recentFiles.filter((file) => file.filePath !== filePath)

    currentSettings.recentFiles.unshift({
      filePath,
      lastOpened: new Date().toISOString()
    })

    if (currentSettings.recentFiles.length > MAX_RECENT_FILES) {
      currentSettings.recentFiles = currentSettings.recentFiles.slice(0, MAX_RECENT_FILES)
    }

    saveSettings(currentSettings)
  } catch (error) {
    logger.error('Error adding to recent files', error)
  }
}
