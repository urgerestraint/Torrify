// CAD Backend types and interfaces

/**
 * Supported Computer-Aided Design (CAD) backends.
 */
export type CADBackend = 'openscad' | 'build123d'

/**
 * Configuration for the active CAD backend service.
 */
export interface CADConfig {
  /** The backend to use for rendering */
  readonly backend: CADBackend
  /** OpenSCAD-specific configuration */
  readonly openscad?: {
    /** Absolute path to the OpenSCAD executable */
    readonly path: string
  }
  /** build123d-specific configuration */
  readonly build123d?: {
    /** Absolute path to the Python interpreter with build123d installed */
    readonly pythonPath: string
  }
}

/**
 * Result of a CAD render operation.
 */
export interface CADRenderResult {
  /** Whether the render completed successfully */
  readonly success: boolean
  /** The rendered STL data as a base64 string (null if failed) */
  readonly stlBase64?: string
  /** Human-readable error message if success is false */
  readonly error?: string
  /** Unix timestamp when the render completed */
  readonly timestamp: number
}

/**
 * Result of a backend configuration validation check.
 */
export interface CADValidationResult {
  /** Whether the backend is valid and ready to use */
  readonly valid: boolean
  /** Reason for validation failure, if any */
  readonly error?: string
  /** Version string reported by the backend (e.g. "OpenSCAD 2021.01") */
  readonly version?: string
}

/**
 * Generic interface for a CAD backend service.
 * Implementations handle code execution and geometry extraction.
 */
export interface CADService {
  /**
   * Compiles and renders CAD code into an STL file.
   * 
   * @param code - The source code to render
   * @returns A promise resolving to the render result (STL data or error)
   */
  renderStl(code: string): Promise<CADRenderResult>
  
  /**
   * Verifies that the backend executable and dependencies are correctly installed.
   * @returns A promise resolving to the validation status
   */
  validateSetup(): Promise<CADValidationResult>
  
  /**
   * Returns the human-friendly name of the backend.
   */
  getBackendName(): string
  
  /**
   * Returns the preferred file extension for this backend (e.g., 'scad', 'py').
   */
  getFileExtension(): string
  
  /**
   * Returns the language identifier for syntax highlighting (e.g., 'python').
   */
  getLanguage(): string
}

/**
 * Static metadata for each supported CAD backend.
 * Used for UI display, editor configuration, and default code templates.
 */
export const BACKEND_INFO: Record<CADBackend, {
  readonly name: string
  readonly description: string
  readonly fileExtension: string
  readonly language: string
  readonly defaultCode: string
}> = {
  openscad: {
    name: 'OpenSCAD',
    description: 'OpenSCAD - The Programmers Solid 3D CAD Modeller',
    fileExtension: 'scad',
    language: 'scad', // Note: using scad if available in Monaco
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
