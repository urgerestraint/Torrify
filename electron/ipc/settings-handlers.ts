import { ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import {
  SettingsSchema,
  FilePathSchema,
  GatewayRequestSchema,
  CADBackendSchema
} from '../validation/schemas'
import { createCADService } from '../cad'
import {
  getCurrentSettings,
  setCurrentSettings,
  saveSettings,
  loadSettings
} from '../settings'
import { SETTINGS_FILE, GATEWAY_BASE_URL } from '../constants'
import { getErrorMessage } from '../utils/error'
import { logger } from '../utils/logger'
import type { Settings } from '../settings/types'

function getGatewayEndpoint(): string {
  const base = GATEWAY_BASE_URL.replace(/\/$/, '')
  return `${base}/api/chat`
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('get-settings', () => {
    return getCurrentSettings()
  })

  ipcMain.handle('get-openrouter-key', () => {
    return process.env.OPENROUTER_API_KEY?.trim() || null
  })

  ipcMain.handle('gateway-request', async (_event, requestInput: unknown) => {
    const parseResult = GatewayRequestSchema.safeParse(requestInput)
    if (!parseResult.success) {
      return {
        ok: false,
        status: 400,
        statusText: 'Invalid request',
        errorText: 'Gateway request validation failed.'
      }
    }
    const request = parseResult.data
    const licenseKey = (request?.licenseKey ?? '').trim()
    if (!licenseKey) {
      return {
        ok: false,
        status: 400,
        statusText: 'Missing license key',
        errorText: 'Gateway license key is not set.'
      }
    }

    const endpoint = getGatewayEndpoint()

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-License-Key': licenseKey
        },
        body: JSON.stringify(request?.body ?? {})
      })

      const responseText = await response.text()

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          statusText: response.statusText,
          errorText: responseText
        }
      }

      try {
        const data = JSON.parse(responseText)
        return {
          ok: true,
          status: response.status,
          statusText: response.statusText,
          data
        }
      } catch {
        return {
          ok: false,
          status: response.status,
          statusText: 'Invalid JSON',
          errorText: responseText
        }
      }
    } catch (error) {
      return {
        ok: false,
        status: 500,
        statusText: 'Gateway request failed',
        errorText: getErrorMessage(error)
      }
    }
  })

  ipcMain.handle('save-settings', (_event, settingsInput: unknown) => {
    const parseResult = SettingsSchema.safeParse(settingsInput)
    if (!parseResult.success) {
      return { success: false, error: 'Invalid settings format' }
    }
    const settings = parseResult.data as Settings
    setCurrentSettings(settings)
    saveSettings(settings)
    return { success: true }
  })

  ipcMain.handle('check-openscad-path', (_event, pathInput: unknown) => {
    const parseResult = FilePathSchema.safeParse(pathInput)
    if (!parseResult.success) {
      return false
    }
    return fs.existsSync(parseResult.data)
  })

  ipcMain.handle('validate-cad-backend', async (_event, backendInput: unknown) => {
    const parseResult = CADBackendSchema.safeParse(backendInput)
    if (!parseResult.success) {
      return { valid: false, error: 'Invalid backend' }
    }
    const backend = parseResult.data
    const currentSettings = getCurrentSettings()
    try {
      const cadService = createCADService({
        backend,
        openscadPath: currentSettings.openscadPath,
        build123dPythonPath: currentSettings.build123dPythonPath
      })
      return await cadService.validateSetup()
    } catch (error) {
      return { valid: false, error: getErrorMessage(error) }
    }
  })

  ipcMain.handle('check-python-path', async (_event, pathInput: unknown) => {
    const parseResult = FilePathSchema.safeParse(pathInput)
    if (!parseResult.success) {
      return { valid: false, error: 'Invalid path' }
    }
    const pythonPath = parseResult.data
    const { spawn } = await import('child_process')

    return new Promise((resolve) => {
      const proc = spawn(pythonPath, ['--version'], { windowsHide: true })

      let stdout = ''
      proc.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      const timeout = setTimeout(() => {
        proc.kill()
        resolve({ valid: false, error: 'Timeout checking Python' })
      }, 5000)

      proc.on('close', (code) => {
        clearTimeout(timeout)
        if (code === 0) {
          resolve({ valid: true, version: stdout.trim() })
        } else {
          resolve({ valid: false, error: 'Python not found' })
        }
      })

      proc.on('error', () => {
        clearTimeout(timeout)
        resolve({ valid: false, error: 'Python executable not found' })
      })
    })
  })

  ipcMain.handle('should-show-welcome', () => {
    const settings = getCurrentSettings()
    const openscadConfigured = settings.openscadPath && fs.existsSync(settings.openscadPath)
    const apiKeyConfigured =
      settings.llm.provider === 'openrouter'
        ? !!process.env.OPENROUTER_API_KEY?.trim()
        : settings.llm.provider === 'gateway'
          ? !!settings.llm.gatewayLicenseKey?.trim()
          : settings.llm.provider === 'ollama'
            ? true
            : !!settings.llm.apiKey?.trim()
    return !openscadConfigured || !apiKeyConfigured
  })

  ipcMain.handle('get-ollama-models', async (_event, endpoint?: string) => {
    try {
      const ollamaEndpoint = endpoint || 'http://127.0.0.1:11434'
      const response = await fetch(`${ollamaEndpoint}/api/tags`)

      if (!response.ok) {
        throw new Error(`Ollama API returned ${response.status}`)
      }

      const data = await response.json()
      const models = (Array.isArray(data?.models) ? data.models : []).map((model: unknown) => {
        const record = model && typeof model === 'object' ? (model as Record<string, unknown>) : {}
        return {
          name: typeof record.name === 'string' ? record.name : 'unknown',
          size: typeof record.size === 'number' ? record.size : 0,
          modified: typeof record.modified_at === 'string' ? record.modified_at : ''
        }
      })

      return { success: true, models }
    } catch (error) {
      logger.error('Failed to fetch Ollama models', error)
      let errorMessage = 'Failed to connect to Ollama'
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
          errorMessage =
            'Ollama is not running. Please start Ollama first (run "ollama serve" or start the Ollama application).'
        } else if (error.message.includes('timeout')) {
          errorMessage = "Ollama is not responding. Check if it's running and the endpoint is correct."
        } else {
          errorMessage = `Connection error: ${error.message}`
        }
      }
      return {
        success: false,
        models: [],
        error: errorMessage
      }
    }
  })

  ipcMain.handle('reset-settings', () => {
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        fs.unlinkSync(SETTINGS_FILE)
      }
      loadSettings()
      return { success: true }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })

  ipcMain.handle('select-openscad-path', async () => {
    const filters =
      process.platform === 'win32'
        ? [
            { name: 'Executable', extensions: ['exe'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        : [{ name: 'All Files', extensions: ['*'] }]

    const result = await dialog.showOpenDialog({
      title: 'Select OpenSCAD Executable',
      properties: ['openFile'],
      filters
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }

    const selectedPath = result.filePaths[0]
    if (!fs.existsSync(selectedPath)) {
      return { canceled: true, error: 'Selected file does not exist' }
    }

    return { canceled: false, filePath: selectedPath }
  })
}
