import { MAX_PROCESS_BUFFER_SIZE } from '../constants'

export function createCappedBuffer(maxSize: number = MAX_PROCESS_BUFFER_SIZE) {
  let buffer = ''
  let truncated = false

  return {
    append(data: Buffer | string) {
      if (truncated) return
      const str = data.toString()
      if (buffer.length + str.length > maxSize) {
        buffer += str.slice(0, maxSize - buffer.length)
        truncated = true
      } else {
        buffer += str
      }
    },
    get value() {
      return truncated
        ? buffer + `\n...[output truncated at ${(maxSize / 1024 / 1024).toFixed(0)}MB]`
        : buffer
    },
    get isTruncated() {
      return truncated
    },
    get rawValue() {
      return buffer
    }
  }
}
