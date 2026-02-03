import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { logger } from '../utils/logger'

export const CONTEXT_DIR = path.join(app.getPath('userData'), 'context')

const ALLOWED_CONTEXT_HOSTNAMES = new Set(['raw.githubusercontent.com', 'github.com'])

export function getBundledResourcesDir(): string {
  if (process.env.VITE_DEV_SERVER_URL) {
    return path.join(__dirname, '../../resources')
  }
  return path.join(__dirname, '../resources')
}

export function validateContextUrl(
  rawUrl: string
): { ok: true; url: URL } | { ok: false; error: string } {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { ok: false, error: 'Invalid URL format' }
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, error: 'Invalid URL: must use HTTPS' }
  }

  if (!ALLOWED_CONTEXT_HOSTNAMES.has(parsed.hostname)) {
    return { ok: false, error: 'Invalid URL: domain not allowed' }
  }

  return { ok: true, url: parsed }
}

/** Load context text file: userData/context first, then bundled resources. */
export function loadContextFile(filename: string, bundledResourcesDir: string): string | null {
  const userContextPath = path.join(CONTEXT_DIR, filename)
  if (fs.existsSync(userContextPath)) {
    try {
      return fs.readFileSync(userContextPath, 'utf-8')
    } catch (error) {
      logger.error(`Failed to read user context file ${filename}`, error)
    }
  }

  const bundledPath = path.join(bundledResourcesDir, filename)
  if (fs.existsSync(bundledPath)) {
    try {
      return fs.readFileSync(bundledPath, 'utf-8')
    } catch (error) {
      logger.error(`Failed to read bundled context file ${filename}`, error)
    }
  }

  return null
}
