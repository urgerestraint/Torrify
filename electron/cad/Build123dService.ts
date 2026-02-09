// build123d CAD Service - Electron main process implementation

import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { CADService, CADRenderResult, CADValidationResult } from './types'
import { createCappedBuffer } from './process-utils'
import { logger } from '../utils/logger'
import { MAX_OUTPUT_FILE_SIZE } from '../constants'

// Constants
const TIMEOUT_MS = 60000 // 60 seconds (Python can be slower)

// Temp directory
const TEMP_DIR = path.join(os.tmpdir(), 'torrify')
const TEMP_PY_FILE = path.join(TEMP_DIR, 'temp_model.py')
const STL_OUTPUT = path.join(TEMP_DIR, 'render_preview.stl')

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

export class Build123dService implements CADService {
  private pythonPath: string

  constructor(pythonPath: string = 'python') {
    this.pythonPath = pythonPath
    logger.debug('[Build123dService] Initialized with Python path:', this.pythonPath)
  }

  /**
   * Generate a wrapper script that executes user code and exports to STL
   */
  private generateWrapperScript(userCode: string, outputPath: string): string {
    // Escape the output path for Python
    const escapedOutputPath = outputPath.replace(/\\/g, '\\\\')
    
    // Ensure user code is not empty (would cause IndentationError)
    const safeUserCode = userCode.trim() || 'pass  # Empty user code'
    
    return `# Auto-generated wrapper script for build123d
import sys
import traceback

# Verify build123d is available and import export_stl for wrapper use
try:
    import build123d as _b123d_module
    from build123d import export_stl as _wrapper_export_stl
except ImportError as e:
    print("BUILD123D_NOT_INSTALLED", file=sys.stderr)
    sys.exit(1)

# Execute user code in its own namespace
_user_globals = {'__name__': '__main__', '__builtins__': __builtins__}
_user_code = '''
${safeUserCode.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}
'''

try:
    exec(_user_code, _user_globals)
except Exception as e:
    print(f"ERROR in user code: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

# Find and export geometry from user code namespace
def _get_exportable(obj):
    """Extract exportable geometry from an object"""
    if obj is None:
        return None
    # If it's a BuildPart context, get the .part property
    if hasattr(obj, 'part'):
        part_attr = getattr(obj, 'part')
        # .part is a property, just access it
        if hasattr(part_attr, 'wrapped'):
            return part_attr
        return None
    # If it already has .wrapped, it's exportable
    if hasattr(obj, 'wrapped'):
        return obj
    return None

try:
    _export_result = None
    
    # First, check for common variable names in user namespace
    for var_name in ['result', 'part', 'model', 'obj', 'shape', 'solid', 'box', 'cylinder', 'sphere']:
        if var_name in _user_globals:
            candidate = _user_globals[var_name]
            _export_result = _get_exportable(candidate)
            if _export_result is not None:
                break
    
    # If nothing found, search all user variables
    if _export_result is None:
        for name, obj in _user_globals.items():
            if name.startswith('_'):
                continue
            _export_result = _get_exportable(obj)
            if _export_result is not None:
                break
    
    if _export_result is None:
        print("ERROR: No exportable geometry found. Make sure your code creates a 3D object.", file=sys.stderr)
        print("Tip: Assign your geometry to a variable like 'result', 'part', or 'model'.", file=sys.stderr)
        sys.exit(1)
    
    # Export to STL using the wrapper's import
    _wrapper_export_stl(_export_result, "${escapedOutputPath}")
    print(f"Successfully exported to ${escapedOutputPath}")
    
except Exception as e:
    print(f"ERROR during export: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
`
  }

  async renderStl(code: string): Promise<CADRenderResult> {
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | null = null
      let pythonProcess: ReturnType<typeof spawn> | null = null

      try {
        logger.debug('[Build123dService] renderStl called with pythonPath:', this.pythonPath)

        // Generate wrapper script
        const wrapperScript = this.generateWrapperScript(code, STL_OUTPUT)

        // Write script to temporary file
        fs.writeFileSync(TEMP_PY_FILE, wrapperScript, 'utf-8')
        logger.debug('[Build123dService] Temp script written to:', TEMP_PY_FILE)

        // Execute Python script
        pythonProcess = spawn(this.pythonPath, [TEMP_PY_FILE], {
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
            resolve({
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
                error: `STL output file not created. Output: ${stdoutBuf.value}\nErrors: ${stderrBuf.value}`,
                timestamp: Date.now()
              })
            }
          } else {
            // Parse error message for better feedback
            const stderrRaw = stderrBuf.rawValue
            const stdoutRaw = stdoutBuf.rawValue
            let errorMessage = stderrRaw || stdoutRaw || `Python exited with code ${exitCode}`
            
            // Check for common errors - use specific marker to avoid false positives
            if (stderrRaw.includes('BUILD123D_NOT_INSTALLED')) {
              errorMessage = 'build123d is not installed. Install it with: pip install build123d'
            } else if (stderrRaw.includes('No exportable geometry found')) {
              errorMessage = 'No exportable geometry found. Make sure your code creates a 3D object and assigns it to a variable.'
            } else if (stderrRaw.includes('ModuleNotFoundError')) {
              // Extract the module name from the error
              const match = stderrRaw.match(/No module named '([^']+)'/)
              if (match) {
                errorMessage = `Missing Python module: ${match[1]}. Make sure all required packages are installed.`
              }
            }
            
            resolve({
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
          
          resolve({
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
        resolve({
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

