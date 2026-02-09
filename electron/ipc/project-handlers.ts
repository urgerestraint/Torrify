/**
 * Project IPC Handlers.
 *
 * Manages the persistence lifecycle of Torrify project files (.torrify).
 * Handles structured JSON serialization, file size validation, and integration
 * with the native system dialogs for saving and loading.
 */
import { ipcMain, dialog, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { validateProject } from '../validation/projectValidation'
import { addToRecentFiles } from '../settings'
import { MAX_PROJECT_FILE_SIZE } from '../constants'
import { getErrorMessage } from '../utils/error'

/**
 * Registers IPC handlers for project-level operations.
 */
export function registerProjectHandlers(): void {
  /**
   * Save Project.
   * Serializes the current IDE state and writes it to a .torrify file.
   * 
   * @param project - The structured project data object
   * @param currentFilePath - Optional path to the currently open file
   */
  ipcMain.handle('save-project', async (_event, project: unknown, currentFilePath?: string) => {
    // 1. Schema validation
    if (!validateProject(project)) {
      return { canceled: true, error: 'Invalid project structure' }
    }

    const projectJson = JSON.stringify(project, null, 2)
    
    // 2. Resource limit check
    if (projectJson.length > MAX_PROJECT_FILE_SIZE) {
      const sizeMb = (projectJson.length / 1024 / 1024).toFixed(2)
      const limitMb = (MAX_PROJECT_FILE_SIZE / 1024 / 1024).toFixed(2)
      return {
        canceled: true,
        error: `Project too large: ${sizeMb}MB (System Limit: ${limitMb}MB)`
      }
    }

    // 3. Determine initial directory
    const defaultPath = currentFilePath && currentFilePath.trim()
      ? currentFilePath
      : path.join(app.getPath('documents'), 'project.torrify')

    // 4. Show native save dialog
    const result = await dialog.showSaveDialog({
      title: 'Save Torrify Project',
      defaultPath,
      filters: [
        { name: 'Torrify Project', extensions: ['torrify'] },
        { name: 'JSON Metadata', extensions: ['json'] }
      ]
    })

    if (result.canceled || !result.filePath) {
      return { canceled: true }
    }

    try {
      // 5. Persist to disk
      fs.writeFileSync(result.filePath, projectJson, 'utf-8')
      addToRecentFiles(result.filePath)
      return { canceled: false, filePath: result.filePath }
    } catch (error: unknown) {
      return { 
        canceled: true, 
        error: `Failed to write project file: ${getErrorMessage(error)}` 
      }
    }
  })

  /**
   * Load Project.
   * Reads a .torrify file from disk and reconstructs the IDE state.
   */
  ipcMain.handle('load-project', async () => {
    // 1. Show native open dialog
    const result = await dialog.showOpenDialog({
      title: 'Open Torrify Project',
      defaultPath: app.getPath('documents'),
      properties: ['openFile'],
      filters: [
        { name: 'Torrify Project', extensions: ['torrify', 'opencursor', 'json'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }

    const filePath = result.filePaths[0]
    
    try {
      // 2. Validate file existence and size before reading
      const stats = fs.statSync(filePath)
      if (stats.size > MAX_PROJECT_FILE_SIZE) {
        const sizeMb = (stats.size / 1024 / 1024).toFixed(2)
        const limitMb = (MAX_PROJECT_FILE_SIZE / 1024 / 1024).toFixed(2)
        return {
          canceled: true,
          error: `Project file too large: ${sizeMb}MB (System Limit: ${limitMb}MB)`
        }
      }

      // 3. Read and parse content
      const raw = fs.readFileSync(filePath, 'utf-8')
      const project = JSON.parse(raw)

      // 4. Schema validation
      if (!validateProject(project)) {
        return { canceled: true, error: 'The selected file is not a valid Torrify project' }
      }

      // 5. Update application history
      addToRecentFiles(filePath)
      return { canceled: false, project, filePath }
    } catch (error: unknown) {
      return { 
        canceled: true, 
        error: `Failed to load project: ${getErrorMessage(error)}` 
      }
    }
  })
}
