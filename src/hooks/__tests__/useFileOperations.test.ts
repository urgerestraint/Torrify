import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useFileOperations,
  getDefaultMessages,
  type UseFileOperationsSetters,
  type UseFileOperationsCallbacks
} from '../useFileOperations'

function createSetters() {
  return {
    setCode: vi.fn(),
    setMessages: vi.fn(),
    setStlBase64: vi.fn(),
    setPreviewImage: vi.fn(),
    setRenderError: vi.fn(),
    setEditorKey: vi.fn()
  }
}

function createCallbacks() {
  return {
    confirmUnsavedChanges: vi.fn().mockResolvedValue(true),
    showAlert: vi.fn().mockResolvedValue(undefined),
    loadRecentFiles: vi.fn().mockResolvedValue(undefined)
  }
}

describe('getDefaultMessages', () => {
  it('returns OpenSCAD welcome text for openscad backend', () => {
    const messages = getDefaultMessages('openscad')
    expect(messages).toHaveLength(1)
    expect(messages[0].sender).toBe('bot')
    expect(messages[0].text).toMatch(/OpenSCAD/)
    expect(messages[0].text).not.toMatch(/build123d/)
  })

  it('returns build123d welcome text for build123d backend', () => {
    const messages = getDefaultMessages('build123d')
    expect(messages).toHaveLength(1)
    expect(messages[0].sender).toBe('bot')
    expect(messages[0].text).toMatch(/build123d/)
  })
})

describe('useFileOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(window.electronAPI.openScadFile).mockResolvedValue({ canceled: true })
    vi.mocked(window.electronAPI.saveScadFile).mockResolvedValue({ canceled: true })
  })

  it('exposes initial state', () => {
    const setters = createSetters() as UseFileOperationsSetters
    const callbacks = createCallbacks() as UseFileOperationsCallbacks
    const { result } = renderHook(() =>
      useFileOperations('', 'openscad', setters, callbacks)
    )
    expect(result.current.currentFilePath).toBe(null)
    expect(result.current.hasUnsavedChanges).toBe(false)
    expect(result.current.originalCode).toBe('')
    expect(result.current.DEFAULT_CODE).toBe('')
  })

  it('handleCodeChange updates hasUnsavedChanges when code differs from original', () => {
    const setters = createSetters() as UseFileOperationsSetters
    const callbacks = createCallbacks() as UseFileOperationsCallbacks
    const { result } = renderHook(() =>
      useFileOperations('', 'openscad', setters, callbacks)
    )

    act(() => {
      result.current.handleCodeChange('cube([1,1,1]);')
    })

    expect(setters.setCode).toHaveBeenCalledWith('cube([1,1,1]);')
    expect(result.current.hasUnsavedChanges).toBe(true)
  })

  it('handleCodeChange sets hasUnsavedChanges false when code matches original', () => {
    const setters = createSetters() as UseFileOperationsSetters
    const callbacks = createCallbacks() as UseFileOperationsCallbacks
    const { result } = renderHook(() =>
      useFileOperations('cube([1,1,1]);', 'openscad', setters, callbacks)
    )

    act(() => {
      result.current.setOriginalCode('cube([1,1,1]);')
    })
    act(() => {
      result.current.handleCodeChange('cube([1,1,1]);')
    })

    expect(setters.setCode).toHaveBeenCalledWith('cube([1,1,1]);')
    expect(result.current.hasUnsavedChanges).toBe(false)
  })

  it('handleNewFile resets state when user confirms', async () => {
    const setters = createSetters() as UseFileOperationsSetters
    const callbacks = createCallbacks() as UseFileOperationsCallbacks
    vi.mocked(callbacks.confirmUnsavedChanges).mockResolvedValue(true)

    const { result } = renderHook(() =>
      useFileOperations('some code', 'openscad', setters, callbacks)
    )

    await act(async () => {
      await result.current.handleNewFile()
    })

    expect(callbacks.confirmUnsavedChanges).toHaveBeenCalled()
    expect(setters.setCode).toHaveBeenCalledWith('')
    expect(setters.setMessages).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringMatching(/OpenSCAD/),
          sender: 'bot'
        })
      ])
    )
    expect(setters.setStlBase64).toHaveBeenCalledWith(null)
    expect(setters.setPreviewImage).toHaveBeenCalledWith(null)
    expect(setters.setRenderError).toHaveBeenCalledWith(null)
    expect(setters.setEditorKey).toHaveBeenCalled()
    expect(result.current.currentFilePath).toBe(null)
    expect(result.current.hasUnsavedChanges).toBe(false)
    expect(result.current.originalCode).toBe('')
  })

  it('handleNewFile does nothing when user cancels', async () => {
    const setters = createSetters() as UseFileOperationsSetters
    const callbacks = createCallbacks() as UseFileOperationsCallbacks
    vi.mocked(callbacks.confirmUnsavedChanges).mockResolvedValue(false)

    const { result } = renderHook(() =>
      useFileOperations('some code', 'openscad', setters, callbacks)
    )

    await act(async () => {
      await result.current.handleNewFile()
    })

    expect(callbacks.confirmUnsavedChanges).toHaveBeenCalled()
    expect(setters.setCode).not.toHaveBeenCalled()
    expect(setters.setMessages).not.toHaveBeenCalled()
  })

  it('handleSaveFile updates path and clears unsaved when save succeeds', async () => {
    const setters = createSetters() as UseFileOperationsSetters
    const callbacks = createCallbacks() as UseFileOperationsCallbacks
    vi.mocked(window.electronAPI.saveScadFile).mockResolvedValue({
      canceled: false,
      filePath: 'C:\\temp\\file.scad'
    })

    const { result } = renderHook(() =>
      useFileOperations('cube([1,1,1]);', 'openscad', setters, callbacks)
    )

    await act(async () => {
      await result.current.handleSaveFile()
    })

    expect(window.electronAPI.saveScadFile).toHaveBeenCalledWith(
      'cube([1,1,1]);',
      undefined,
      'openscad'
    )
    expect(result.current.currentFilePath).toBe('C:\\temp\\file.scad')
    expect(result.current.originalCode).toBe('cube([1,1,1]);')
    expect(result.current.hasUnsavedChanges).toBe(false)
    expect(callbacks.loadRecentFiles).toHaveBeenCalled()
  })

  it('handleSaveFile calls showAlert when save returns error', async () => {
    const setters = createSetters() as UseFileOperationsSetters
    const callbacks = createCallbacks() as UseFileOperationsCallbacks
    vi.mocked(window.electronAPI.saveScadFile).mockResolvedValue({
      canceled: false,
      error: 'Permission denied'
    })

    const { result } = renderHook(() =>
      useFileOperations('code', 'openscad', setters, callbacks)
    )

    await act(async () => {
      await result.current.handleSaveFile()
    })

    expect(callbacks.showAlert).toHaveBeenCalledWith(
      'Save Failed',
      'Failed to save file: Permission denied'
    )
  })

  it('handleSaveAs calls saveScadFile with no path and shows alert on error', async () => {
    const setters = createSetters() as UseFileOperationsSetters
    const callbacks = createCallbacks() as UseFileOperationsCallbacks
    vi.mocked(window.electronAPI.saveScadFile).mockResolvedValue({
      canceled: false,
      error: 'Disk full'
    })

    const { result } = renderHook(() =>
      useFileOperations('code', 'openscad', setters, callbacks)
    )

    await act(async () => {
      await result.current.handleSaveAs()
    })

    expect(window.electronAPI.saveScadFile).toHaveBeenCalledWith(
      'code',
      undefined,
      'openscad'
    )
    expect(callbacks.showAlert).toHaveBeenCalledWith(
      'Save As Failed',
      'Failed to save file: Disk full'
    )
  })

  it('handleOpenFile sets code and path when open succeeds', async () => {
    const setters = createSetters() as UseFileOperationsSetters
    const callbacks = createCallbacks() as UseFileOperationsCallbacks
    vi.mocked(callbacks.confirmUnsavedChanges).mockResolvedValue(true)
    vi.mocked(window.electronAPI.openScadFile).mockResolvedValue({
      canceled: false,
      filePath: 'C:\\temp\\opened.scad',
      code: 'sphere(5);'
    })

    const { result } = renderHook(() =>
      useFileOperations('old code', 'openscad', setters, callbacks)
    )

    await act(async () => {
      await result.current.handleOpenFile()
    })

    expect(setters.setCode).toHaveBeenCalledWith('sphere(5);')
    expect(result.current.currentFilePath).toBe('C:\\temp\\opened.scad')
    expect(result.current.originalCode).toBe('sphere(5);')
    expect(result.current.hasUnsavedChanges).toBe(false)
    expect(callbacks.loadRecentFiles).toHaveBeenCalled()
  })

  it('handleOpenFile calls showAlert when open throws', async () => {
    const setters = createSetters() as UseFileOperationsSetters
    const callbacks = createCallbacks() as UseFileOperationsCallbacks
    vi.mocked(callbacks.confirmUnsavedChanges).mockResolvedValue(true)
    vi.mocked(window.electronAPI.openScadFile).mockRejectedValue(
      new Error('File not found')
    )

    const { result } = renderHook(() =>
      useFileOperations('old code', 'openscad', setters, callbacks)
    )

    await act(async () => {
      await result.current.handleOpenFile()
    })

    expect(callbacks.showAlert).toHaveBeenCalledWith(
      'Open File Failed',
      'Failed to open file: File not found'
    )
  })
})
