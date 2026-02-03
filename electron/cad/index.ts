// CAD Service Factory for Electron main process

import type { CADService, CADConfig, CADBackend } from './types'
import { OpenSCADService } from './OpenSCADService'
import { Build123dService } from './Build123dService'

export * from './types'
export { OpenSCADService } from './OpenSCADService'
export { Build123dService } from './Build123dService'

export function createCADService(config: CADConfig): CADService {
  switch (config.backend) {
    case 'openscad':
      if (!config.openscadPath) {
        throw new Error('OpenSCAD path is required')
      }
      return new OpenSCADService(config.openscadPath)

    case 'build123d':
      return new Build123dService(config.build123dPythonPath || 'python')

    default:
      throw new Error(`Unknown CAD backend: ${config.backend}`)
  }
}

// Backend display names
export const BACKEND_NAMES: Record<CADBackend, string> = {
  openscad: 'OpenSCAD',
  build123d: 'build123d (Python)'
}

// Backend descriptions
export const BACKEND_DESCRIPTIONS: Record<CADBackend, string> = {
  openscad: 'Traditional OpenSCAD with its declarative modeling language',
  build123d: 'Python-based CAD using the build123d library (requires Python + pip install build123d)'
}
