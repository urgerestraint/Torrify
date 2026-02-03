import * as path from 'path'
import * as fs from 'fs'

export interface PathValidationResult {
  valid: boolean
  normalized?: string
  error?: string
}

const ALLOWED_EXTENSIONS = ['.scad', '.py', '.torrify', '.opencursor', '.json']

export function validatePath(
  filePath: string,
  allowedExtensions: string[] = ALLOWED_EXTENSIONS
): PathValidationResult {
  // Check for empty/invalid input
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: 'Invalid path: empty or non-string' }
  }

  // Check path length
  if (filePath.length > 1024) {
    return { valid: false, error: 'Path too long (max 1024 characters)' }
  }

  // Normalize and resolve to absolute path
  const normalized = path.resolve(path.normalize(filePath))

  // Check for path traversal in original input
  if (filePath.includes('..')) {
    return { valid: false, error: 'Path traversal detected' }
  }

  // Validate file extension
  const ext = path.extname(normalized).toLowerCase()
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: `Invalid file extension: ${ext}` }
  }

  // Optional: Check for symbolic links (only if file exists)
  if (fs.existsSync(normalized)) {
    try {
      const stats = fs.lstatSync(normalized)
      if (stats.isSymbolicLink()) {
        return { valid: false, error: 'Symbolic links not allowed' }
      }
    } catch {
      // Ignore stat errors
    }
  }

  return { valid: true, normalized }
}
