import { describe, it, expect } from 'vitest'
import { BACKEND_INFO, type CADBackend } from '../types'

describe('CAD Service Types', () => {
  describe('BACKEND_INFO', () => {
    it('should have openscad backend', () => {
      expect(BACKEND_INFO.openscad).toBeDefined()
      expect(BACKEND_INFO.openscad.name).toBe('OpenSCAD')
    })

    it('should have build123d backend', () => {
      expect(BACKEND_INFO.build123d).toBeDefined()
      expect(BACKEND_INFO.build123d.name).toBe('build123d')
    })

    it('should have correct info for openscad', () => {
      const info = BACKEND_INFO.openscad
      expect(info.fileExtension).toBe('scad')
      expect(info.language).toBe('scad')
      expect(info.defaultCode).toContain('cube')
    })

    it('should have correct info for build123d', () => {
      const info = BACKEND_INFO.build123d
      expect(info.fileExtension).toBe('py')
      expect(info.language).toBe('python')
      expect(info.defaultCode).toContain('build123d')
    })
  })

  describe('CADBackend type', () => {
    it('should accept valid backend values', () => {
      const openscad: CADBackend = 'openscad'
      const build123d: CADBackend = 'build123d'
      
      expect(openscad).toBe('openscad')
      expect(build123d).toBe('build123d')
    })
  })
})
