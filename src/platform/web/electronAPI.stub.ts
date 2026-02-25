import type { ElectronAPI } from '../../types/electron-api'

/**
 * Desktop-only stub used by Vite aliasing so web-only modules do not enter desktop bundles.
 */
export function installWebElectronAPI(): void {
  const globalWindow = window as typeof window & { electronAPI?: ElectronAPI }
  if (!globalWindow.electronAPI) {
    throw new Error('electronAPI is not available in desktop runtime')
  }
}

