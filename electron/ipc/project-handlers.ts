import { ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import { validateProject } from '../validation/projectValidation'
import { addToRecentFiles } from '../settings'
import { MAX_PROJECT_FILE_SIZE } from '../constants'
import { getErrorMessage } from '../utils/error'

export function registerProjectHandlers(): void {
  ipcMain.handle('save-project', async (_event, project: unknown) => {
    if (!validateProject(project)) {
      return { canceled: true, error: 'Invalid project structure' }
    }

    const projectJson = JSON.stringify(project, null, 2)
    if (projectJson.length > MAX_PROJECT_FILE_SIZE) {
      return {
        canceled: true,
        error: `Project too large: ${(projectJson.length / 1024 / 1024).toFixed(2)}MB (max ${MAX_PROJECT_FILE_SIZE / 1024 / 1024}MB)`
      }
    }

    const result = await dialog.showSaveDialog({
      title: 'Save Torrify Project',
      defaultPath: 'project.torrify',
      filters: [{ name: 'Torrify Project', extensions: ['torrify', 'json'] }]
    })

    if (result.canceled || !result.filePath) {
      return { canceled: true }
    }

    fs.writeFileSync(result.filePath, projectJson, 'utf-8')
    addToRecentFiles(result.filePath)
    return { canceled: false, filePath: result.filePath }
  })

  ipcMain.handle('load-project', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Open Torrify Project',
      properties: ['openFile'],
      filters: [{ name: 'Torrify Project', extensions: ['torrify', 'opencursor', 'json'] }]
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }

    const filePath = result.filePaths[0]
    const stats = fs.statSync(filePath)
    if (stats.size > MAX_PROJECT_FILE_SIZE) {
      return {
        canceled: true,
        error: `Project file too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_PROJECT_FILE_SIZE / 1024 / 1024}MB)`
      }
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      const project = JSON.parse(raw)

      if (!validateProject(project)) {
        return { canceled: true, error: 'Invalid project file format' }
      }

      addToRecentFiles(filePath)
      return { canceled: false, project, filePath }
    } catch (error) {
      return { canceled: true, error: `Failed to load project: ${getErrorMessage(error)}` }
    }
  })
}
