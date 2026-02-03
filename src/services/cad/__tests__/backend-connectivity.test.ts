/**
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest'
import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/**
 * Backend Connectivity Tests
 * 
 * These tests check if CAD backends (OpenSCAD, build123d) are actually installed
 * and working on the system. They are skipped by default to avoid failing CI/CD
 * when backends are not installed.
 * 
 * To run these tests:
 *   - Set environment variable: RUN_BACKEND_TESTS=true
 *   - Example: RUN_BACKEND_TESTS=true npm test
 * 
 * These tests are allowed to fail - they're informational to help developers
 * verify their setup. They will be skipped unless RUN_BACKEND_TESTS=true is set.
 */

const RUN_BACKEND_TESTS = process.env.RUN_BACKEND_TESTS === 'true'

// Skip by default unless explicitly enabled
const testSuite = RUN_BACKEND_TESTS ? describe : describe.skip

testSuite('Backend Connectivity (Optional - Allowed to Fail)', () => {
  describe('OpenSCAD', () => {
    it('checks if OpenSCAD executable exists in common locations', async () => {
      const commonPaths = [
        'C:\\Program Files\\OpenSCAD\\openscad.exe',
        'C:\\Program Files (x86)\\OpenSCAD\\openscad.exe',
        'C:\\Program Files\\OpenSCAD (Nightly)\\openscad.exe',
        '/usr/bin/openscad',
        '/usr/local/bin/openscad',
        '/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD'
      ]

      const foundPaths: string[] = []
      for (const testPath of commonPaths) {
        if (fs.existsSync(testPath)) {
          foundPaths.push(testPath)
        }
      }

      console.log('OpenSCAD search results:', foundPaths.length > 0 ? foundPaths : 'Not found in common locations')
      
      // This test passes regardless - it's informational
      expect(true).toBe(true)
    })

    it('checks if OpenSCAD responds to --version', async () => {
      return new Promise<void>((resolve) => {
        // Try common executable names
        const executables = ['openscad', 'openscad.exe']
        let found = false

        const tryExecutable = (exe: string) => {
          const process = spawn(exe, ['--version'], {
            windowsHide: true,
            shell: true
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
            if (!found) {
              console.log(`OpenSCAD ${exe} --version timed out or not found`)
              resolve()
            }
          }, 5000)

          process.on('close', (code) => {
            clearTimeout(timeout)
            if (code === 0) {
              found = true
              const version = stdout.trim() || stderr.trim()
              console.log(`OpenSCAD found: ${version}`)
              resolve()
            } else if (!found && exe === executables[executables.length - 1]) {
              console.log('OpenSCAD not found or not responding')
              resolve()
            }
          })

          process.on('error', () => {
            clearTimeout(timeout)
            if (!found && exe === executables[executables.length - 1]) {
              console.log(`OpenSCAD ${exe} not found`)
              resolve()
            }
          })
        }

        for (const exe of executables) {
          if (!found) {
            tryExecutable(exe)
          }
        }
      })
    })

    it('attempts to render a simple cube (if OpenSCAD is available)', async () => {
      return new Promise<void>((resolve) => {
        const tempDir = path.join(os.tmpdir(), 'torrify-test')
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true })
        }

        const testScad = path.join(tempDir, 'test_cube.scad')
        const testStl = path.join(tempDir, 'test_cube.stl')
        const testCode = 'cube([10, 10, 10]);'

        fs.writeFileSync(testScad, testCode, 'utf-8')

        const process = spawn('openscad', ['-o', testStl, testScad], {
          windowsHide: true,
          shell: true
        })

        const timeout = setTimeout(() => {
          process.kill()
          console.log('OpenSCAD render test timed out (this is OK if OpenSCAD is not installed)')
          // Cleanup
          try {
            if (fs.existsSync(testScad)) fs.unlinkSync(testScad)
            if (fs.existsSync(testStl)) fs.unlinkSync(testStl)
          } catch {}
          resolve()
        }, 10000)

        process.on('close', (code) => {
          clearTimeout(timeout)
          if (code === 0 && fs.existsSync(testStl)) {
            const stats = fs.statSync(testStl)
            console.log(`OpenSCAD successfully rendered cube: ${stats.size} bytes`)
            expect(stats.size).toBeGreaterThan(0)
          } else {
            console.log('OpenSCAD render test failed or OpenSCAD not available (this is OK)')
          }
          
          // Cleanup
          try {
            if (fs.existsSync(testScad)) fs.unlinkSync(testScad)
            if (fs.existsSync(testStl)) fs.unlinkSync(testStl)
          } catch {}
          
          resolve()
        })

        process.on('error', () => {
          clearTimeout(timeout)
          console.log('OpenSCAD not found (this is OK)')
          // Cleanup
          try {
            if (fs.existsSync(testScad)) fs.unlinkSync(testScad)
            if (fs.existsSync(testStl)) fs.unlinkSync(testStl)
          } catch {}
          resolve()
        })
      })
    })
  })

  describe('build123d (Python)', () => {
    it('checks if Python is available', async () => {
      return new Promise<void>((resolve) => {
        const executables = ['python', 'python3', 'python.exe']
        let found = false

        const tryExecutable = (exe: string) => {
          const process = spawn(exe, ['--version'], {
            windowsHide: true,
            shell: true
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
            if (!found && exe === executables[executables.length - 1]) {
              console.log('Python not found')
              resolve()
            }
          }, 5000)

          process.on('close', (code) => {
            clearTimeout(timeout)
            if (code === 0) {
              found = true
              const version = stdout.trim() || stderr.trim()
              console.log(`Python found: ${version}`)
              resolve()
            } else if (!found && exe === executables[executables.length - 1]) {
              console.log('Python not found or not responding')
              resolve()
            }
          })

          process.on('error', () => {
            clearTimeout(timeout)
            if (!found && exe === executables[executables.length - 1]) {
              console.log(`Python ${exe} not found`)
              resolve()
            }
          })
        }

        for (const exe of executables) {
          if (!found) {
            tryExecutable(exe)
          }
        }
      })
    })

    it('checks if build123d is installed', async () => {
      return new Promise<void>((resolve) => {
        const pythonExe = (typeof process !== 'undefined' && process.platform === 'win32') ? 'python' : 'python3'
        const checkScript = `
import sys
try:
    import build123d
    version = getattr(build123d, '__version__', 'installed')
    print(f"build123d {version}")
    sys.exit(0)
except ImportError:
    print("build123d not installed", file=sys.stderr)
    sys.exit(1)
`

        const childProcess = spawn(pythonExe, ['-c', checkScript], {
          windowsHide: true,
          shell: true
        })

        let stdout = ''
        let stderr = ''

        childProcess.stdout?.on('data', (data: Buffer | string) => {
          stdout += data.toString()
        })

        childProcess.stderr?.on('data', (data: Buffer | string) => {
          stderr += data.toString()
        })

        const timeout = setTimeout(() => {
          childProcess.kill()
          console.log('build123d check timed out (this is OK if Python/build123d is not installed)')
          resolve()
        }, 10000)

        childProcess.on('close', (code: number | null) => {
          clearTimeout(timeout)
          if (code === 0) {
            console.log(`build123d found: ${stdout.trim()}`)
          } else {
            console.log('build123d not installed (this is OK)')
            console.log('Install with: pip install build123d')
          }
          resolve()
        })

        childProcess.on('error', () => {
          clearTimeout(timeout)
          console.log('Python not found, cannot check build123d (this is OK)')
          resolve()
        })
      })
    })

    it('attempts to render a simple box (if build123d is available)', async () => {
      return new Promise<void>((resolve) => {
        const pythonExe = (typeof process !== 'undefined' && process.platform === 'win32') ? 'python' : 'python3'
        const tempDir = path.join(os.tmpdir(), 'torrify-test')
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true })
        }

        const testStl = path.join(tempDir, 'test_box.stl')
        const testScript = `
from build123d import BuildPart, Box, export_stl

with BuildPart() as box:
    Box(10, 10, 10)

export_stl(box.part, "${testStl.replace(/\\/g, '\\\\')}")
print("Success")
`

        const childProcess = spawn(pythonExe, ['-c', testScript], {
          windowsHide: true,
          shell: true
        })

        let stdout = ''
        let stderr = ''

        childProcess.stdout?.on('data', (data: Buffer | string) => {
          stdout += data.toString()
        })

        childProcess.stderr?.on('data', (data: Buffer | string) => {
          stderr += data.toString()
        })

        const timeout = setTimeout(() => {
          childProcess.kill()
          console.log('build123d render test timed out (this is OK if build123d is not installed)')
          // Cleanup
          try {
            if (fs.existsSync(testStl)) fs.unlinkSync(testStl)
          } catch {}
          resolve()
        }, 15000)

        childProcess.on('close', (code: number | null) => {
          clearTimeout(timeout)
          if (code === 0 && fs.existsSync(testStl)) {
            const stats = fs.statSync(testStl)
            console.log(`build123d successfully rendered box: ${stats.size} bytes`)
            expect(stats.size).toBeGreaterThan(0)
          } else {
            console.log('build123d render test failed or build123d not available (this is OK)')
            if (stderr) {
              console.log('Error:', stderr)
            }
          }
          
          // Cleanup
          try {
            if (fs.existsSync(testStl)) fs.unlinkSync(testStl)
          } catch {}
          
          resolve()
        })

        childProcess.on('error', () => {
          clearTimeout(timeout)
          console.log('Python/build123d not found (this is OK)')
          // Cleanup
          try {
            if (fs.existsSync(testStl)) fs.unlinkSync(testStl)
          } catch {}
          resolve()
        })
      })
    })
  })
})

