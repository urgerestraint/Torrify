// build123d CAD Service - Electron main process implementation

import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import type { CADService, CADRenderResult, CADValidationResult } from './types'
import { createCappedBuffer } from './process-utils'
import { logger } from '../utils/logger'
import { MAX_OUTPUT_FILE_SIZE } from '../constants'
import { generateBuild123dWrapperScript } from './build123d-wrapper'
import { deriveBuild123dRenderError } from './build123d-errors'
import { cleanupTempPath, createRequestTempDir } from '../utils/temp'

// Constants
const TIMEOUT_MS = 60000 // 60 seconds (Python can be slower)

export class Build123dService implements CADService {
  private pythonPath: string

  constructor(pythonPath: string = 'python') {
    this.pythonPath = pythonPath
    logger.debug('[Build123dService] Initialized with Python path:', this.pythonPath)
  }

  async renderStl(code: string, requestId?: string): Promise<CADRenderResult> {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | null = null
      let pythonProcess: ReturnType<typeof spawn> | null = null
      let settled = false
      const requestTempDir = createRequestTempDir(requestId ?? 'build123d-render')
      const tempPyFile = path.join(requestTempDir, 'temp_model.py')
      const stlOutput = path.join(requestTempDir, 'render_preview.stl')

      const resolveOnce = (result: CADRenderResult): void => {
        if (settled) {
          return
        }
        settled = true
        cleanupTempPath(requestTempDir)
        resolve(result)
      }

      try {
        logger.debug('[Build123dService] renderStl called with pythonPath:', this.pythonPath)

        // Generate wrapper script
        const wrapperScript = generateBuild123dWrapperScript(code, stlOutput)

        // Write script to temporary file
        fs.writeFileSync(tempPyFile, wrapperScript, 'utf-8')
        logger.debug('[Build123dService] Temp script written to:', tempPyFile)

        // Execute Python script
        pythonProcess = spawn(this.pythonPath, [tempPyFile], {
          windowsHide: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: 'utf-8'
          }
        })

        // Set timeout
        timeoutId = setTimeout(() => {
          if (pythonProcess && !pythonProcess.killed) {
            pythonProcess.kill()
            resolveOnce({
              success: false,
              error: 'Python execution timed out after 60 seconds',
              timestamp: Date.now()
            })
          }
        }, TIMEOUT_MS)

        const stdoutBuf = createCappedBuffer()
        const stderrBuf = createCappedBuffer()

        if (pythonProcess.stdout) {
          pythonProcess.stdout.on('data', (data) => stdoutBuf.append(data))
        }

        if (pythonProcess.stderr) {
          pythonProcess.stderr.on('data', (data) => stderrBuf.append(data))
        }

        pythonProcess.on('close', (exitCode) => {
          if (timeoutId) clearTimeout(timeoutId)

          if (exitCode === 0) {
            if (fs.existsSync(stlOutput)) {
              // Validate file size
              const stats = fs.statSync(stlOutput)
              if (stats.size > MAX_OUTPUT_FILE_SIZE) {
                resolveOnce({
                  success: false,
                  error: `STL file too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_OUTPUT_FILE_SIZE / 1024 / 1024}MB)`,
                  timestamp: Date.now()
                })
                return
              }

              const stlData = fs.readFileSync(stlOutput)
              const base64Stl = stlData.toString('base64')
              resolveOnce({
                success: true,
                stlBase64: base64Stl,
                timestamp: Date.now()
              })
            } else {
              resolveOnce({
                success: false,
                error: `STL output file not created. Output: ${stdoutBuf.value}\nErrors: ${stderrBuf.value}`,
                timestamp: Date.now()
              })
            }
          } else {
            // Parse error message for better feedback
            const stderrRaw = stderrBuf.rawValue
            const stdoutRaw = stdoutBuf.rawValue
            const errorMessage = deriveBuild123dRenderError(stderrRaw, stdoutRaw, exitCode)
            
            resolveOnce({
              success: false,
              error: errorMessage,
              timestamp: Date.now()
            })
          }
        })

        pythonProcess.on('error', (error) => {
          if (timeoutId) clearTimeout(timeoutId)
          
          let errorMessage = `Failed to start Python: ${error.message}`
          if (error.message.includes('ENOENT')) {
            errorMessage = `Python executable not found at: ${this.pythonPath}. Make sure Python is installed and the path is correct.`
          }
          
          resolveOnce({
            success: false,
            error: errorMessage,
            timestamp: Date.now()
          })
        })
      } catch (error: unknown) {
        if (timeoutId) clearTimeout(timeoutId)
        if (pythonProcess && !pythonProcess.killed) {
          pythonProcess.kill()
        }
        const message = error instanceof Error ? error.message : 'Unknown error'
        resolveOnce({
          success: false,
          error: `Render error: ${message}`,
          timestamp: Date.now()
        })
      }
    })
  }

  async validateSetup(): Promise<CADValidationResult> {
    // First check if Python is available
    const pythonCheck = await this.checkPython()
    if (!pythonCheck.valid) {
      return pythonCheck
    }

    // Then check if build123d is installed
    return this.checkBuild123d()
  }

  private checkPython(): Promise<CADValidationResult> {
    return new Promise((resolve) => {
      const process = spawn(this.pythonPath, ['--version'], {
        windowsHide: true
      })

      const stdoutBuf = createCappedBuffer()
      const stderrBuf = createCappedBuffer()

      process.stdout?.on('data', (data) => stdoutBuf.append(data))
      process.stderr?.on('data', (data) => stderrBuf.append(data))

      const timeout = setTimeout(() => {
        process.kill()
        resolve({
          valid: false,
          error: 'Python version check timed out'
        })
      }, 5000)

      process.on('close', (code) => {
        clearTimeout(timeout)
        if (code === 0) {
          const version = stdoutBuf.rawValue.trim() || stderrBuf.rawValue.trim()
          resolve({
            valid: true,
            version: version
          })
        } else {
          resolve({
            valid: false,
            error: `Python check failed: ${stderrBuf.value || stdoutBuf.value}`
          })
        }
      })

      process.on('error', (error) => {
        clearTimeout(timeout)
        resolve({
          valid: false,
          error: `Python not found: ${error.message}`
        })
      })
    })
  }

  private checkBuild123d(): Promise<CADValidationResult> {
    return new Promise((resolve) => {
      const checkScript = `
import sys
try:
    import build123d
    print(f"build123d {build123d.__version__ if hasattr(build123d, '__version__') else 'installed'}")
except ImportError:
    print("NOT_INSTALLED", file=sys.stderr)
    sys.exit(1)
`
      const process = spawn(this.pythonPath, ['-c', checkScript], {
        windowsHide: true
      })

      const stdoutBuf = createCappedBuffer()
      const stderrBuf = createCappedBuffer()

      process.stdout?.on('data', (data) => stdoutBuf.append(data))
      process.stderr?.on('data', (data) => stderrBuf.append(data))

      const timeout = setTimeout(() => {
        process.kill()
        resolve({
          valid: false,
          error: 'build123d check timed out'
        })
      }, 10000)

      process.on('close', (code) => {
        clearTimeout(timeout)
        if (code === 0) {
          resolve({
            valid: true,
            version: stdoutBuf.rawValue.trim()
          })
        } else {
          const errDetail = stderrBuf.rawValue.trim() || stdoutBuf.rawValue.trim() || 'build123d is not installed'
          resolve({
            valid: false,
            error: `build123d check failed: ${errDetail}. Install with: pip install build123d`
          })
        }
      })

      process.on('error', (error) => {
        clearTimeout(timeout)
        resolve({
          valid: false,
          error: `Failed to check build123d: ${error.message}`
        })
      })
    })
  }

  getBackendName(): string {
    return 'build123d'
  }

  getFileExtension(): string {
    return 'py'
  }

  getLanguage(): string {
    return 'python'
  }
}
