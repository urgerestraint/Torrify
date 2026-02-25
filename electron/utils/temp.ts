import * as fs from 'fs'
import * as path from 'path'
import { TEMP_DIR, TEMP_FILE_MAX_AGE_MS } from '../constants'
import { logger } from './logger'

export { TEMP_DIR }

export function ensureTempDir(): void {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true })
  }
}

export function createRequestTempDir(prefix: string): string {
  ensureTempDir()
  return fs.mkdtempSync(path.join(TEMP_DIR, `${prefix}-`))
}

export function cleanupTempPath(targetPath: string): void {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true })
    }
  } catch (error) {
    logger.error('Failed to cleanup temp path', { targetPath, error })
  }
}

/**
 * Cleans up temporary files in the temp directory.
 * @param maxAgeMs - Maximum age of files to keep (default: 1 hour)
 */
export function cleanupTempFiles(maxAgeMs: number = TEMP_FILE_MAX_AGE_MS): void {
  try {
    if (!fs.existsSync(TEMP_DIR)) return

    const now = Date.now()
    const files = fs.readdirSync(TEMP_DIR)

    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file)
      try {
        const stats = fs.statSync(filePath)
        const age = now - stats.mtimeMs

        if (age > maxAgeMs) {
          fs.unlinkSync(filePath)
          logger.debug('Cleaned up old temp file:', file)
        }
      } catch {
        // Ignore errors for individual files
      }
    }
  } catch (error) {
    logger.error('Error cleaning up temp files', error)
  }
}

/**
 * Cleans up all temporary files (used on app quit).
 */
export function cleanupAllTempFiles(): void {
  try {
    if (!fs.existsSync(TEMP_DIR)) return

    const files = fs.readdirSync(TEMP_DIR)
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(TEMP_DIR, file))
      } catch {
        // Ignore errors
      }
    }
  } catch {
    // Ignore errors on quit
  }
}
