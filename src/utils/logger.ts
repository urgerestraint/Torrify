/**
 * Centralized logger for renderer (Vite).
 * Debug, info, and warn only in development; error logs a sanitized message in production
 * to avoid exposing internal paths or stack traces.
 */
const isDev = import.meta.env.DEV

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[DEBUG]', ...args)
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
