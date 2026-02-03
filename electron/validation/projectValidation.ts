/**
 * Project structure validation for Torrify .torrify/.json files.
 * Used by main process before save/load operations.
 */

/** Check that an object has the shape of a saved Torrify project (version, code, chat, etc.). */
export function validateProject(project: unknown): boolean {
  if (!project || typeof project !== 'object') {
    return false
  }

  const record = project as Record<string, unknown>
  // Check required fields
  if (typeof record.version !== 'number' || record.version < 1) {
    return false
  }

  if (typeof record.code !== 'string') {
    return false
  }

  if (record.stlBase64 !== null && typeof record.stlBase64 !== 'string') {
    return false
  }

  if (!Array.isArray(record.chat)) {
    return false
  }

  // Validate chat messages structure
  for (const msg of record.chat) {
    if (!msg || typeof msg !== 'object') {
      return false
    }
    const messageRecord = msg as Record<string, unknown>
    if (
      typeof messageRecord.id !== 'number' ||
      typeof messageRecord.text !== 'string' ||
      !['user', 'bot'].includes(messageRecord.sender as string) ||
      typeof messageRecord.timestamp !== 'string'
    ) {
      return false
    }
  }

  return true
}
