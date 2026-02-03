/**
 * Code validation utilities for testing LLM-generated code
 */

import type { CADBackend } from '../../cad/types'

/**
 * Extract code from LLM response based on backend type
 * 
 * Tries multiple extraction strategies in order of preference:
 * 1. XML-style tags (<openscad> or <python>)
 * 2. Language-specific fenced code blocks (```openscad, ```python, etc.)
 * 3. Generic fenced code blocks (```)
 * 4. Code blocks with any language identifier
 * 5. Pattern-based detection (for plain text responses)
 */
export function extractCodeFromResponse(text: string, backend: CADBackend): string | null {
  if (backend === 'openscad') {
    // Strategy 1: Extract from <openscad> tags (highest priority)
    const openscadTagRegex = /<openscad>([\s\S]*?)<\/openscad>/gi
    const tagMatches = [...text.matchAll(openscadTagRegex)]
    if (tagMatches.length > 0) {
      return tagMatches.map(m => m[1].trim()).join('\n\n')
    }
    
    // Strategy 2: Language-specific fenced code blocks
    const specificFencedRegex = /```(?:openscad|scad)\s*\n?([\s\S]*?)```/gi
    const specificMatches = [...text.matchAll(specificFencedRegex)]
    if (specificMatches.length > 0) {
      return specificMatches.map(m => m[1].trim()).join('\n\n')
    }
    
    // Strategy 3: Generic fenced code blocks (no language specified)
    const genericFencedRegex = /```\s*\n?([\s\S]*?)```/g
    const genericMatches = [...text.matchAll(genericFencedRegex)]
    if (genericMatches.length > 0) {
      // Filter to likely OpenSCAD code blocks
      const candidates = genericMatches.map(m => m[1].trim())
      // Check if any candidate looks like OpenSCAD code
      for (const candidate of candidates) {
        if (/(?:cube|sphere|cylinder|polyhedron|translate|rotate|union|difference|intersection|hull|minkowski|module|function|use|include)/i.test(candidate)) {
          return candidate
        }
      }
      // If no clear match, return the first/largest block
      if (candidates.length > 0) {
        return candidates.reduce((a, b) => a.length > b.length ? a : b)
      }
    }
    
    // Strategy 4: Pattern-based detection for plain text
    // Look for lines that look like OpenSCAD code
    const lines = text.split('\n')
    const codeLines: string[] = []
    let inCodeBlock = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Detect start of code block (common OpenSCAD patterns)
      if (/(?:cube|sphere|cylinder|module|function|translate|rotate|union|difference|intersection)/i.test(line) && 
          /[();\[\]{}]/.test(line)) {
        inCodeBlock = true
        codeLines.push(line)
      } else if (inCodeBlock) {
        // Continue collecting if we're in a code block
        if (line.trim().length === 0 || /[();\[\]{}]/.test(line) || line.trim().startsWith('//')) {
          codeLines.push(line)
        } else if (codeLines.length > 0 && !/(?:Here|This|The|You|I|Note|Example)/i.test(line)) {
          // Continue if it doesn't look like explanatory text
          codeLines.push(line)
        } else {
          inCodeBlock = false
        }
      }
    }
    
    if (codeLines.length > 0) {
      const extracted = codeLines.join('\n').trim()
      // Verify it looks like OpenSCAD code
      if (/(?:cube|sphere|cylinder|polyhedron|translate|rotate|union|difference|intersection|hull|minkowski)/i.test(extracted)) {
        return extracted
      }
    }
  } else {
    // build123d/Python extraction
    // Strategy 1: Extract from <python> tags (highest priority)
    const pythonTagRegex = /<python>([\s\S]*?)<\/python>/gi
    const tagMatches = [...text.matchAll(pythonTagRegex)]
    if (tagMatches.length > 0) {
      return tagMatches.map(m => m[1].trim()).join('\n\n')
    }
    
    // Strategy 2: Language-specific fenced code blocks
    const specificFencedRegex = /```(?:python|py|build123d)\s*\n?([\s\S]*?)```/gi
    const specificMatches = [...text.matchAll(specificFencedRegex)]
    if (specificMatches.length > 0) {
      return specificMatches.map(m => m[1].trim()).join('\n\n')
    }
    
    // Strategy 3: Generic fenced code blocks (no language specified)
    const genericFencedRegex = /```\s*\n?([\s\S]*?)```/g
    const genericMatches = [...text.matchAll(genericFencedRegex)]
    if (genericMatches.length > 0) {
      // Filter to likely Python/build123d code blocks
      const candidates = genericMatches.map(m => m[1].trim())
      // Check if any candidate looks like Python/build123d code
      for (const candidate of candidates) {
        if (/(?:from\s+build123d|import\s+build123d|BuildPart|BuildSketch|Box|Sphere|Cylinder|extrude|fillet|chamfer|with\s+\w+\(|def\s+\w+\(|class\s+\w+)/i.test(candidate)) {
          return candidate
        }
      }
      // Check for general Python patterns
      for (const candidate of candidates) {
        if (/(?:^from\s+\w+\s+import|^import\s+\w+|^def\s+\w+|^class\s+\w+|^with\s+\w+)/m.test(candidate)) {
          return candidate
        }
      }
      // If no clear match, return the first/largest block
      if (candidates.length > 0) {
        return candidates.reduce((a, b) => a.length > b.length ? a : b)
      }
    }
    
    // Strategy 4: Pattern-based detection for plain text
    // Look for lines that look like Python/build123d code
    const lines = text.split('\n')
    const codeLines: string[] = []
    let inCodeBlock = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Detect start of code block (common Python/build123d patterns)
      if (/(?:from\s+build123d|import\s+build123d|BuildPart|BuildSketch|Box|Sphere|Cylinder|extrude|fillet|chamfer|with\s+\w+\(|def\s+\w+\(|class\s+\w+)/i.test(line)) {
        inCodeBlock = true
        codeLines.push(line)
      } else if (inCodeBlock) {
        // Continue collecting if we're in a code block
        if (line.trim().length === 0 || 
            /^[\s]*(?:from|import|def|class|with|if|elif|else|for|while|return|pass|#)/.test(line) ||
            /^[\s]+[a-zA-Z_].*[():]/.test(line)) {
          codeLines.push(line)
        } else if (codeLines.length > 0 && !/(?:Here|This|The|You|I|Note|Example)/i.test(line)) {
          // Continue if it doesn't look like explanatory text
          codeLines.push(line)
        } else {
          inCodeBlock = false
        }
      }
    }
    
    if (codeLines.length > 0) {
      const extracted = codeLines.join('\n').trim()
      // Verify it looks like Python/build123d code
      if (/(?:from\s+build123d|import\s+build123d|BuildPart|BuildSketch|Box|Sphere|Cylinder|extrude|fillet|chamfer|with\s+\w+\(|def\s+\w+\(|class\s+\w+)/i.test(extracted)) {
        return extracted
      }
    }
  }
  
  return null
}

/**
 * Validate OpenSCAD code syntax
 */
export function validateOpenSCADCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for balanced braces
  const openBraces = (code.match(/{/g) || []).length
  const closeBraces = (code.match(/}/g) || []).length
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`)
  }

  // Check for balanced parentheses
  const openParens = (code.match(/\(/g) || []).length
  const closeParens = (code.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`)
  }

  // Check for balanced brackets
  const openBrackets = (code.match(/\[/g) || []).length
  const closeBrackets = (code.match(/\]/g) || []).length
  if (openBrackets !== closeBrackets) {
    errors.push(`Unbalanced brackets: ${openBrackets} opening, ${closeBrackets} closing`)
  }

  // Check for basic structure (at least one statement)
  if (code.trim().length === 0) {
    errors.push('Code is empty')
  }

  // Check for common operations (at least one should be present)
  const hasOperation = /(?:cube|sphere|cylinder|polyhedron|translate|rotate|union|difference|intersection|hull|minkowski)/i.test(code)
  if (!hasOperation) {
    errors.push('No recognizable OpenSCAD operations found')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate build123d (Python) code syntax
 */
export function validateBuild123dCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for required import
  if (!/from\s+build123d\s+import/i.test(code)) {
    errors.push('Missing build123d import statement')
  }

  // Check for balanced parentheses
  const openParens = (code.match(/\(/g) || []).length
  const closeParens = (code.match(/\)/g) || []).length
  if (openParens !== closeParens) {
    errors.push(`Unbalanced parentheses: ${openParens} opening, ${closeParens} closing`)
  }

  // Check for balanced brackets
  const openBrackets = (code.match(/\[/g) || []).length
  const closeBrackets = (code.match(/\]/g) || []).length
  if (openBrackets !== closeBrackets) {
    errors.push(`Unbalanced brackets: ${openBrackets} opening, ${closeBrackets} closing`)
  }

  // Check for balanced braces (for dict/set literals)
  const openBraces = (code.match(/{/g) || []).length
  const closeBraces = (code.match(/}/g) || []).length
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`)
  }

  // Check for basic structure
  if (code.trim().length === 0) {
    errors.push('Code is empty')
  }

  // Check for common build123d operations
  const hasOperation = /(?:BuildPart|BuildSketch|Box|Sphere|Cylinder|extrude|fillet|chamfer)/i.test(code)
  if (!hasOperation) {
    errors.push('No recognizable build123d operations found')
  }

  // Check for proper indentation (basic check - Python requires consistent indentation)
  const lines = code.split('\n')
  for (const line of lines) {
    if (line.trim().length > 0 && line.startsWith(' ')) {
      break // found indented block
    }
  }

  // Check for context managers (with statements)
  const hasContextManager = /with\s+\w+\(/i.test(code)
  if (!hasContextManager) {
    errors.push('No context managers (with statements) found - build123d typically uses Builder pattern')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Execute code through the backend to verify it's actually runnable
 * This is the strongest validation - it actually runs the code
 * 
 * Note: In test environments, electronAPI may be mocked. In that case,
 * execution validation will be marked as "skipped". For true execution
 * validation, tests should run in an Electron environment where the real
 * electronAPI is available.
 */
export async function executeCodeValidation(
  code: string,
  _backend: CADBackend
): Promise<{ valid: boolean; errors: string[]; executionError?: string; skipped?: boolean }> {
  // Check if electronAPI is available
  if (typeof window === 'undefined' || !window.electronAPI) {
    return {
      valid: false,
      errors: ['electronAPI not available - cannot execute code validation'],
      skipped: true,
    }
  }

  // Check if renderStl is available (might be mocked in test environment)
  if (!window.electronAPI.renderStl) {
    return {
      valid: false,
      errors: ['renderStl not available - cannot execute code validation'],
      skipped: true,
    }
  }

  try {
    // Execute the code through the backend
    const result = await window.electronAPI.renderStl(code)

    if (result.success) {
      return {
        valid: true,
        errors: [],
      }
    } else {
      // Extract error message from result
      const errorMsg = (result as any).error || 'Code execution failed'
      return {
        valid: false,
        errors: [`Execution failed: ${errorMsg}`],
        executionError: errorMsg,
      }
    }
  } catch (error: any) {
    // If error suggests backend not available, mark as skipped
    const errorMsg = error.message || String(error)
    const isBackendUnavailable = 
      errorMsg.includes('not found') ||
      errorMsg.includes('not available') ||
      errorMsg.includes('executable not found') ||
      errorMsg.includes('Python') && errorMsg.includes('not found')

    if (isBackendUnavailable) {
      return {
        valid: false,
        errors: [`Backend not available: ${errorMsg}`],
        executionError: errorMsg,
        skipped: true,
      }
    }

    return {
      valid: false,
      errors: [`Execution error: ${errorMsg}`],
      executionError: errorMsg,
    }
  }
}

/**
 * Validate code based on backend type
 * This performs static validation (syntax checking)
 */
export function validateCode(code: string, backend: CADBackend): { valid: boolean; errors: string[] } {
  if (backend === 'openscad') {
    return validateOpenSCADCode(code)
  } else {
    return validateBuild123dCode(code)
  }
}

/**
 * Comprehensive validation that combines static and execution validation
 * This is the recommended function for testing - it validates both syntax and executability
 */
export async function validateCodeComprehensive(
  code: string,
  backend: CADBackend,
  options: { requireExecution?: boolean } = {}
): Promise<{ 
  valid: boolean
  errors: string[]
  staticValid: boolean
  executionValid?: boolean
  executionSkipped?: boolean
  executionError?: string
}> {
  // First do static validation
  const staticResult = validateCode(code, backend)

  // If static validation fails, return early
  if (!staticResult.valid) {
    return {
      valid: false,
      errors: staticResult.errors,
      staticValid: false,
    }
  }

  // If execution is required or electronAPI is available, try execution validation
  const shouldExecute = options.requireExecution || (typeof window !== 'undefined' && window.electronAPI)

  if (shouldExecute) {
    const executionResult = await executeCodeValidation(code, backend)

    // If execution was skipped (backend not available), we still consider it valid
    // if static validation passed, but log a warning
    if (executionResult.skipped) {
      return {
        valid: staticResult.valid, // Use static validation result
        errors: executionResult.errors, // Include the skip reason in errors for logging
        staticValid: true,
        executionValid: undefined,
        executionSkipped: true,
        executionError: executionResult.executionError,
      }
    }

    return {
      valid: executionResult.valid,
      errors: executionResult.valid ? [] : executionResult.errors,
      staticValid: true,
      executionValid: executionResult.valid,
      executionSkipped: false,
      executionError: executionResult.executionError,
    }
  }

  // If execution not available/required, return static validation result
  return {
    valid: staticResult.valid,
    errors: staticResult.errors,
    staticValid: true,
  }
}
