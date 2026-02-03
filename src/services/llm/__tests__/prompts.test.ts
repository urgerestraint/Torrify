import { describe, it, expect } from 'vitest'
import { getSystemPrompt, getSystemPromptBlocks, OPENSCAD_SYSTEM_PROMPT, BUILD123D_SYSTEM_PROMPT } from '../prompts'

describe('prompts', () => {
  describe('getSystemPrompt', () => {
    it('returns OpenSCAD prompt for openscad backend', () => {
      const prompt = getSystemPrompt('openscad')
      expect(prompt).toContain('OpenSCAD')
      expect(prompt).toBe(OPENSCAD_SYSTEM_PROMPT)
    })

    it('returns build123d prompt for build123d backend', () => {
      const prompt = getSystemPrompt('build123d')
      expect(prompt).toContain('build123d')
      expect(prompt).toBe(BUILD123D_SYSTEM_PROMPT)
    })

    it('includes API context when provided for openscad', () => {
      const apiContext = 'cube(size) - Creates a cube'
      const prompt = getSystemPrompt('openscad', undefined, apiContext)
      
      expect(prompt).toContain('API Reference')
      expect(prompt).toContain('cube(size) - Creates a cube')
      expect(prompt).toContain('OpenSCAD')
    })

    it('includes API context when provided for build123d', () => {
      const apiContext = 'Box(width, depth, height) - Creates a box'
      const prompt = getSystemPrompt('build123d', undefined, apiContext)
      
      expect(prompt).toContain('API Reference')
      expect(prompt).toContain('Box(width, depth, height) - Creates a box')
      expect(prompt).toContain('build123d')
    })

    it('includes current code when provided for openscad', () => {
      const currentCode = 'cube([10, 10, 10]);'
      const prompt = getSystemPrompt('openscad', currentCode)
      
      expect(prompt).toContain('Current code in editor')
      expect(prompt).toContain('```openscad')
      expect(prompt).toContain('cube([10, 10, 10]);')
    })

    it('includes current code when provided for build123d', () => {
      const currentCode = 'from build123d import Box\nresult = Box(10, 10, 10)'
      const prompt = getSystemPrompt('build123d', currentCode)
      
      expect(prompt).toContain('Current code in editor')
      expect(prompt).toContain('```python')
      expect(prompt).toContain('from build123d import Box')
    })

    it('includes both API context and current code', () => {
      const apiContext = 'cube(size) - Creates a cube'
      const currentCode = 'cube([10, 10, 10]);'
      const prompt = getSystemPrompt('openscad', currentCode, apiContext)
      
      expect(prompt).toContain('API Reference')
      expect(prompt).toContain('Current code in editor')
      expect(prompt).toContain('cube(size) - Creates a cube')
      expect(prompt).toContain('cube([10, 10, 10]);')
    })

    it('maintains base prompt structure', () => {
      const prompt = getSystemPrompt('openscad')
      expect(prompt).toContain('You are an expert OpenSCAD assistant')
      expect(prompt).toContain('Code-CAD Standard')
    })
  })

  describe('getSystemPromptBlocks', () => {
    it('returns static block only when no API context or current code', () => {
      const { staticBlocks, dynamicBlock } = getSystemPromptBlocks('openscad')
      expect(staticBlocks).toHaveLength(1)
      expect(staticBlocks[0]).toBe(OPENSCAD_SYSTEM_PROMPT)
      expect(dynamicBlock).toBeNull()
    })

    it('returns base + API reference as static blocks when apiContext provided', () => {
      const apiContext = 'cube(size) - Creates a cube'
      const { staticBlocks, dynamicBlock } = getSystemPromptBlocks('openscad', undefined, apiContext)
      expect(staticBlocks).toHaveLength(2)
      expect(staticBlocks[0]).toBe(OPENSCAD_SYSTEM_PROMPT)
      expect(staticBlocks[1]).toContain('API Reference')
      expect(staticBlocks[1]).toContain('cube(size) - Creates a cube')
      expect(dynamicBlock).toBeNull()
    })

    it('returns dynamic block when currentCode provided', () => {
      const currentCode = 'cube([10, 10, 10]);'
      const { staticBlocks, dynamicBlock } = getSystemPromptBlocks('openscad', currentCode)
      expect(staticBlocks).toHaveLength(1)
      expect(dynamicBlock).not.toBeNull()
      expect(dynamicBlock).toContain('Current code in editor')
      expect(dynamicBlock).toContain('```openscad')
      expect(dynamicBlock).toContain('cube([10, 10, 10]);')
    })

    it('returns static + dynamic when both apiContext and currentCode provided', () => {
      const apiContext = 'Box(w, d, h)'
      const currentCode = 'from build123d import Box'
      const { staticBlocks, dynamicBlock } = getSystemPromptBlocks('build123d', currentCode, apiContext)
      expect(staticBlocks).toHaveLength(2)
      expect(staticBlocks[1]).toContain('API Reference')
      expect(staticBlocks[1]).toContain('Box(w, d, h)')
      expect(dynamicBlock).toContain('Current code in editor')
      expect(dynamicBlock).toContain('```python')
      expect(dynamicBlock).toContain('from build123d import Box')
    })
  })
})
