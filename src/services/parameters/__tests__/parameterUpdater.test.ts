import { describe, it, expect } from 'vitest'
import { extractParameters } from '../parameterParser'
import { updateParameterInCode } from '../parameterUpdater'

describe('parameterUpdater', () => {
  it('updates numeric parameter in OpenSCAD code', () => {
    const code = `// ==========================================
// CONFIGURATION (Editable Parameters)
// ==========================================
width_mm = 100;

// ==========================================
// IMPLEMENTATION
// ==========================================
cube([width_mm, 50, 20]);
`
    const params = extractParameters(code, { backend: 'openscad' })
    expect(params).toHaveLength(1)
    const updated = updateParameterInCode(code, params[0], 200)
    expect(updated).toContain('width_mm = 200;')
    expect(updated).toContain('cube([width_mm, 50, 20]);')
  })

  it('updates boolean parameter', () => {
    const code = `// ==========================================
// CONFIGURATION (Editable Parameters)
// ==========================================
flag = true;

// ==========================================
// IMPLEMENTATION
// ==========================================
`
    const params = extractParameters(code, { backend: 'openscad' })
    expect(params).toHaveLength(1)
    const updated = updateParameterInCode(code, params[0], false)
    expect(updated).toContain('flag = false')
  })

  it('preserves CRLF line endings when updating', () => {
    const code = '// ==========================================\r\n// CONFIGURATION (Editable Parameters)\r\n// ==========================================\r\nwidth_mm = 100;\r\n\r\n// ==========================================\r\n// IMPLEMENTATION\r\n// ==========================================\r\n'
    const params = extractParameters(code, { backend: 'openscad' })
    expect(params).toHaveLength(1)
    const updated = updateParameterInCode(code, params[0], 50)
    expect(updated).toContain('width_mm = 50;')
    expect(updated).toContain('\r\n')
  })

  it('updates string parameter with proper escaping', () => {
    const code = `// ==========================================
// CONFIGURATION (Editable Parameters)
// ==========================================
name = "hello";

// ==========================================
// IMPLEMENTATION
// ==========================================
`
    const params = extractParameters(code, { backend: 'openscad' })
    expect(params).toHaveLength(1)
    const updated = updateParameterInCode(code, params[0], 'world')
    expect(updated).toContain('name = "world"')
  })
})
