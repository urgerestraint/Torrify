import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import type { Settings } from './types'

/**
 * Resolve default Python executable path for build123d.
 * Prefers pyenv-win shims, then versioned installs, then system Python.
 */
export function getDefaultPythonPath(): string {
  const pythonPaths = [
    path.join(os.homedir(), '.pyenv', 'pyenv-win', 'shims', 'python.exe'),
    path.join(os.homedir(), '.pyenv', 'pyenv-win', 'versions', '3.13.11', 'python.exe'),
    path.join(os.homedir(), '.pyenv', 'pyenv-win', 'versions', '3.12.0', 'python.exe'),
    path.join(os.homedir(), '.pyenv', 'pyenv-win', 'versions', '3.11.0', 'python.exe'),
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python313', 'python.exe'),
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python312', 'python.exe'),
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe'),
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python310', 'python.exe'),
    'C:\\Python313\\python.exe',
    'C:\\Python312\\python.exe',
    'C:\\Python311\\python.exe',
    'C:\\Python310\\python.exe'
  ]

  for (const pythonPath of pythonPaths) {
    try {
      if (fs.existsSync(pythonPath)) {
        return pythonPath
      }
    } catch {
      // Ignore errors
    }
  }

  return 'python'
}

export function getDefaultSettings(): Settings {
  return {
    cadBackend: 'openscad',
    openscadPath: 'C:\\Program Files\\OpenSCAD (Nightly)\\openscad.exe',
    build123dPythonPath: getDefaultPythonPath(),
    llm: {
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp',
      apiKey: '',
      enabled: false,
      temperature: 0.7,
      maxTokens: 2048
    },
    recentFiles: []
  }
}
