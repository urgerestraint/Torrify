/**
 * CAD Backend Types and Interfaces for the Main Process.
 * 
 * These types define the contract for CAD service implementations running
 * in the Electron main process, which handle code execution via external
 * processes (e.g., OpenSCAD CLI or Python interpreter).
 */

/** Supported Computer-Aided Design backends */
export type CADBackend = 'openscad' | 'build123d'

/**
 * Configuration for the active CAD backend.
 */
export interface CADConfig {
  /** The backend to use for rendering operations */
  readonly backend: CADBackend
  /** Absolute path to the OpenSCAD executable */
  readonly openscadPath?: string
  /** Absolute path to the Python interpreter with build123d installed */
  readonly build123dPythonPath?: string
}

/**
 * Result of a CAD geometry rendering operation.
 */
export interface CADRenderResult {
  /** Whether the render process completed successfully */
  readonly success: boolean
  /** Base64-encoded STL data (present if success is true) */
  readonly stlBase64?: string
  /** Error message or stack trace (present if success is false) */
  readonly error?: string
  /** Unix timestamp when the render operation finished */
  readonly timestamp: number
}

/**
 * Result of a backend configuration validation check.
 */
export interface CADValidationResult {
  /** Whether the backend environment is correctly configured and accessible */
  readonly valid: boolean
  /** Human-readable reason for validation failure */
  readonly error?: string
  /** Version identifier reported by the backend tool */
  readonly version?: string
}

/**
 * Interface for CAD service implementations in the main process.
 */
export interface CADService {
  /**
   * Compiles CAD source code and generates STL geometry.
   * 
   * @param code - The raw source code string
   * @returns A promise resolving to the render result
   */
  renderStl(code: string, requestId?: string): Promise<CADRenderResult>

  /**
   * Verifies that the required executables and libraries are present and valid.
   * @returns A promise resolving to the validation status
   */
  validateSetup(): Promise<CADValidationResult>

  /**
   * Returns the human-friendly name of the backend.
   */
  getBackendName(): string

  /**
   * Returns the file extension used for source files (e.g., 'scad', 'py').
   */
  getFileExtension(): string

  /**
   * Returns the Monaco editor language identifier for this backend.
   */
  getLanguage(): string
}
