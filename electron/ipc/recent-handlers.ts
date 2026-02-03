import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { FilePathSchema } from '../validation/schemas'
import { validatePath } from '../validation/pathValidator'
import { validateProject } from '../validation/projectValidation'
import { getCurrentSettings, setCurrentSettings, saveSettings, addToRecentFiles } from '../settings'
import { MAX_SCAD_FILE_SIZE } from '../constants'
import { getErrorMessage } from '../utils/error'

export function registerRecentHandlers(): void {
  ipcMain.handle('get-recent-files', () => {
    return getCurrentSettings().recentFiles
  })

  ipcMain.handle('clear-recent-files', () => {
    const settings = getCurrentSettings()
    settings.recentFiles = []
    setCurrentSettings(settings)
    saveSettings(settings)
    return { success: true }
  })

  ipcMain.handle('remove-recent-file', (_event, filePathInput: unknown) => {
    const parseResult = FilePathSchema.safeParse(filePathInput)
    if (!parseResult.success) {
      return { success: false }
    }
    const inputPath = parseResult.data
    const settings = getCurrentSettings()
    settings.recentFiles = settings.recentFiles.filter((file) => file.filePath !== inputPath)
    setCurrentSettings(settings)
    saveSettings(settings)
    return { success: true }
  })

  ipcMain.handle('open-recent-file', async (_event, filePathInput: unknown) => {
    const parseResult = FilePathSchema.safeParse(filePathInput)
    if (!parseResult.success) {
      return { canceled: true, error: 'Invalid file path' }
    }
    const pathResult = validatePath(parseResult.data)
    if (!pathResult.valid) {
      return { canceled: true, error: pathResult.error }
    }
    const filePath = pathResult.normalized!

    if (!fs.existsSync(filePath)) {
      return { canceled: true, error: 'File no longer exists' }
    }

    const stats = fs.statSync(filePath)
    if (stats.size > MAX_SCAD_FILE_SIZE) {
      return {
        canceled: true,
        error: `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_SCAD_FILE_SIZE / 1024 / 1024}MB)`
      }
    }

    const ext = path.extname(filePath).toLowerCase()
    const isProject = ext === '.torrify' || ext === '.opencursor' || ext === '.json'

    try {
      const content = fs.readFileSync(filePath, 'utf-8')

      if (isProject) {
        try {
          const project = JSON.parse(content)
          if (validateProject(project)) {
            addToRecentFiles(filePath)
            return { canceled: false, filePath, project, isProject: true }
          }
        } catch {
          // Not a valid project, treat as code file
        }
      }

      addToRecentFiles(filePath)
      return { canceled: false, filePath, code: content, isProject: false }
    } catch (error) {
      return { canceled: true, error: `Failed to read file: ${getErrorMessage(error)}` }
    }
  })
}
