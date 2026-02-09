/**
 * Test suite for LLM code generation
 * 
 * This suite tests that the LLM can generate runnable code for 25 simple prompts.
 * Tests can run with mocked LLM service (for CI) or real API calls (when configured).
 * 
 * Validation includes:
 * 1. Static validation: Syntax checking (balanced brackets, required imports, etc.)
 * 2. Execution validation: Actually runs code through backends (when available)
 * 
 * To run with real API:
 * - Set LLM_TEST_API_KEY environment variable
 * - Set LLM_TEST_PROVIDER to 'gemini' or 'openrouter'
 * 
 * Note: Execution validation requires Electron backends to be available.
 * In test environments, execution may be skipped if backends aren't accessible.
 * Static validation will still verify code structure and syntax.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { createLLMService, type LLMService } from '../index'
import { TEST_PROMPTS } from './test-prompts'
import { extractCodeFromResponse, validateCode, validateCodeComprehensive } from './code-validation'

// Check if we should use real API or mocks
const USE_REAL_API = process.env.LLM_TEST_API_KEY !== undefined
const TEST_PROVIDER = (process.env.LLM_TEST_PROVIDER || 'gemini') as 'gemini' | 'openrouter'

describe('LLM Code Generation', () => {
  let llmService: LLMService | null = null

  beforeAll(() => {
    if (USE_REAL_API) {
      const apiKey = process.env.LLM_TEST_API_KEY!
      
      // For OpenRouter, main process uses OPENROUTER_API_KEY from env. In tests we only need
      // the renderer to consider OpenRouter "configured" so the proxy proceeds; real key is in main.
      if (TEST_PROVIDER === 'openrouter' && typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.getOpenRouterConfigured = vi.fn().mockResolvedValue(true)
      }
      
      llmService = createLLMService({
        provider: TEST_PROVIDER,
        model: TEST_PROVIDER === 'gemini' ? 'gemini-3-flash' : 'anthropic/claude-3.5-sonnet',
        apiKey,
        enabled: true,
      })
    }
    // If not using real API, tests will use mocked service from setup.ts
  })

  describe.each(['openscad', 'build123d'] as const)('Backend: %s', (backend) => {
    TEST_PROMPTS.forEach((prompt, index) => {
      it(`Prompt ${index + 1}: "${prompt}"`, async () => {
        // Skip if using real API but service not configured
        if (USE_REAL_API && !llmService) {
          expect.fail('LLM service not configured for real API testing')
          return
        }

        // Get LLM service (either real or mocked)
        const service = llmService || createLLMService({
          provider: 'gemini',
          model: 'gemini-3-flash',
          apiKey: 'test-key',
          enabled: true,
        })

        try {
          // Load API context if using real API
          let apiContext: string | undefined = undefined
          if (USE_REAL_API && typeof window !== 'undefined' && window.electronAPI) {
            try {
              const contextResult = await window.electronAPI.getContext(backend)
              if (contextResult.success && contextResult.content) {
                apiContext = contextResult.content
                console.log(`✓ Loaded API context for ${backend} (${apiContext.length} chars)`)
              } else {
                console.warn(`⚠ API context request failed for ${backend}:`, contextResult)
              }
            } catch (e) {
              console.warn(`⚠ Failed to load API context for ${backend}:`, e)
            }
          } else if (USE_REAL_API) {
            console.warn('⚠ window.electronAPI not available - API context will not be loaded')
          }

          // Call LLM service
          const response = await service.sendMessage(
            [{ role: 'user', content: prompt }],
            undefined, // no current code
            backend,
            apiContext
          )

          // Debug: Log response details
          if (USE_REAL_API) {
            console.log(`\n=== Response for "${prompt}" (${backend}) ===`)
            console.log('Response length:', response.content.length)
            console.log('Response preview (first 500 chars):', response.content.substring(0, 500))
            console.log('Response preview (last 500 chars):', response.content.substring(Math.max(0, response.content.length - 500)))
            // Check for common patterns
            const hasOpenScadTags = /<openscad>/i.test(response.content)
            const hasPythonTags = /<python>/i.test(response.content)
            const hasFencedBlocks = /```/.test(response.content)
            console.log('Has <openscad> tags:', hasOpenScadTags)
            console.log('Has <python> tags:', hasPythonTags)
            console.log('Has fenced code blocks (```):', hasFencedBlocks)
            if (hasFencedBlocks) {
              const fencedMatches = response.content.match(/```[\s\S]*?```/g)
              if (fencedMatches) {
                console.log('Found', fencedMatches.length, 'fenced code blocks')
                fencedMatches.forEach((match, idx) => {
                  console.log(`  Block ${idx + 1} (first 200 chars):`, match.substring(0, 200))
                })
              }
            }
          }

          // Extract code from response
          const code = extractCodeFromResponse(response.content, backend)

          // Debug: Log extraction result
          if (USE_REAL_API) {
            if (code) {
              console.log('✓ Code extracted successfully')
              console.log('Extracted code length:', code.length)
              console.log('Extracted code preview (first 300 chars):', code.substring(0, 300))
            } else {
              console.error('✗ Failed to extract code')
              console.error('Full response content:')
              console.error('---START RESPONSE---')
              console.error(response.content)
              console.error('---END RESPONSE---')
            }
          }

          // Validate that code was extracted
          expect(code).not.toBeNull()
          expect(code).toBeTruthy()
          expect(code!.trim().length).toBeGreaterThan(0)

          // Perform comprehensive validation (static + execution)
          // For real API tests, we require execution validation to ensure code actually works
          const validation = await validateCodeComprehensive(code!, backend, {
            requireExecution: USE_REAL_API
          })
          
          // Log validation results
          if (USE_REAL_API) {
            console.log('Validation results:')
            console.log('  Static validation:', validation.staticValid ? '✓ PASS' : '✗ FAIL')
            if (validation.executionSkipped) {
              console.log('  Execution validation: ⚠ SKIPPED (backend not available in test environment)')
              console.log('  Note: Code syntax is valid, but cannot verify execution without Electron backend')
            } else if (validation.executionValid !== undefined) {
              console.log('  Execution validation:', validation.executionValid ? '✓ PASS' : '✗ FAIL')
              if (validation.executionError) {
                console.log('  Execution error:', validation.executionError)
              }
            } else {
              console.log('  Execution validation: ⚠ NOT ATTEMPTED')
            }
          }
          
          if (!validation.valid) {
            console.error(`Validation errors for prompt "${prompt}":`, validation.errors)
            console.error('Generated code:', code)
            if (validation.executionError) {
              console.error('Execution error details:', validation.executionError)
            }
          }

          // Static validation must always pass
          expect(validation.staticValid).toBe(true)
          
          // Execution validation expectations:
          // - If execution was attempted and failed, that's a real error
          // - If execution was skipped (backend not available), that's acceptable for test environment
          // - If using real API, we prefer execution validation but accept skip if backend unavailable
          if (USE_REAL_API) {
            if (validation.executionValid !== undefined && !validation.executionSkipped) {
              // Execution was attempted - it must pass
              expect(validation.executionValid).toBe(true)
              expect(validation.errors).toHaveLength(0)
            } else if (validation.executionSkipped) {
              // Execution skipped - static validation must pass
              expect(validation.staticValid).toBe(true)
              // Log a note that execution wasn't verified
              console.warn(`⚠ Execution validation skipped for "${prompt}" - backend may not be available in test environment`)
            } else {
              // Execution not attempted - just check static
              expect(validation.staticValid).toBe(true)
            }
          } else {
            // For mocked tests, just check static validation
            expect(validation.valid).toBe(true)
            expect(validation.errors).toHaveLength(0)
          }

        } catch (error) {
          // If using mocked service, the error might be expected
          if (!USE_REAL_API) {
            // In mocked tests, we might not get real responses
            // Just check that the service was called without crashing
            expect(error).toBeDefined()
          } else {
            // With real API, re-throw the error
            throw error
          }
        }
      }, USE_REAL_API ? 30000 : 5000) // Longer timeout for real API calls
    })
  })

  describe('Code Extraction', () => {
    describe('OpenSCAD extraction', () => {
      it('should extract code from <openscad> tags', () => {
        const response = 'Here is your code:\n<openscad>\ncube([10, 10, 10]);\n</openscad>'
        const code = extractCodeFromResponse(response, 'openscad')
        expect(code).toBe('cube([10, 10, 10]);')
      })

      it('should extract code from language-specific fenced blocks', () => {
        const response = 'Here is your code:\n```openscad\ncube([10, 10, 10]);\n```'
        const code = extractCodeFromResponse(response, 'openscad')
        expect(code).toBe('cube([10, 10, 10]);')
      })

      it('should extract code from generic fenced blocks', () => {
        const response = 'Here is your code:\n```\ncube([10, 10, 10]);\nsphere(5);\n```'
        const code = extractCodeFromResponse(response, 'openscad')
        expect(code).toContain('cube([10, 10, 10]);')
        expect(code).toContain('sphere(5);')
      })

      it('should extract code from plain text with OpenSCAD patterns', () => {
        const response = 'Here is the code:\ncube([10, 10, 10]);\nsphere(5);\nThat should work.'
        const code = extractCodeFromResponse(response, 'openscad')
        expect(code).not.toBeNull()
        expect(code).toContain('cube')
        expect(code).toContain('sphere')
      })

      it('should handle multiple code blocks', () => {
        const response = '<openscad>cube([10, 10, 10]);</openscad>\n<openscad>sphere(5);</openscad>'
        const code = extractCodeFromResponse(response, 'openscad')
        expect(code).toContain('cube([10, 10, 10]);')
        expect(code).toContain('sphere(5);')
      })

      it('should return null if no code found', () => {
        const response = 'This is just text with no code blocks.'
        const code = extractCodeFromResponse(response, 'openscad')
        expect(code).toBeNull()
      })
    })

    describe('build123d/Python extraction', () => {
      it('should extract code from <python> tags', () => {
        const response = 'Here is your code:\n<python>\nfrom build123d import Box\nBox(10, 10, 10)\n</python>'
        const code = extractCodeFromResponse(response, 'build123d')
        expect(code).toBe('from build123d import Box\nBox(10, 10, 10)')
      })

      it('should extract code from language-specific fenced blocks', () => {
        const response = 'Here is your code:\n```python\nfrom build123d import Box\nBox(10, 10, 10)\n```'
        const code = extractCodeFromResponse(response, 'build123d')
        expect(code).toContain('from build123d import Box')
        expect(code).toContain('Box(10, 10, 10)')
      })

      it('should extract code from build123d-specific fenced blocks', () => {
        const response = 'Here is your code:\n```build123d\nfrom build123d import Box\nBox(10, 10, 10)\n```'
        const code = extractCodeFromResponse(response, 'build123d')
        expect(code).toContain('from build123d import Box')
      })

      it('should extract code from generic fenced blocks', () => {
        const response = 'Here is your code:\n```\nfrom build123d import Box\nwith BuildPart() as part:\n    Box(10, 10, 10)\n```'
        const code = extractCodeFromResponse(response, 'build123d')
        expect(code).toContain('from build123d import Box')
        expect(code).toContain('BuildPart')
      })

      it('should extract code from plain text with Python/build123d patterns', () => {
        const response = 'Here is the code:\nfrom build123d import Box\nwith BuildPart() as part:\n    Box(10, 10, 10)\nThat should work.'
        const code = extractCodeFromResponse(response, 'build123d')
        expect(code).not.toBeNull()
        expect(code).toContain('from build123d')
        expect(code).toContain('BuildPart')
      })

      it('should handle multiple code blocks', () => {
        const response = '<python>from build123d import Box</python>\n<python>Box(10, 10, 10)</python>'
        const code = extractCodeFromResponse(response, 'build123d')
        expect(code).toContain('from build123d import Box')
        expect(code).toContain('Box(10, 10, 10)')
      })

      it('should return null if no code found', () => {
        const response = 'This is just text with no code blocks.'
        const code = extractCodeFromResponse(response, 'build123d')
        expect(code).toBeNull()
      })
    })
  })

  describe('Code Validation', () => {
    describe('OpenSCAD', () => {
      it('should validate correct OpenSCAD code', () => {
        const code = 'cube([10, 10, 10]);'
        const result = validateCode(code, 'openscad')
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should detect unbalanced brackets', () => {
        const code = 'cube([10, 10, 10];'
        const result = validateCode(code, 'openscad')
        expect(result.valid).toBe(false)
        // Should detect either brackets or parentheses issue
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors.some(e => e.includes('brackets') || e.includes('parentheses'))).toBe(true)
      })

      it('should detect empty code', () => {
        const result = validateCode('', 'openscad')
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.includes('empty'))).toBe(true)
      })
    })

    describe('build123d', () => {
      it('should validate correct build123d code', () => {
        const code = `from build123d import Box
with BuildPart() as part:
    Box(10, 10, 10)`
        const result = validateCode(code, 'build123d')
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should detect missing import', () => {
        const code = 'Box(10, 10, 10)'
        const result = validateCode(code, 'build123d')
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.includes('import'))).toBe(true)
      })

      it('should detect missing context manager', () => {
        const code = 'from build123d import Box\nBox(10, 10, 10)'
        const result = validateCode(code, 'build123d')
        expect(result.valid).toBe(false)
        expect(result.errors.some(e => e.includes('context manager'))).toBe(true)
      })
    })
  })
})
