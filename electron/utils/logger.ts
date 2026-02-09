/**
 * Centralized logging utility for the Electron main process.
 * 
 * Behavior varies by environment:
 * - Development: All log levels (debug, info, warn, error) are output to the console.
 * - Production: Only errors are logged, and they are sanitized to avoid exposing
 *   sensitive internal state or stack traces to end users.
 */
const isDev = !!process.env.VITE_DEV_SERVER_URL

/**
 * Logger instance with support for varied log levels.
 * Uses `unknown[]` for broad compatibility while maintaining type safety.
 */
export const logger = {
  /**
   * Logs low-level debugging information.
   * Suppressed in production environments.
   * 
   * @param args - Data or messages to log
   */
  debug: (...args: unknown[]) => {
    if (isDev) console.log('[DEBUG]', ...args)
  },

  /**
   * Logs warning messages for non-critical issues.
   * Suppressed in production environments.
   * 
   * @param args - Data or messages to log
   */
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[WARN]', ...args)
  },

  /**
   * Logs critical error messages.
   * In production, only the `msg` is logged, and the `error` object is suppressed.
   * 
   * @param msg - Human-readable error description
   * @param error - Optional error object or context (sanitized in production)
   */
  error: (msg: string, error?: unknown) => {
    if (isDev) {
      console.error('[ERROR]', msg, error)
    } else {
      console.error('[ERROR]', msg)
    }
  },

  /**
   * Logs general information about application state or flow.
   * Suppressed in production environments.
   * 
   * @param args - Data or messages to log
   */
  info: (...args: unknown[]) => {
    if (isDev) console.log('[INFO]', ...args)
  }
}
