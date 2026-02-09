/**
 * Hook to check whether the user is authenticated as PRO.
 * PRO = gateway provider with a valid license key.
 */

import { useState, useEffect } from 'react'

export interface ProStatus {
  /** True when provider is gateway AND license key is set */
  readonly isProAuthenticated: boolean
  /** True during initial settings fetch */
  readonly isLoading: boolean
}

/**
 * Returns the current PRO authentication status.
 * Re-checks when settingsVersion changes (e.g. after user saves settings).
 */
export function useProStatus(settingsVersion: number): ProStatus {
  const [isProAuthenticated, setIsProAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      try {
        const settings = await window.electronAPI.getSettings()
        if (!cancelled) {
          const ok =
            settings.llm.provider === 'gateway' &&
            !!settings.llm.gatewayLicenseKey?.trim()
          setIsProAuthenticated(ok)
        }
      } catch {
        if (!cancelled) setIsProAuthenticated(false)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [settingsVersion])

  return { isProAuthenticated, isLoading }
}
