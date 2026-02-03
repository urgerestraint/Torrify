// CAD Backend types and interfaces

export type CADBackend = 'openscad' | 'build123d'

export interface CADConfig {
  backend: CADBackend
  openscad?: {
    path: string
  }
  build123d?: {
    pythonPath: string
  }
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
  /**
   * Render code to STL and return base64-encoded result
   */
  renderStl(code: string): Promise<CADRenderResult>
  
  /**
   * Validate that the backend is properly configured and available
   */
  validateSetup(): Promise<CADValidationResult>
  
  /**
   * Get the display name of this backend
   */
  getBackendName(): string
  
  /**
   * Get the file extension for source files (e.g., 'scad', 'py')
   */
  getFileExtension(): string
  
  /**
   * Get the Monaco editor language identifier
   */
  getLanguage(): string
}

// Backend metadata
export const BACKEND_INFO: Record<CADBackend, {
  name: string
  description: string
  fileExtension: string
  language: string
  defaultCode: string
}> = {
  openscad: {
    name: 'OpenSCAD',
    description: 'OpenSCAD - The Programmers Solid 3D CAD Modeller',
    fileExtension: 'scad',
    language: 'c',  // Using C as proxy for OpenSCAD
    defaultCode: '// OpenSCAD code\ncube([10, 10, 10]);'
  },
  build123d: {
    name: 'build123d',
    description: 'build123d - Python CAD library based on Open CASCADE',
    fileExtension: 'py',
    language: 'python',
    defaultCode: `# build123d code
from build123d import *

# Create a simple box
box = Box(10, 10, 10)
`
  }
}
