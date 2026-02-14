import { ipcMain } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { CADBackendSchema } from '../validation/schemas'
import {
  CONTEXT_DIR,
  getBundledResourcesDir,
  validateContextUrl,
  loadContextFile
} from '../context/loader'
import { FETCH_TIMEOUT_MS, MAX_CONTEXT_FILE_SIZE } from '../constants'
import { getErrorMessage } from '../utils/error'

function parseBackendInput(backendInput: unknown): 'openscad' | 'build123d' | null {
  const parseResult = CADBackendSchema.safeParse(backendInput)
  return parseResult.success ? parseResult.data : null
}

export function registerContextHandlers(): void {
  const bundledDir = getBundledResourcesDir()

  ipcMain.handle('get-context', async (_event, backendInput: unknown) => {
    const backend = parseBackendInput(backendInput)
    if (!backend) {
      return { success: false, error: 'Invalid backend' }
    }
    try {
      const filename = backend === 'build123d' ? 'context_build123d.txt' : 'context_openscad.txt'
      const content = loadContextFile(filename, bundledDir)

      if (content) {
        const userContextPath = path.join(CONTEXT_DIR, filename)
        const source = fs.existsSync(userContextPath) ? 'user' : 'bundled'
        return { success: true, content, source, filename }
      } else {
        return { success: false, error: `Context file not found: ${filename}` }
      }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })

  ipcMain.handle('get-context-status', async () => {
    try {
      const openscadUserPath = path.join(CONTEXT_DIR, 'context_openscad.txt')
      const build123dUserPath = path.join(CONTEXT_DIR, 'context_build123d.txt')
      const openscadBundledPath = path.join(bundledDir, 'context_openscad.txt')
      const build123dBundledPath = path.join(bundledDir, 'context_build123d.txt')

      const getFileInfo = (filepath: string) => {
        if (fs.existsSync(filepath)) {
          try {
            const stats = fs.statSync(filepath)
            return {
              exists: true,
              size: stats.size,
              modified: stats.mtime.toISOString()
            }
          } catch {
            return { exists: false, size: 0, modified: null }
          }
        }
        return { exists: false, size: 0, modified: null }
      }

      return {
        success: true,
        openscad: {
          user: getFileInfo(openscadUserPath),
          bundled: getFileInfo(openscadBundledPath),
          active: fs.existsSync(openscadUserPath) ? 'user' : 'bundled'
        },
        build123d: {
          user: getFileInfo(build123dUserPath),
          bundled: getFileInfo(build123dBundledPath),
          active: fs.existsSync(build123dUserPath) ? 'user' : 'bundled'
        }
      }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })

  ipcMain.handle('update-context-from-cloud', async (_event, backendInput: unknown, urlInput: unknown) => {
    const backend = parseBackendInput(backendInput)
    if (!backend) {
      return { success: false, error: 'Invalid backend' }
    }
    if (typeof urlInput !== 'string' || urlInput.length > 2048) {
      return { success: false, error: 'Invalid URL' }
    }
    try {
      const urlValidation = validateContextUrl(urlInput)
      if (!urlValidation.ok) {
        return { success: false, error: urlValidation.error }
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      let response: Response
      try {
        response = await fetch(urlValidation.url.toString(), { signal: controller.signal })
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId)
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return { success: false, error: 'Request timed out after 30 seconds' }
        }
        throw fetchError
      } finally {
        clearTimeout(timeoutId)
      }

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch: ${response.status} ${response.statusText}`
        }
      }

      const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
      if (contentType && !contentType.startsWith('text/')) {
        return { success: false, error: `Invalid content type: ${contentType}` }
      }

      const content = await response.text()

      if (!content || content.length < 100) {
        return { success: false, error: 'Invalid content: too short' }
      }

      if (content.length > MAX_CONTEXT_FILE_SIZE) {
        return { success: false, error: 'Invalid content: too large (max 1MB)' }
      }

      if (!fs.existsSync(CONTEXT_DIR)) {
        fs.mkdirSync(CONTEXT_DIR, { recursive: true })
      }

      const filename = backend === 'build123d' ? 'context_build123d.txt' : 'context_openscad.txt'
      const outputPath = path.join(CONTEXT_DIR, filename)
      fs.writeFileSync(outputPath, content, 'utf-8')

      return { success: true, message: `Updated ${filename}`, size: content.length }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })

  ipcMain.handle('reset-context-to-factory', async (_event, backendInput?: unknown) => {
    const backend = backendInput !== undefined ? parseBackendInput(backendInput) : undefined
    if (backendInput !== undefined && backend === null) {
      return { success: false, error: 'Invalid backend' }
    }
    try {
      const filesToDelete: string[] = []
      if (!backend || backend === 'openscad') {
        filesToDelete.push(path.join(CONTEXT_DIR, 'context_openscad.txt'))
      }
      if (!backend || backend === 'build123d') {
        filesToDelete.push(path.join(CONTEXT_DIR, 'context_build123d.txt'))
      }

      let deleted = 0
      for (const filepath of filesToDelete) {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath)
          deleted++
        }
      }

      return {
        success: true,
        message:
          deleted > 0 ? `Reset ${deleted} context file(s) to factory defaults` : 'Already using factory defaults'
      }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })
}
