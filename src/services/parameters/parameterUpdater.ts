/**
 * Updates a parameter value in the source code using precise string replacement.
 */

import type { ExtractedParameter } from './types'

/**
 * Produces the replacement string for a new value, preserving formatting where possible.
 */
function formatValueForCode(param: ExtractedParameter, newValue: number | boolean | string): string {
  switch (param.type) {
    case 'boolean':
      return String(newValue).toLowerCase()
    case 'number':
      return String(Number(newValue))
    case 'string':
      return JSON.stringify(String(newValue))
    case 'expression':
      return param.rawValue
    default:
      return String(newValue)
  }
}

/**
 * Updates a parameter value in the source code.
 *
 * @param code - Current source code
 * @param param - The extracted parameter (with charStart/charEnd)
 * @param newValue - The new value to write
 * @returns Updated source code
 */
export function updateParameterInCode(
  code: string,
  param: ExtractedParameter,
  newValue: number | boolean | string
): string {
  const replacement = formatValueForCode(param, newValue)
  return code.slice(0, param.charStart) + replacement + code.slice(param.charEnd)
}
