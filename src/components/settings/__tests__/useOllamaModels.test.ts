import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useOllamaModels } from '../hooks/useOllamaModels'
import type { Settings } from '../types'

vi.mock('../../../utils/logger', () => ({
  logger: { error: vi.fn(), debug: vi.fn() }
}))

const ollamaSettings: Settings = {
  cadBackend: 'openscad',
  openscadPath: '',
  build123dPythonPath: '',
  llm: {
    provider: 'ollama',
    model: 'llama2',
    apiKey: '',
    enabled: true,
    temperature: 0.7,
    maxTokens: 2048
  }
}

describe('useOllamaModels', () => {
  beforeEach(() => {
    vi.mocked(window.electronAPI.getOllamaModels).mockClear()
    vi.mocked(window.electronAPI.getOllamaModels).mockResolvedValue({
      success: true,
      models: [
        { name: 'llama2', size: 1000000, modified: '2024-01-01T00:00:00.000Z' },
        { name: 'gpt-oss:20b', size: 2000000, modified: '2024-01-02T00:00:00.000Z' }
      ]
    })
  })

  it('returns initial empty models and not loading', () => {
    const setSettings = vi.fn()
    const { result } = renderHook(() =>
      useOllamaModels(null, false, setSettings)
    )
    expect(result.current.ollamaModels).toEqual([])
    expect(result.current.isLoadingOllamaModels).toBe(false)
    expect(result.current.ollamaModelsError).toBe(null)
    expect(typeof result.current.loadOllamaModels).toBe('function')
  })

  it('loads models and sets them on success', async () => {
    const setSettings = vi.fn()
    const { result } = renderHook(() =>
      useOllamaModels(null, false, setSettings)
    )

    let models: unknown[] = []
    await act(async () => {
      models = await result.current.loadOllamaModels()
    })

    expect(models).toHaveLength(2)
    expect((models as { name: string }[])[0].name).toBe('llama2')
    expect(result.current.ollamaModels).toHaveLength(2)
    expect(result.current.isLoadingOllamaModels).toBe(false)
    expect(result.current.ollamaModelsError).toBe(null)
    expect(window.electronAPI.getOllamaModels).toHaveBeenCalledWith(undefined)
  })

  it('loads models with custom endpoint', async () => {
    const setSettings = vi.fn()
    const { result } = renderHook(() =>
      useOllamaModels(null, false, setSettings)
    )

    await act(async () => {
      await result.current.loadOllamaModels('http://localhost:11435')
    })

    expect(window.electronAPI.getOllamaModels).toHaveBeenCalledWith('http://localhost:11435')
  })

  it('sets error and empty models when API returns success but no models', async () => {
    vi.mocked(window.electronAPI.getOllamaModels).mockResolvedValue({
      success: true,
      models: []
    })
    const setSettings = vi.fn()
    const { result } = renderHook(() =>
      useOllamaModels(null, false, setSettings)
    )

    await act(async () => {
      await result.current.loadOllamaModels()
    })

    expect(result.current.ollamaModels).toEqual([])
    expect(result.current.ollamaModelsError).toContain('No models found')
    expect(result.current.isLoadingOllamaModels).toBe(false)
  })

  it('sets error and empty models when API fails', async () => {
    vi.mocked(window.electronAPI.getOllamaModels).mockRejectedValue(
      new Error('ECONNREFUSED')
    )
    const setSettings = vi.fn()
    const { result } = renderHook(() =>
      useOllamaModels(null, false, setSettings)
    )

    await act(async () => {
      await result.current.loadOllamaModels()
    })

    expect(result.current.ollamaModels).toEqual([])
    expect(result.current.ollamaModelsError).toContain('Ollama')
    expect(result.current.isLoadingOllamaModels).toBe(false)
  })

  it('loads models when settings.llm.provider is ollama and isOpen is true', async () => {
    const setSettings = vi.fn()
    renderHook(() => useOllamaModels(ollamaSettings, true, setSettings))

    await waitFor(() => {
      expect(window.electronAPI.getOllamaModels).toHaveBeenCalled()
    })
  })

  it('does not load on mount when isOpen is false', async () => {
    const setSettings = vi.fn()
    renderHook(() => useOllamaModels(ollamaSettings, false, setSettings))
    await waitFor(() => {})
    expect(window.electronAPI.getOllamaModels).not.toHaveBeenCalled()
  })
})
