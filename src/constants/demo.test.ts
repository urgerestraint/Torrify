import { describe, it, expect } from 'vitest'
import { DEMO_CODE, DEMO_PROMPT, DEMO_RESPONSE } from './demo'

describe('demo constants', () => {
  it('DEMO_CODE is non-empty OpenSCAD code', () => {
    expect(DEMO_CODE).toBeTruthy()
    expect(typeof DEMO_CODE).toBe('string')
    expect(DEMO_CODE).toMatch(/board_length|plate_margin|rounded_plate|union/)
  })

  it('DEMO_PROMPT describes the demo', () => {
    expect(DEMO_PROMPT).toBeTruthy()
    expect(DEMO_PROMPT).toMatch(/Raspberry Pi|backing plate|heat-set inserts/i)
  })

  it('DEMO_RESPONSE includes OpenSCAD and design description', () => {
    expect(DEMO_RESPONSE).toBeTruthy()
    expect(DEMO_RESPONSE).toMatch(/OpenSCAD|openscad/i)
    expect(DEMO_RESPONSE).toMatch(/plate|bosses|M2\.5/i)
    expect(DEMO_RESPONSE).toContain(DEMO_CODE)
  })
})
