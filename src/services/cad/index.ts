/**
 * CAD Service Factory and Configuration Utilities.
 * 
 * Note: Actual CAD geometry processing happens in the Electron main process.
 * This file provides types and configurations for the renderer to communicate
 * with those services via IPC.
 */

import type { CADConfig, CADBackend } from './types'
export * from './types'

/**
 * Creates a configuration object for the CAD service.
 * 
 * @param backend - The active CAD backend ('openscad' or 'build123d')
 * @param openscadPath - Absolute path to the OpenSCAD executable
 * @param build123dPythonPath - Absolute path to the Python interpreter for build123d
 * @returns A consolidated CAD configuration object
 */
export function createCADServiceConfig(
  backend: CADBackend,
  openscadPath?: string,
  build123dPythonPath?: string
): CADConfig {
  return {
    backend,
    openscad: openscadPath ? { path: openscadPath } : undefined,
    build123d: build123dPythonPath ? { pythonPath: build123dPythonPath } : undefined
  }
}

/**
 * Human-readable display names for supported CAD backends.
 */
export const BACKEND_NAMES: Readonly<Record<CADBackend, string>> = {
  openscad: 'OpenSCAD',
  build123d: 'build123d (Python)'
} as const

/**
 * Default executable or interpreter paths mapped by backend and platform (win32, darwin, linux).
 */
export const DEFAULT_PATHS: Readonly<Record<CADBackend, Record<string, string>>> = {
  openscad: {
    win32: 'C:\\Program Files\\OpenSCAD (Nightly)\\openscad.exe',
    darwin: '/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD',
    linux: '/usr/bin/openscad'
  },
  build123d: {
    win32: 'python',
    darwin: 'python3',
    linux: 'python3'
  }
} as const
