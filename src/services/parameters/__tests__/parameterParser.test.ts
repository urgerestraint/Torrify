import { describe, it, expect } from 'vitest'
import { extractParameters } from '../parameterParser'

describe('parameterParser', () => {
  describe('OpenSCAD', () => {
    it('extracts numeric parameters from CONFIGURATION block', () => {
      const code = `// ==========================================
// CONFIGURATION (Editable Parameters)
// ==========================================
width_mm  = 100; // Total width of the box
depth_mm  = 50;  // Total depth
height_mm = 20;

// ==========================================
// IMPLEMENTATION
// ==========================================
cube([width_mm, depth_mm, height_mm]);
`
      const params = extractParameters(code, { backend: 'openscad' })
      expect(params).toHaveLength(3)
      expect(params[0]).toMatchObject({
        name: 'width_mm',
        displayName: 'Width (mm)',
        type: 'number',
        value: 100,
        unit: 'mm'
      })
      expect(params[1]).toMatchObject({ name: 'depth_mm', value: 50 })
      expect(params[2]).toMatchObject({ name: 'height_mm', value: 20 })
    })

    it('extracts boolean and string parameters', () => {
      const code = `// ==========================================
// CONFIGURATION (Editable Parameters)
// ==========================================
enabled = true;
shape = "hex";

// ==========================================
// IMPLEMENTATION
// ==========================================
`
      const params = extractParameters(code, { backend: 'openscad' })
      expect(params).toHaveLength(2)
      expect(params[0]).toMatchObject({ name: 'enabled', type: 'boolean', value: true })
      expect(params[1]).toMatchObject({ name: 'shape', type: 'string', value: 'hex' })
    })

    it('treats expressions as non-editable', () => {
      const code = `// ==========================================
// CONFIGURATION (Editable Parameters)
// ==========================================
smoothness = $preview ? 32 : 128;

// ==========================================
// IMPLEMENTATION
// ==========================================
`
      const params = extractParameters(code, { backend: 'openscad' })
      expect(params).toHaveLength(1)
      expect(params[0]).toMatchObject({
        name: 'smoothness',
        type: 'expression',
        rawValue: '$preview ? 32 : 128'
      })
    })

    it('returns empty array when no CONFIGURATION block', () => {
      const code = `cube([10, 20, 30]);`
      const params = extractParameters(code, { backend: 'openscad' })
      expect(params).toEqual([])
    })

    it('handles Windows CRLF line endings correctly', () => {
      const code = '// ==========================================\r\n// CONFIGURATION (Editable Parameters)\r\n// ==========================================\r\nwidth_mm = 100;\r\n\r\n// ==========================================\r\n// IMPLEMENTATION\r\n// ==========================================\r\n'
      const params = extractParameters(code, { backend: 'openscad' })
      expect(params).toHaveLength(1)
      expect(params[0]).toMatchObject({ name: 'width_mm', value: 100 })
      // Verify charStart/charEnd point to the value for correct replacement
      const val = code.slice(params[0].charStart, params[0].charEnd)
      expect(val).toBe('100')
    })
  })

  describe('build123d', () => {
    it('extracts parameters from CONFIGURATION block', () => {
      const code = `# ==========================================
# CONFIGURATION (Editable Parameters)
# ==========================================
WIDTH_MM = 100.0
HEIGHT_MM = 20.0

# ==========================================
# IMPLEMENTATION
# ==========================================
from build123d import Box
`
      const params = extractParameters(code, { backend: 'build123d' })
      expect(params).toHaveLength(2)
      expect(params[0]).toMatchObject({
        name: 'WIDTH_MM',
        displayName: 'Width (mm)',
        type: 'number',
        value: 100
      })
      expect(params[1]).toMatchObject({ name: 'HEIGHT_MM', value: 20 })
    })

    it('extracts inline comments', () => {
      const code = `# ==========================================
# CONFIGURATION (Editable Parameters)
# ==========================================
LENGTH_MM = 50.0  # Total length

# ==========================================
# IMPLEMENTATION
# ==========================================
`
      const params = extractParameters(code, { backend: 'build123d' })
      expect(params[0].comment).toBe('Total length')
    })
  })
})
