/**
 * Centralized logger for Electron main process.
 * Debug and warn only in development; error logs a sanitized message in production
 * to avoid exposing internal paths or stack traces.
 */
const isDev = !!process.env.VITE_DEV_SERVER_URL

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log('[DEBUG]', ...args)
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[WARN]', ...args)
  },
  error: (msg: string, error?: unknown) => {
    if (isDev) {
      console.error('[ERROR]', msg, error)
    } else {
      console.error('[ERROR]', msg)
    }
  },
  info: (...args: unknown[]) => {
    if (isDev) console.log('[INFO]', ...args)
  }
}
