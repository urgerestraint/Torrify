import { useState, useCallback, useEffect } from 'react'
import { logger } from '../../../utils/logger'
import type { Settings } from '../types'

export interface OllamaModel {
  name: string
  size: number
  modified: string
}

export function useOllamaModels(
  settings: Settings | null,
  isOpen: boolean,
  setSettings: React.Dispatch<React.SetStateAction<Settings | null>>
) {
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([])
  const [isLoadingOllamaModels, setIsLoadingOllamaModels] = useState(false)
  const [ollamaModelsError, setOllamaModelsError] = useState<string | null>(null)

  const loadOllamaModels = useCallback(
    async (endpoint?: string) => {
      setIsLoadingOllamaModels(true)
      setOllamaModelsError(null)
      try {
        const result = await window.electronAPI.getOllamaModels(endpoint)
        if (result.success && result.models.length > 0) {
          setOllamaModels(result.models)
          setSettings((prev) => {
            if (
              !prev ||
              prev.llm.provider !== 'ollama' ||
              (prev.llm.model && result.models.some((m) => m.name === prev.llm.model))
            ) {
              return prev
            }
            const preferredModel = result.models.find((m) => m.name === 'gpt-oss:20b')
            const modelToUse = preferredModel ? preferredModel.name : result.models[0].name
            return { ...prev, llm: { ...prev.llm, model: modelToUse } }
          })
          return result.models
        } else {
          setOllamaModelsError(
            result.error || 'No models found. Make sure Ollama is running and has models installed.'
          )
          setOllamaModels([])
          return []
        }
      } catch (error) {
        logger.error('Failed to load Ollama models', error)
        setOllamaModelsError(
          'Failed to connect to Ollama. Make sure Ollama is running (start the Ollama app or run "ollama serve" in a terminal).'
        )
        setOllamaModels([])
        return []
      } finally {
        setIsLoadingOllamaModels(false)
      }
    },
    [setSettings]
  )

  useEffect(() => {
    if (settings && settings.llm.provider === 'ollama' && isOpen) {
      loadOllamaModels(settings.llm.customEndpoint)
    }
  }, [isOpen, loadOllamaModels, settings])

  return {
    ollamaModels,
    isLoadingOllamaModels,
    ollamaModelsError,
    loadOllamaModels
  }
}
