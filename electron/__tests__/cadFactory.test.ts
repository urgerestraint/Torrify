import { describe, it, expect } from 'vitest'
import { createCADService, BACKEND_NAMES } from '../cad'

describe('createCADService', () => {
  it('creates OpenSCADService for openscad backend', () => {
    const service = createCADService({
      backend: 'openscad',
      openscadPath: 'C:\\Program Files\\OpenSCAD\\openscad.exe'
    })
    expect(service.getBackendName()).toBe('OpenSCAD')
    expect(service.getFileExtension()).toBe('scad')
    expect(service.getLanguage()).toBe('c')
  })

  it('creates Build123dService for build123d backend', () => {
    const service = createCADService({
      backend: 'build123d',
      build123dPythonPath: 'python'
    })
    expect(service.getBackendName()).toBe('build123d')
    expect(service.getFileExtension()).toBe('py')
    expect(service.getLanguage()).toBe('python')
  })

  it('throws when openscad backend has no path', () => {
    expect(() =>
      createCADService({ backend: 'openscad' })
    ).toThrow('OpenSCAD path is required')
  })

  it('uses default python when build123d has no path', () => {
    const service = createCADService({ backend: 'build123d' })
    expect(service.getBackendName()).toBe('build123d')
  })

  it('throws for unknown backend', () => {
    expect(() =>
      createCADService({ backend: 'unknown' as 'openscad' })
    ).toThrow('Unknown CAD backend')
  })
})

describe('BACKEND_NAMES', () => {
  it('has display names for both backends', () => {
    expect(BACKEND_NAMES.openscad).toBe('OpenSCAD')
    expect(BACKEND_NAMES.build123d).toBe('build123d (Python)')
  })
})
