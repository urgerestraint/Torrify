import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  languageConfiguration,
  monarchLanguage,
  keywords,
  controlKeywords,
  builtins,
  constants,
  specialVariables,
  functions,
} from './openscad'

describe('OpenSCAD language definition', () => {
  describe('keywords', () => {
    it('should contain declaration keywords', () => {
      const expected = [
        'module',
        'function',
        'let',
        'include',
        'use',
      ]
      expect(keywords).toEqual(expected)
    })
  })

  describe('controlKeywords', () => {
    it('should contain flow control keywords', () => {
      const expected = [
        'if',
        'else',
        'for',
        'each',
        'intersection_for',
        'return',
      ]
      expect(controlKeywords).toEqual(expected)
    })
  })

  describe('builtins', () => {
    it('should contain 3D primitives', () => {
      expect(builtins).toContain('cube')
      expect(builtins).toContain('sphere')
      expect(builtins).toContain('cylinder')
      expect(builtins).toContain('polyhedron')
    })

    it('should contain 2D primitives', () => {
      expect(builtins).toContain('square')
      expect(builtins).toContain('circle')
      expect(builtins).toContain('polygon')
      expect(builtins).toContain('text')
    })

    it('should contain CSG operations', () => {
      expect(builtins).toContain('union')
      expect(builtins).toContain('difference')
      expect(builtins).toContain('intersection')
    })

    it('should contain transforms', () => {
      expect(builtins).toContain('translate')
      expect(builtins).toContain('rotate')
      expect(builtins).toContain('scale')
      expect(builtins).toContain('mirror')
      expect(builtins).toContain('color')
    })

    it('should contain extrusion and high-level ops', () => {
      expect(builtins).toContain('linear_extrude')
      expect(builtins).toContain('rotate_extrude')
      expect(builtins).toContain('hull')
      expect(builtins).toContain('minkowski')
      expect(builtins).toContain('children')
    })
  })

  describe('constants', () => {
    it('should contain true, false, undef, PI', () => {
      expect(constants).toEqual(['true', 'false', 'undef', 'PI'])
    })
  })

  describe('specialVariables', () => {
    it('should contain all OpenSCAD special variables', () => {
      expect(specialVariables).toContain('$fn')
      expect(specialVariables).toContain('$fa')
      expect(specialVariables).toContain('$fs')
      expect(specialVariables).toContain('$t')
      expect(specialVariables).toContain('$children')
      expect(specialVariables).toContain('$preview')
    })
  })

  describe('functions', () => {
    it('should contain math functions', () => {
      expect(functions).toContain('sin')
      expect(functions).toContain('cos')
      expect(functions).toContain('sqrt')
      expect(functions).toContain('pow')
      expect(functions).toContain('min')
      expect(functions).toContain('max')
    })

    it('should contain string functions', () => {
      expect(functions).toContain('str')
      expect(functions).toContain('chr')
      expect(functions).toContain('ord')
      expect(functions).toContain('concat')
    })
  })

  describe('languageConfiguration', () => {
    it('should define line and block comments', () => {
      expect(languageConfiguration.comments).toEqual({
        lineComment: '//',
        blockComment: ['/*', '*/'],
      })
    })

    it('should define brackets', () => {
      expect(languageConfiguration.brackets).toEqual([
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ])
    })

    it('should define autoClosingPairs', () => {
      const pairs = languageConfiguration.autoClosingPairs
      expect(pairs).toContainEqual({ open: '[', close: ']' })
      expect(pairs).toContainEqual({ open: '{', close: '}' })
      expect(pairs).toContainEqual({ open: '(', close: ')' })
      expect(pairs).toContainEqual({ open: '"', close: '"', notIn: ['string'] })
    })

    it('should define surroundingPairs', () => {
      const pairs = languageConfiguration.surroundingPairs
      expect(pairs).toContainEqual({ open: '{', close: '}' })
      expect(pairs).toContainEqual({ open: '[', close: ']' })
      expect(pairs).toContainEqual({ open: '(', close: ')' })
      expect(pairs).toContainEqual({ open: '"', close: '"' })
    })
  })

  describe('monarchLanguage', () => {
    it('should have tokenizer with root, whitespace, comment, string states', () => {
      expect(monarchLanguage.tokenizer).toBeDefined()
      expect(monarchLanguage.tokenizer.root).toBeDefined()
      expect(monarchLanguage.tokenizer.whitespace).toBeDefined()
      expect(monarchLanguage.tokenizer.comment).toBeDefined()
      expect(monarchLanguage.tokenizer.string).toBeDefined()
    })

    it('should have tokenPostfix .scad', () => {
      expect(monarchLanguage.tokenPostfix).toBe('.scad')
    })

    it('should include keywords and controlKeywords in monarch definition', () => {
      expect(monarchLanguage.keywords).toEqual([...keywords])
      // @ts-ignore - controlKeywords exists in the object but types might not strictly infer it in the test check without casting
      expect(monarchLanguage.controlKeywords).toEqual([...controlKeywords])
    })

    it('should include builtins in monarch definition', () => {
      expect(monarchLanguage.builtins).toEqual([...builtins])
    })

    it('should define brackets for delimiter highlighting', () => {
      expect(monarchLanguage.brackets).toBeDefined()
      expect(monarchLanguage.brackets).toHaveLength(3)
    })
  })
})

describe('registerOpenSCADLanguage', () => {
  const mockRegister = vi.fn()
  const mockSetMonarchTokensProvider = vi.fn()
  const mockSetLanguageConfiguration = vi.fn()

  const mockMonaco = {
    languages: {
      register: mockRegister,
      setMonarchTokensProvider: mockSetMonarchTokensProvider,
      setLanguageConfiguration: mockSetLanguageConfiguration,
    },
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the module-level registered flag by re-importing
    vi.resetModules()
  })

  it('should call languages.register with openscad id and extensions', async () => {
    // Re-import to get fresh module state
    const { registerOpenSCADLanguage: register } = await import('./index')
    register(mockMonaco)

    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'openscad',
        extensions: ['.scad'],
        aliases: ['OpenSCAD', 'openscad', 'scad'],
      })
    )
  })

  it('should call setMonarchTokensProvider with language id and monarch definition', async () => {
    const { registerOpenSCADLanguage: register } = await import('./index')
    register(mockMonaco)

    expect(mockSetMonarchTokensProvider).toHaveBeenCalledWith(
      'openscad',
      expect.objectContaining({
        tokenPostfix: '.scad',
        keywords: expect.any(Array),
        tokenizer: expect.any(Object),
      })
    )
  })

  it('should call setLanguageConfiguration with language id and config', async () => {
    const { registerOpenSCADLanguage: register } = await import('./index')
    register(mockMonaco)

    expect(mockSetLanguageConfiguration).toHaveBeenCalledWith(
      'openscad',
      expect.objectContaining({
        comments: { lineComment: '//', blockComment: ['/*', '*/'] },
        brackets: expect.any(Array),
      })
    )
  })
})
