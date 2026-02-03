// CAD Service Factory

import type { CADConfig, CADBackend } from './types'
export * from './types'

// Note: The actual service implementations run in the Electron main process
// This factory creates a proxy that communicates via IPC
// The real implementations are in electron/cad/ directory

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

// Backend display names for UI
export const BACKEND_NAMES: Record<CADBackend, string> = {
  openscad: 'OpenSCAD',
  build123d: 'build123d (Python)'
}

// Default executable/interpreter paths by platform
export const DEFAULT_PATHS: Record<CADBackend, Record<string, string>> = {
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
}
