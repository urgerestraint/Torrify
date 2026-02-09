/**
 * CAD Service Factory (Main Process).
 * 
 * This module is responsible for instantiating the appropriate CAD service 
 * implementation based on the user's active configuration.
 */

import type { CADService, CADConfig, CADBackend } from './types'
import { OpenSCADService } from './OpenSCADService'
import { Build123dService } from './Build123dService'

export * from './types'
export { OpenSCADService } from './OpenSCADService'
export { Build123dService } from './Build123dService'

/**
 * Factory function to create a CAD service instance.
 * 
 * @param config - The current CAD configuration settings
 * @throws {Error} If configuration is invalid or backend is unsupported
 * @returns A concrete implementation of CADService
 */
export function createCADService(config: CADConfig): CADService {
  switch (config.backend) {
    case 'openscad':
      if (!config.openscadPath) {
        throw new Error('OpenSCAD executable path is not configured')
      }
      return new OpenSCADService(config.openscadPath)

    case 'build123d':
      // Fallback to system 'python' if path is not specified
      return new Build123dService(config.build123dPythonPath || 'python')

    default:
      throw new Error(`Unsupported CAD backend: ${config.backend}`)
  }
}

/**
 * Human-friendly names for supported CAD backends.
 */
export const BACKEND_NAMES: Readonly<Record<CADBackend, string>> = {
  openscad: 'OpenSCAD',
  build123d: 'build123d (Python)'
} as const

/**
 * Detailed descriptions for supported CAD backends.
 */
export const BACKEND_DESCRIPTIONS: Readonly<Record<CADBackend, string>> = {
  openscad: 'Traditional OpenSCAD with its declarative modeling language',
  build123d: 'Python-based CAD using the build123d library (requires Python + pip install build123d)'
} as const
