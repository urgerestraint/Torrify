export const WEB_RUNTIME_TARGET = 'web'
export const IS_WEB_RUNTIME =
  (typeof __WEB_RUNTIME__ !== 'undefined' && __WEB_RUNTIME__) ||
  import.meta.env.VITE_RUNTIME_TARGET === WEB_RUNTIME_TARGET

export function isWebRuntime(): boolean {
  return IS_WEB_RUNTIME
}
