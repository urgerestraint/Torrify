/**
 * OpenSCAD CAD Service Implementation.
 * 
 * Handles geometry rendering by spawning the OpenSCAD command-line interface
 * as a child process. Manages temporary file lifecycle and output parsing.
 */
import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import type { CADService, CADRenderResult, CADValidationResult } from './types'
import { createCappedBuffer } from './process-utils'
import { MAX_OUTPUT_FILE_SIZE } from '../constants'
import { cleanupTempPath, createRequestTempDir } from '../utils/temp'

/** Execution timeout for the OpenSCAD process (30 seconds) */
const RENDER_TIMEOUT_MS = 30000

/**
 * Service class for interacting with the OpenSCAD CLI.
 */
export class OpenSCADService implements CADService {
  private readonly executablePath: string

  /**
   * @param executablePath - Absolute path to the OpenSCAD executable
   */
  constructor(executablePath: string) {
    this.executablePath = executablePath
  }

  /**
   * Compiles OpenSCAD code and generates a base64-encoded STL string.
   * 
   * @param code - Valid OpenSCAD script
   * @returns Promise resolving to the render result or error details
   */
  async renderStl(code: string, requestId?: string): Promise<CADRenderResult> {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | null = null
      let openscadProcess: ReturnType<typeof spawn> | null = null
      let settled = false
      const requestTempDir = createRequestTempDir(requestId ?? 'openscad-render')
      const tempScadSource = path.join(requestTempDir, 'temp_model.scad')
      const tempStlOutput = path.join(requestTempDir, 'render_preview.stl')

      const resolveOnce = (result: CADRenderResult): void => {
        if (settled) {
          return
        }
        settled = true
        cleanupTempPath(requestTempDir)
        resolve(result)
      }

      try {
        // 1. Persist the current code to a temporary file for the CLI
        fs.writeFileSync(tempScadSource, code, 'utf-8')

        const args = ['-o', tempStlOutput, tempScadSource]

        // 2. Validate environment before spawning
        if (!fs.existsSync(this.executablePath)) {
          resolveOnce({
            success: false,
            error: `OpenSCAD executable not found at: ${this.executablePath}`,
            timestamp: Date.now()
          })
          return
        }

        // 3. Spawn the renderer process
        openscadProcess = spawn(this.executablePath, args, {
          windowsHide: true
        })

        // 4. Setup watchdog timer to prevent hung processes
        timeoutId = setTimeout(() => {
          if (openscadProcess && !openscadProcess.killed) {
            openscadProcess.kill()
            resolveOnce({
              success: false,
              error: `Rendering timed out after ${RENDER_TIMEOUT_MS / 1000} seconds`,
              timestamp: Date.now()
            })
          }
        }, RENDER_TIMEOUT_MS)

        const stderrBuf = createCappedBuffer()

        if (openscadProcess.stderr) {
          openscadProcess.stderr.on('data', (data) => stderrBuf.append(data))
        }

        // 5. Handle process completion
        openscadProcess.on('close', (exitCode) => {
          if (timeoutId) clearTimeout(timeoutId)

          if (exitCode === 0) {
            if (fs.existsSync(tempStlOutput)) {
              const stats = fs.statSync(tempStlOutput)
              
              // Prevent memory issues with massive models
              if (stats.size > MAX_OUTPUT_FILE_SIZE) {
                resolveOnce({
                  success: false,
                  error: `STL too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (Limit: ${MAX_OUTPUT_FILE_SIZE / 1024 / 1024}MB)`,
                  timestamp: Date.now()
                })
                return
              }

              const stlData = fs.readFileSync(tempStlOutput)
              resolveOnce({
                success: true,
                stlBase64: stlData.toString('base64'),
                timestamp: Date.now()
              })
            } else {
              resolveOnce({
                success: false,
                error: 'STL output file was not created by the renderer',
                timestamp: Date.now()
              })
            }
          } else {
            resolveOnce({
              success: false,
              error: `OpenSCAD failed (Code ${exitCode}): ${stderrBuf.value}`,
              timestamp: Date.now()
            })
          }
        })

        openscadProcess.on('error', (error) => {
          if (timeoutId) clearTimeout(timeoutId)
          resolveOnce({
            success: false,
            error: `Failed to launch OpenSCAD: ${error.message}`,
            timestamp: Date.now()
          })
        })
      } catch (error: unknown) {
        if (timeoutId) clearTimeout(timeoutId)
        if (openscadProcess && !openscadProcess.killed) {
          openscadProcess.kill()
        }
        const message = error instanceof Error ? error.message : 'An unexpected error occurred'
        resolveOnce({
          success: false,
          error: `Render context error: ${message}`,
          timestamp: Date.now()
        })
      }
    })
  }

  /**
   * Verifies the OpenSCAD installation and attempts to retrieve version info.
   */
  async validateSetup(): Promise<CADValidationResult> {
    if (!fs.existsSync(this.executablePath)) {
      return {
        valid: false,
        error: `Executable not found: ${this.executablePath}`
      }
    }

    return new Promise((resolve) => {
      const process = spawn(this.executablePath, ['--version'], {
        windowsHide: true
      })

      const stdoutBuf = createCappedBuffer()
      const stderrBuf = createCappedBuffer()

      process.stdout?.on('data', (data) => stdoutBuf.append(data))
      process.stderr?.on('data', (data) => stderrBuf.append(data))

      const timeout = setTimeout(() => {
        process.kill()
        resolve({
          valid: true,
          error: 'Version check timed out, but executable is present'
        })
      }, 5000)

      process.on('close', (code) => {
        clearTimeout(timeout)
        if (code === 0) {
          const version = stdoutBuf.rawValue.trim() || stderrBuf.rawValue.trim()
          resolve({
            valid: true,
            version: version || 'Unknown version'
          })
        } else {
          resolve({
            valid: true,
            error: 'Executable found, but version retrieval failed'
          })
        }
      })

      process.on('error', () => {
        clearTimeout(timeout)
        resolve({
          valid: false,
          error: 'Process execution failed'
        })
      })
    })
  }

  /** Human-friendly name */
  getBackendName(): string {
    return 'OpenSCAD'
  }

  /** File extension for scripts */
  getFileExtension(): string {
    return 'scad'
  }

  /** Syntax highlighting language */
  getLanguage(): string {
    return 'scad'
  }
}
