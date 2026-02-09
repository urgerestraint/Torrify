import { ipcMain } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { createCADService } from '../cad'
import { CodeSchema } from '../validation/schemas'
import { getCurrentSettings } from '../settings'
import { TEMP_DIR, OPENSCAD_RENDER_CONFIG, OPENSCAD_TIMEOUT_MS, MAX_OUTPUT_FILE_SIZE } from '../constants'
import { createCappedBuffer } from '../cad/process-utils'
import { getErrorMessage } from '../utils/error'
import { logger } from '../utils/logger'

export function registerRenderHandlers(): void {
  ipcMain.handle('render-scad', async (_event, codeInput: unknown) => {
    const codeResult = CodeSchema.safeParse(codeInput)
    if (!codeResult.success) {
      throw new Error('Invalid input: code exceeds maximum size or is not a string')
    }
    const code = codeResult.data
    const currentSettings = getCurrentSettings()

    if (currentSettings.cadBackend !== 'openscad') {
      throw new Error('PNG rendering is only supported with OpenSCAD backend. Use STL preview instead.')
    }

    const { spawn } = await import('child_process')
    const TEMP_SCAD_FILE = path.join(TEMP_DIR, 'temp_model.scad')
    const RENDER_OUTPUT = path.join(TEMP_DIR, 'render_preview.png')

    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null
      let openscadProcess: ReturnType<typeof spawn> | null = null

      try {
        fs.writeFileSync(TEMP_SCAD_FILE, code, 'utf-8')

        const args = [
          '-o',
          RENDER_OUTPUT,
          `--colorscheme=${OPENSCAD_RENDER_CONFIG.colorscheme}`,
          `--camera=${OPENSCAD_RENDER_CONFIG.camera}`,
          `--imgsize=${OPENSCAD_RENDER_CONFIG.imgsize}`,
          `--projection=${OPENSCAD_RENDER_CONFIG.projection}`,
          TEMP_SCAD_FILE
        ]

        logger.debug('Executing OpenSCAD PNG render')

        if (!fs.existsSync(currentSettings.openscadPath)) {
          reject(new Error(`OpenSCAD executable not found at: ${currentSettings.openscadPath}`))
          return
        }

        openscadProcess = spawn(currentSettings.openscadPath, args, {
          windowsHide: true
        })

        timeoutId = setTimeout(() => {
          if (openscadProcess && !openscadProcess.killed) {
            openscadProcess.kill()
            reject(new Error('OpenSCAD execution timed out after 30 seconds'))
          }
        }, OPENSCAD_TIMEOUT_MS)

        const stderrBuf = createCappedBuffer()
        if (openscadProcess.stderr) {
          openscadProcess.stderr.on('data', (data) => stderrBuf.append(data))
        }

        openscadProcess.on('close', (exitCode) => {
          if (timeoutId) clearTimeout(timeoutId)

          if (exitCode === 0) {
            if (fs.existsSync(RENDER_OUTPUT)) {
              const stats = fs.statSync(RENDER_OUTPUT)
              if (stats.size > MAX_OUTPUT_FILE_SIZE) {
                reject(
                  new Error(
                    `Output file too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_OUTPUT_FILE_SIZE / 1024 / 1024}MB)`
                  )
                )
                return
              }

              const imageData = fs.readFileSync(RENDER_OUTPUT)
              const base64Image = imageData.toString('base64')
              resolve({
                success: true,
                image: `data:image/png;base64,${base64Image}`,
                timestamp: Date.now()
              })
            } else {
              reject(new Error('Render output file not created'))
            }
          } else {
            reject(new Error(`OpenSCAD exited with code ${exitCode}: ${stderrBuf.value}`))
          }
        })

        openscadProcess.on('error', (error) => {
          if (timeoutId) clearTimeout(timeoutId)
          reject(new Error(`Failed to start OpenSCAD: ${error.message}`))
        })
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId)
        if (openscadProcess && !openscadProcess.killed) {
          openscadProcess.kill()
        }
        reject(new Error(`Render error: ${getErrorMessage(error)}`))
      }
    })
  })

  ipcMain.handle('render-stl', async (_event, codeInput: unknown) => {
    const codeResult = CodeSchema.safeParse(codeInput)
    if (!codeResult.success) {
      throw new Error('Invalid input: code exceeds maximum size or is not a string')
    }
    const code = codeResult.data
    const currentSettings = getCurrentSettings()

    try {
      logger.debug('Executing', currentSettings.cadBackend, 'STL export')

      const cadService = createCADService({
        backend: currentSettings.cadBackend,
        openscadPath: currentSettings.openscadPath,
        build123dPythonPath: currentSettings.build123dPythonPath
      })

      const result = await cadService.renderStl(code)

      if (result.success) {
        return result
      } else {
        throw new Error(result.error || 'Render failed')
      }
    } catch (error) {
      throw new Error(`STL export error: ${getErrorMessage(error)}`)
    }
  })

  ipcMain.handle('get-temp-dir', () => TEMP_DIR)
}
