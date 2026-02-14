/**
 * Settings Manager.
 * 
 * Handles the persistence, migration, and in-memory management of user 
 * configurations. Implements directory creation, file permission enforcement,
 * and data normalization for legacy installs.
 */
import * as fs from 'fs'
import { SETTINGS_DIR, SETTINGS_FILE, LEGACY_SETTINGS_FILE, MAX_RECENT_FILES } from '../constants'
import { getDefaultSettings } from './defaults'
import type { Settings, Writable } from './types'
import { logger } from '../utils/logger'
import { SettingsSchema } from '../validation/schemas'

/** Current in-memory state of application settings */
let currentSettings: Settings = getDefaultSettings()

/**
 * Returns the current active settings.
 */
export function getCurrentSettings(): Settings {
  return currentSettings
}

/**
 * Synchronizes the in-memory state. Note: Does not persist to disk.
 */
export function setCurrentSettings(settings: Settings): void {
  currentSettings = settings
}

/** Legacy token limit used for migration detection */
const LEGACY_MAX_TOKENS = 2048
/** Modern token limit default for large context models */
const DEFAULT_MAX_TOKENS = 128000

/**
 * Ensures a loaded settings object is compatible with the latest schema.
 * Handles missing arrays, backends, and token limit migrations.
 * 
 * @param loaded - Raw settings object from disk
 * @returns Cleaned and validated Settings object
 */
function normalizeLoaded(loaded: Settings): Settings {
  const normalized = { ...loaded } as Writable<Settings>

  if (!Array.isArray(normalized.recentFiles)) {
    normalized.recentFiles = []
  }

  if (!normalized.cadBackend) {
    normalized.cadBackend = 'openscad'
  }

  if (!normalized.build123dPythonPath) {
    normalized.build123dPythonPath = 'python'
  }

  // Migrate legacy token limits to allow for modern LLM usage
  if (normalized.llm?.maxTokens === LEGACY_MAX_TOKENS) {
    (normalized.llm as Writable<Settings['llm']>).maxTokens = DEFAULT_MAX_TOKENS
  }

  return normalized
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function parseSettingsFromJson(data: string): { settings: Settings; hadLegacyMaxTokens: boolean } | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(data)
  } catch {
    return null
  }

  if (!isRecord(parsed)) {
    return null
  }

  const defaults = getDefaultSettings()
  const parsedLlm = isRecord(parsed.llm) ? parsed.llm : {}
  const mergedCandidate = {
    ...defaults,
    ...parsed,
    llm: {
      ...defaults.llm,
      ...parsedLlm
    }
  }

  const parseResult = SettingsSchema.safeParse(mergedCandidate)
  if (!parseResult.success) {
    return null
  }

  const hadLegacyMaxTokens = parseResult.data.llm.maxTokens === LEGACY_MAX_TOKENS
  return {
    settings: normalizeLoaded(parseResult.data),
    hadLegacyMaxTokens
  }
}

/**
 * Loads persisted settings from the filesystem.
 * Attempts migration from legacy paths if the primary configuration is missing.
 * 
 * @returns The active settings after load/migration
 */
export function loadSettings(): Settings {
  try {
    // 1. Primary config path
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8')
      const parsed = parseSettingsFromJson(data)
      if (parsed) {
        currentSettings = parsed.settings

        // Auto-persist if migration occurred
        if (parsed.hadLegacyMaxTokens) {
          saveSettings(parsed.settings)
        }
        return parsed.settings
      }
    }
    
    // 2. Fallback to legacy path (migration)
    if (fs.existsSync(LEGACY_SETTINGS_FILE)) {
      const data = fs.readFileSync(LEGACY_SETTINGS_FILE, 'utf-8')
      const parsed = parseSettingsFromJson(data)
      if (parsed) {
        currentSettings = parsed.settings
        saveSettings(parsed.settings)
        return parsed.settings
      }
    }
  } catch (error: unknown) {
    logger.error('Failed to parse settings from disk', error)
  }
  
  // 3. Fallback to factory defaults
  currentSettings = getDefaultSettings()
  return currentSettings
}

/**
 * Writes the provided settings to the primary configuration file.
 * Automatically enforces strict file permissions on Unix-like systems.
 * 
 * @param settings - The settings object to persist
 */
export function saveSettings(settings: Settings): void {
  try {
    if (!fs.existsSync(SETTINGS_DIR)) {
      fs.mkdirSync(SETTINGS_DIR, { recursive: true })
    }
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')

    // Security: Restrict access to settings file (contains API keys)
    if (process.platform !== 'win32') {
      fs.chmodSync(SETTINGS_FILE, 0o600)
    }
  } catch (error: unknown) {
    logger.error('Failed to write settings to disk', error)
  }
}

/**
 * Updates the recent-files history. Dedupes existing entries and enforces
 * the global history limit before persisting.
 * 
 * @param filePath - Absolute system path to the file
 */
export function addToRecentFiles(filePath: string): void {
  try {
    const mutableRecent = [...currentSettings.recentFiles].filter(
      (file) => file.filePath !== filePath
    )

    mutableRecent.unshift({
      filePath,
      lastOpened: new Date().toISOString()
    })

    // Enforce history depth limit
    const trimmedRecent = mutableRecent.slice(0, MAX_RECENT_FILES)

    currentSettings = {
      ...currentSettings,
      recentFiles: trimmedRecent
    }

    saveSettings(currentSettings)
  } catch (error: unknown) {
    logger.error('Failed to update recent files history', error)
  }
}
