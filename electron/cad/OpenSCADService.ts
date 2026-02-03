// OpenSCAD CAD Service - Electron main process implementation

import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { CADService, CADRenderResult, CADValidationResult } from './types'

// Constants
const TIMEOUT_MS = 30000 // 30 seconds
const MAX_OUTPUT_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Temp directory
const TEMP_DIR = path.join(os.tmpdir(), 'torrify')
const TEMP_SCAD_FILE = path.join(TEMP_DIR, 'temp_model.scad')
const STL_OUTPUT = path.join(TEMP_DIR, 'render_preview.stl')

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

export class OpenSCADService implements CADService {
  private executablePath: string

  constructor(executablePath: string) {
    this.executablePath = executablePath
  }

  async renderStl(code: string): Promise<CADRenderResult> {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | null = null
      let openscadProcess: ReturnType<typeof spawn> | null = null

      try {
        // Write code to temporary file
        fs.writeFileSync(TEMP_SCAD_FILE, code, 'utf-8')

        const args = ['-o', STL_OUTPUT, TEMP_SCAD_FILE]

        // Check if executable exists
        if (!fs.existsSync(this.executablePath)) {
          resolve({
            success: false,
            error: `OpenSCAD executable not found at: ${this.executablePath}`,
            timestamp: Date.now()
          })
          return
        }

        // Execute OpenSCAD
        openscadProcess = spawn(this.executablePath, args, {
          windowsHide: true
        })

        // Set timeout
        timeoutId = setTimeout(() => {
          if (openscadProcess && !openscadProcess.killed) {
            openscadProcess.kill()
            resolve({
              success: false,
              error: 'OpenSCAD execution timed out after 30 seconds',
              timestamp: Date.now()
            })
          }
        }, TIMEOUT_MS)

        let stderr = ''

        if (openscadProcess.stderr) {
          openscadProcess.stderr.on('data', (data) => {
            stderr += data.toString()
          })
        }

        openscadProcess.on('close', (exitCode) => {
          if (timeoutId) clearTimeout(timeoutId)

          if (exitCode === 0) {
            if (fs.existsSync(STL_OUTPUT)) {
              // Validate file size
              const stats = fs.statSync(STL_OUTPUT)
              if (stats.size > MAX_OUTPUT_FILE_SIZE) {
                resolve({
                  success: false,
                  error: `STL file too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_OUTPUT_FILE_SIZE / 1024 / 1024}MB)`,
                  timestamp: Date.now()
                })
                return
              }

              const stlData = fs.readFileSync(STL_OUTPUT)
              const base64Stl = stlData.toString('base64')
              resolve({
                success: true,
                stlBase64: base64Stl,
                timestamp: Date.now()
              })
            } else {
              resolve({
                success: false,
                error: 'STL output file not created',
                timestamp: Date.now()
              })
            }
          } else {
            resolve({
              success: false,
              error: `OpenSCAD exited with code ${exitCode}: ${stderr}`,
              timestamp: Date.now()
            })
          }
        })

        openscadProcess.on('error', (error) => {
          if (timeoutId) clearTimeout(timeoutId)
          resolve({
            success: false,
            error: `Failed to start OpenSCAD: ${error.message}`,
            timestamp: Date.now()
          })
        })
      } catch (error: unknown) {
        if (timeoutId) clearTimeout(timeoutId)
        if (openscadProcess && !openscadProcess.killed) {
          openscadProcess.kill()
        }
        const message = error instanceof Error ? error.message : 'Unknown error'
        resolve({
          success: false,
          error: `Render error: ${message}`,
          timestamp: Date.now()
        })
      }
    })
  }

  async validateSetup(): Promise<CADValidationResult> {
    // Check if executable exists
    if (!fs.existsSync(this.executablePath)) {
      return {
        valid: false,
        error: `OpenSCAD executable not found at: ${this.executablePath}`
      }
    }

    // Try to get version
    return new Promise((resolve) => {
      const process = spawn(this.executablePath, ['--version'], {
        windowsHide: true
      })

      let stdout = ''
      let stderr = ''

      process.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      process.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      const timeout = setTimeout(() => {
        process.kill()
        resolve({
          valid: true,
          error: 'Version check timed out, but executable exists'
        })
      }, 5000)

      process.on('close', (code) => {
        clearTimeout(timeout)
        if (code === 0) {
          const version = stdout.trim() || stderr.trim()
          resolve({
            valid: true,
            version: version || 'Unknown version'
          })
        } else {
          resolve({
            valid: true,
            error: 'Could not determine version, but executable exists'
          })
        }
      })

      process.on('error', () => {
        clearTimeout(timeout)
        resolve({
          valid: false,
          error: 'Failed to execute OpenSCAD'
        })
      })
    })
  }

  getBackendName(): string {
    return 'OpenSCAD'
  }

  getFileExtension(): string {
    return 'scad'
  }

  getLanguage(): string {
    return 'c'
  }
}

