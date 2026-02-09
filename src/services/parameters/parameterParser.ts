/**
 * Extracts editable parameters from the CONFIGURATION block of OpenSCAD or build123d code.
 */

import type { CADBackend } from '../cad'
import type { ExtractedParameter, ParseOptions } from './types'

const CONFIG_START_OPENSCAD = /^\/\/\s*=+\s*$/
const CONFIG_HEADER_OPENSCAD = /^\/\/\s*CONFIGURATION/i
const CONFIG_END_OPENSCAD = /^\/\/\s*=+\s*$/

const CONFIG_START_BUILD123D = /^#\s*=+\s*$/
const CONFIG_HEADER_BUILD123D = /^#\s*CONFIGURATION/i
const CONFIG_END_BUILD123D = /^#\s*=+\s*$/

/** OpenSCAD: name = value; // comment */
const ASSIGN_OPENSCAD = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*;(?:\s*\/\/\s*(.*))?$/

/** build123d: NAME = value  # comment (Python config convention) */
const ASSIGN_BUILD123D = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)(?:\s*#\s*(.*))?$/

const NUMERIC = /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/
const BOOLEAN_TRUE = /^true$/i
const BOOLEAN_FALSE = /^false$/i
const QUOTED_STRING = /^"([^"\\]*(\\.[^"\\]*)*)"$/
const RANGE_HINT = /\[([\d.-]+)\s*[-–]\s*([\d.-]+)\]/i

/**
 * Converts a variable name to a display label and extracts unit suffix.
 * e.g. wall_thickness_mm -> { displayName: "Wall Thickness", unit: "mm" }
 * e.g. FILLET_RADIUS_MM -> { displayName: "Fillet Radius", unit: "mm" }
 */
function nameToDisplay(name: string): { displayName: string; unit: string | null } {
  const units = ['mm', 'deg', 'rad', 'cm', 'm']
  const lower = name.toLowerCase()

  for (const u of units) {
    const suffix = `_${u}`
    if (lower.endsWith(suffix)) {
      const base = name.slice(0, -suffix.length)
      const words = base.split(/[_-]+/).filter(Boolean)
      const displayName = words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
      return { displayName: `${displayName} (${u})`, unit: u }
    }
  }

  const words = name.split(/[_-]+/).filter(Boolean)
  const displayName =
    words.length > 0
      ? words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      : name
  return { displayName, unit: null }
}

/**
 * Classifies the value string and returns type + parsed value.
 */
function classifyValue(
  rawValue: string,
  comment: string
): { type: ExtractedParameter['type']; value: number | boolean | string; min?: number; max?: number } {
  const trimmed = rawValue.trim()
  const trimmedComment = comment.trim()

  const rangeMatch = trimmedComment.match(RANGE_HINT)
  const min = rangeMatch ? parseFloat(rangeMatch[1]) : undefined
  const max = rangeMatch ? parseFloat(rangeMatch[2]) : undefined

  if (BOOLEAN_TRUE.test(trimmed)) {
    return { type: 'boolean', value: true }
  }
  if (BOOLEAN_FALSE.test(trimmed)) {
    return { type: 'boolean', value: false }
  }
  if (NUMERIC.test(trimmed)) {
    return { type: 'number', value: parseFloat(trimmed), min, max }
  }
  const strMatch = trimmed.match(QUOTED_STRING)
  if (strMatch) {
    try {
      const unescaped = JSON.parse(trimmed) as string
      return { type: 'string', value: unescaped }
    } catch {
      return { type: 'string', value: strMatch[1] ?? trimmed }
    }
  }

  return { type: 'expression', value: trimmed }
}

/**
 * Finds the CONFIGURATION block line range and content.
 */
function findConfigBlock(
  lines: string[],
  backend: CADBackend
): { startLine: number; endLine: number } | null {
  const isSep =
    backend === 'openscad'
      ? (line: string) => CONFIG_START_OPENSCAD.test(line) || CONFIG_END_OPENSCAD.test(line)
      : (line: string) => CONFIG_START_BUILD123D.test(line) || CONFIG_END_BUILD123D.test(line)
  const isHeader =
    backend === 'openscad'
      ? (line: string) => CONFIG_HEADER_OPENSCAD.test(line)
      : (line: string) => CONFIG_HEADER_BUILD123D.test(line)

  let afterHeader = false
  let blockStart = -1
  let blockEnd = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isHeader(line)) {
      afterHeader = true
      continue
    }
    if (afterHeader && isSep(line)) {
      if (blockStart < 0) {
        blockStart = i + 2 // content starts on line after this separator
      } else {
        blockEnd = i + 1 // 1-based line number; we stop before this line
        break
      }
    }
  }

  if (blockStart < 0 || blockEnd < 0 || blockEnd <= blockStart) return null
  return { startLine: blockStart, endLine: blockEnd }
}

/**
 * Parses a single assignment line and returns an ExtractedParameter or null.
 */
function parseLine(
  line: string,
  lineNum: number,
  charOffset: number,
  backend: CADBackend
): ExtractedParameter | null {
  const regex = backend === 'openscad' ? ASSIGN_OPENSCAD : ASSIGN_BUILD123D
  const match = line.match(regex)
  if (!match) return null

  const [, name, rawValue, comment = ''] = match
  if (!name || rawValue === undefined) return null

  const { displayName, unit } = nameToDisplay(name)
  const { type, value, min, max } = classifyValue(rawValue, comment)

  const valueStart = line.indexOf(rawValue)
  const valueEnd = valueStart + rawValue.length
  const charStart = charOffset + valueStart
  const charEnd = charOffset + valueEnd

  return {
    name,
    displayName,
    value,
    type,
    rawValue: rawValue.trim(),
    comment: comment.trim(),
    line: lineNum,
    charStart,
    charEnd,
    unit,
    min,
    max
  }
}

/**
 * Extracts editable parameters from the CONFIGURATION block.
 *
 * @param code - Full source code (OpenSCAD or build123d)
 * @param options - Parser options including backend type
 * @returns Array of extracted parameters, or empty array if no config block found
 */
/**
 * Advances charOffset past the current line and its line ending.
 * Handles \r\n, \n, and \r so character offsets are correct on Windows.
 */
function advancePastLine(code: string, charOffset: number, line: string): number {
  const next = charOffset + line.length
  if (next >= code.length) return next
  const c = code[next]
  if (c === '\r' && code[next + 1] === '\n') return next + 2
  if (c === '\n' || c === '\r') return next + 1
  return next
}

export function extractParameters(
  code: string,
  options: ParseOptions
): ExtractedParameter[] {
  const { backend } = options
  const lines = code.split(/\r?\n/)
  const block = findConfigBlock(lines, backend)
  if (!block) return []

  const params: ExtractedParameter[] = []
  let charOffset = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    if (lineNum < block.startLine) {
      charOffset = advancePastLine(code, charOffset, line)
      continue
    }
    if (lineNum >= block.endLine) break

    const param = parseLine(line, lineNum, charOffset, backend)
    if (param) params.push(param)

    charOffset = advancePastLine(code, charOffset, line)
  }

  return params
}
