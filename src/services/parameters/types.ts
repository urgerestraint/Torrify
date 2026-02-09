/**
 * Types for the parameter extraction and Parameter Panel feature.
 */

import type { CADBackend } from '../cad'

/**
 * Parameter type determined from the value in the CONFIGURATION block.
 */
export type ParameterType = 'number' | 'boolean' | 'string' | 'expression'

/**
 * An extracted parameter from the CONFIGURATION block of OpenSCAD or build123d code.
 */
export interface ExtractedParameter {
  /** Variable name, e.g. "width_mm" */
  readonly name: string
  /** Human-readable label, e.g. "Width (mm)" */
  readonly displayName: string
  /** Parsed value (for editable types) */
  readonly value: number | boolean | string
  /** How to render and edit this parameter */
  readonly type: ParameterType
  /** Original raw text for round-tripping replacements */
  readonly rawValue: string
  /** Inline comment text after the assignment */
  readonly comment: string
  /** 1-based line number in source */
  readonly line: number
  /** Character offset of the value start for precise replacement */
  readonly charStart: number
  /** Character offset of the value end */
  readonly charEnd: number
  /** Unit extracted from suffix, e.g. "_mm" -> "mm", "_deg" -> "deg" */
  readonly unit: string | null
  /** Optional min hint from comment like "[0-500]" */
  readonly min?: number
  /** Optional max hint from comment like "[0-500]" */
  readonly max?: number
}

/**
 * Options for the parameter parser.
 */
export interface ParseOptions {
  readonly backend: CADBackend
}
