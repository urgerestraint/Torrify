import { ipcMain, dialog, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { CodeSchema, FilePathSchema, CADBackendSchema } from '../validation/schemas'
import { validatePath } from '../validation/pathValidator'
import { addToRecentFiles } from '../settings'
import { MAX_SCAD_FILE_SIZE } from '../constants'
import { getErrorMessage } from '../utils/error'

export function registerFileHandlers(): void {
  ipcMain.handle('open-scad-file', async (_event, backendInput?: unknown) => {
    const backend =
      backendInput !== undefined ? CADBackendSchema.safeParse(backendInput).data ?? 'openscad' : 'openscad'
    const isOpenSCAD = backend === 'openscad'
    const title = isOpenSCAD ? 'Open OpenSCAD File' : 'Open build123d Python File'
    const filters = isOpenSCAD
      ? [
          { name: 'OpenSCAD Files', extensions: ['scad'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      : [
          { name: 'Python Files', extensions: ['py'] },
          { name: 'All Files', extensions: ['*'] }
        ]

    const result = await dialog.showOpenDialog({
      title,
      defaultPath: app.getPath('documents'),
      properties: ['openFile'],
      filters
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }

    const filePath = result.filePaths[0]
    const stats = fs.statSync(filePath)
    if (stats.size > MAX_SCAD_FILE_SIZE) {
      return {
        canceled: true,
        error: `File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_SCAD_FILE_SIZE / 1024 / 1024}MB)`
      }
    }

    try {
      const code = fs.readFileSync(filePath, 'utf-8')
      addToRecentFiles(filePath)
      return { canceled: false, filePath, code }
    } catch (error) {
      return { canceled: true, error: `Failed to read file: ${getErrorMessage(error)}` }
    }
  })

  ipcMain.handle(
    'save-scad-file',
    async (_event, codeInput: unknown, filePathInput?: unknown, backendInput?: unknown) => {
      const codeParse = CodeSchema.safeParse(codeInput)
      if (!codeParse.success) {
        return { canceled: true, error: 'Invalid code input' }
      }
      const code = codeParse.data
      const backend =
        backendInput !== undefined ? CADBackendSchema.safeParse(backendInput).data ?? 'openscad' : 'openscad'

      if (filePathInput !== undefined && filePathInput !== null && filePathInput !== '') {
        const pathParse = FilePathSchema.safeParse(filePathInput)
        if (pathParse.success) {
          const pathResult = validatePath(pathParse.data, ['.scad', '.py'])
          if (pathResult.valid && pathResult.normalized && fs.existsSync(pathResult.normalized)) {
            try {
              fs.writeFileSync(pathResult.normalized, code, 'utf-8')
              addToRecentFiles(pathResult.normalized)
              return { canceled: false, filePath: pathResult.normalized }
            } catch (error) {
              return { canceled: true, error: `Failed to save file: ${getErrorMessage(error)}` }
            }
          }
        }
      }

      const isOpenSCAD = backend === 'openscad'
      const title = isOpenSCAD ? 'Save OpenSCAD File' : 'Save build123d Python File'
      const defaultFileName = isOpenSCAD ? 'model.scad' : 'model.py'
      const filters = isOpenSCAD
        ? [
            { name: 'OpenSCAD Files', extensions: ['scad'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        : [
            { name: 'Python Files', extensions: ['py'] },
            { name: 'All Files', extensions: ['*'] }
          ]

      const result = await dialog.showSaveDialog({
        title,
        defaultPath: path.join(app.getPath('documents'), defaultFileName),
        filters
      })

      if (result.canceled || !result.filePath) {
        return { canceled: true }
      }

      try {
        fs.writeFileSync(result.filePath, code, 'utf-8')
        addToRecentFiles(result.filePath)
        return { canceled: false, filePath: result.filePath }
      } catch (error) {
        return { canceled: true, error: `Failed to save file: ${getErrorMessage(error)}` }
      }
    }
  )

  ipcMain.handle(
    'export-scad',
    async (_event, codeInput: unknown, backendInput?: unknown, currentFilePath?: string) => {
      const codeParse = CodeSchema.safeParse(codeInput)
      if (!codeParse.success) {
        return { canceled: true, error: 'Invalid code input' }
      }
      const code = codeParse.data
      const backend = backendInput !== undefined ? CADBackendSchema.safeParse(backendInput).data : undefined
      const isBuild123d = backend === 'build123d'
      const ext = isBuild123d ? '.py' : '.scad'
      const baseName =
        currentFilePath && currentFilePath.trim()
          ? path.basename(currentFilePath, path.extname(currentFilePath))
          : 'model'
      const defaultPath = path.join(app.getPath('documents'), baseName + ext)

      const result = await dialog.showSaveDialog({
        title: isBuild123d ? 'Export Python' : 'Export SCAD',
        defaultPath,
        filters: isBuild123d
          ? [{ name: 'Python', extensions: ['py'] }]
          : [{ name: 'OpenSCAD', extensions: ['scad'] }]
      })

      if (result.canceled || !result.filePath) {
        return { canceled: true }
      }

      fs.writeFileSync(result.filePath, code, 'utf-8')
      return { canceled: false, filePath: result.filePath }
    }
  )

  ipcMain.handle('export-stl', async (_event, stlBase64: string | null, currentFilePath?: string) => {
    if (!stlBase64) {
      return { canceled: true }
    }

    const baseName =
      currentFilePath && currentFilePath.trim()
        ? path.basename(currentFilePath, path.extname(currentFilePath))
        : 'model'
    const defaultPath = path.join(app.getPath('documents'), baseName + '.stl')

    const result = await dialog.showSaveDialog({
      title: 'Export STL',
      defaultPath,
      filters: [{ name: 'STL', extensions: ['stl'] }]
    })

    if (result.canceled || !result.filePath) {
      return { canceled: true }
    }

    const buffer = Buffer.from(stlBase64, 'base64')
    fs.writeFileSync(result.filePath, buffer)
    return { canceled: false, filePath: result.filePath }
  })
}
