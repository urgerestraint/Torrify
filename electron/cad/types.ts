// CAD Backend types for Electron main process

export type CADBackend = 'openscad' | 'build123d'

export interface CADConfig {
  backend: CADBackend
  openscadPath?: string
  build123dPythonPath?: string
}

export interface CADRenderResult {
  success: boolean
  stlBase64?: string
  error?: string
  timestamp: number
}

export interface CADValidationResult {
  valid: boolean
  error?: string
  version?: string
}

export interface CADService {
  renderStl(code: string): Promise<CADRenderResult>
  validateSetup(): Promise<CADValidationResult>
  getBackendName(): string
  getFileExtension(): string
  getLanguage(): string
}
