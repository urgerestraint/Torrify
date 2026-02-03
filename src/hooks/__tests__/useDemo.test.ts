import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDemo, type UseDemoSetters } from '../useDemo'
import { DEMO_CODE } from '../../constants/demo'

vi.mock('../../utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }
}))

function createSetters(): UseDemoSetters {
  return {
    setMessages: vi.fn(),
    setCode: vi.fn(),
    setOriginalCode: vi.fn(),
    setHasUnsavedChanges: vi.fn(),
    setCurrentFilePath: vi.fn(),
    setEditorKey: vi.fn(),
    setStlBase64: vi.fn(),
    setPreviewImage: vi.fn(),
    setRenderError: vi.fn(),
    setIsRendering: vi.fn()
  }
}

describe('useDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.mocked(window.electronAPI.renderStl).mockResolvedValue({
      success: true,
      stlBase64: 'mock-stl',
      timestamp: Date.now()
    })
    vi.mocked(window.electronAPI.getSettings).mockResolvedValue({
      cadBackend: 'openscad',
      openscadPath: '',
      build123dPythonPath: '',
      llm: { provider: 'gemini', model: '', apiKey: '', enabled: true },
      recentFiles: [],
      hasSeenDemo: false
    })
    vi.mocked(window.electronAPI.saveSettings).mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runDemo adds user and bot messages, sets code, calls renderStl, saves hasSeenDemo', async () => {
    const setters = createSetters()
    const { result } = renderHook(() => useDemo(setters))

    await act(async () => {
      const runPromise = result.current.runDemo()
      await vi.runAllTimersAsync()
      await runPromise
    })

    expect(setters.setMessages).toHaveBeenCalled()
    expect(setters.setCode).toHaveBeenCalledWith(DEMO_CODE)
    expect(setters.setOriginalCode).toHaveBeenCalledWith(DEMO_CODE)
    expect(setters.setHasUnsavedChanges).toHaveBeenCalledWith(false)
    expect(setters.setCurrentFilePath).toHaveBeenCalledWith(null)
    expect(setters.setEditorKey).toHaveBeenCalled()
    expect(window.electronAPI.renderStl).toHaveBeenCalledWith(DEMO_CODE)
    expect(setters.setStlBase64).toHaveBeenCalledWith('mock-stl')
    expect(setters.setPreviewImage).toHaveBeenCalledWith(null)
    expect(window.electronAPI.getSettings).toHaveBeenCalled()
    expect(window.electronAPI.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ hasSeenDemo: true })
    )
    expect(result.current.isDemoRunning).toBe(false)
  })

  it('runDemo does nothing when isDemoRunning is true', async () => {
    const setters = createSetters()
    const { result } = renderHook(() => useDemo(setters))

    act(() => {
      result.current.runDemo()
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.isDemoRunning).toBe(true)

    act(() => {
      result.current.runDemo()
    })
    await act(async () => {
      await vi.runAllTimersAsync()
    })

    expect(setters.setMessages).toHaveBeenCalledTimes(2)
  })

  it('runDemo sets setRenderError when renderStl fails', async () => {
    vi.mocked(window.electronAPI.renderStl).mockRejectedValue(new Error('Render failed'))
    const setters = createSetters()
    const { result } = renderHook(() => useDemo(setters))

    await act(async () => {
      const runPromise = result.current.runDemo()
      await vi.runAllTimersAsync()
      await runPromise
    })

    expect(setters.setRenderError).toHaveBeenCalledWith('Render failed')
    expect(result.current.isDemoRunning).toBe(false)
  })

  it('exposes isDemoRunning, isDemoDialogOpen, setIsDemoDialogOpen, runDemo', () => {
    const setters = createSetters()
    const { result } = renderHook(() => useDemo(setters))

    expect(result.current.isDemoRunning).toBe(false)
    expect(result.current.isDemoDialogOpen).toBe(false)
    expect(typeof result.current.setIsDemoDialogOpen).toBe('function')
    expect(typeof result.current.runDemo).toBe('function')

    act(() => {
      result.current.setIsDemoDialogOpen(true)
    })
    expect(result.current.isDemoDialogOpen).toBe(true)
  })
})
