import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useRecentFiles } from '../useRecentFiles'

vi.mock('../../utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }
}))

function keyEvent(key: string): ReactKeyboardEvent {
  return { key, preventDefault: vi.fn() } as unknown as ReactKeyboardEvent
}

const mockRecentFiles = [
  { filePath: 'C:\\temp\\a.scad', lastOpened: '2026-01-01T12:00:00.000Z' },
  { filePath: 'C:\\temp\\b.scad', lastOpened: '2026-01-02T12:00:00.000Z' }
]

describe('useRecentFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(window.electronAPI.getRecentFiles).mockResolvedValue([])
  })

  it('calls getRecentFiles on mount and sets recentFiles', async () => {
    vi.mocked(window.electronAPI.getRecentFiles).mockResolvedValue(mockRecentFiles)
    const { result } = renderHook(() => useRecentFiles())

    await act(async () => {
      await Promise.resolve()
    })

    expect(window.electronAPI.getRecentFiles).toHaveBeenCalled()
    expect(result.current.recentFiles).toEqual(mockRecentFiles)
  })

  it('loadRecentFiles updates list from API', async () => {
    vi.mocked(window.electronAPI.getRecentFiles)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockRecentFiles)

    const { result } = renderHook(() => useRecentFiles())

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.recentFiles).toEqual([])

    await act(async () => {
      await result.current.loadRecentFiles()
    })
    expect(result.current.recentFiles).toEqual(mockRecentFiles)
  })

  it('closeRecentMenu closes menu and resets focus index', async () => {
    vi.mocked(window.electronAPI.getRecentFiles).mockResolvedValue(mockRecentFiles)
    const { result } = renderHook(() => useRecentFiles())

    await act(async () => {
      await Promise.resolve()
    })

    await act(() => {
      result.current.setIsRecentMenuOpen(true)
    })
    expect(result.current.isRecentMenuOpen).toBe(true)

    act(() => {
      result.current.closeRecentMenu()
    })
    expect(result.current.isRecentMenuOpen).toBe(false)
    expect(result.current.recentMenuFocusIndex).toBe(-1)
  })

  it('handleRecentMenuKeyDown ArrowDown moves focus index', async () => {
    vi.mocked(window.electronAPI.getRecentFiles).mockResolvedValue(mockRecentFiles)
    const { result } = renderHook(() => useRecentFiles())

    await act(async () => {
      await Promise.resolve()
    })
    await act(() => {
      result.current.setIsRecentMenuOpen(true)
    })

    act(() => {
      result.current.handleRecentMenuKeyDown(keyEvent('ArrowDown'))
    })
    expect(result.current.recentMenuFocusIndex).toBe(0)

    act(() => {
      result.current.handleRecentMenuKeyDown(keyEvent('ArrowDown'))
    })
    expect(result.current.recentMenuFocusIndex).toBe(1)
  })

  it('handleRecentMenuKeyDown ArrowUp moves focus index', async () => {
    vi.mocked(window.electronAPI.getRecentFiles).mockResolvedValue(mockRecentFiles)
    const { result } = renderHook(() => useRecentFiles())

    await act(async () => {
      await Promise.resolve()
    })
    await act(() => {
      result.current.setIsRecentMenuOpen(true)
    })

    act(() => {
      result.current.handleRecentMenuKeyDown(keyEvent('ArrowUp'))
    })
    expect(result.current.recentMenuFocusIndex).toBe(2)
  })

  it('handleRecentMenuKeyDown Escape closes menu', async () => {
    vi.mocked(window.electronAPI.getRecentFiles).mockResolvedValue(mockRecentFiles)
    const { result } = renderHook(() => useRecentFiles())

    await act(async () => {
      await Promise.resolve()
    })
    await act(() => {
      result.current.setIsRecentMenuOpen(true)
    })

    act(() => {
      result.current.handleRecentMenuKeyDown(keyEvent('Escape'))
    })
    expect(result.current.isRecentMenuOpen).toBe(false)
    expect(result.current.recentMenuFocusIndex).toBe(-1)
  })

  it('handleRecentMenuKeyDown does nothing when menu closed', async () => {
    vi.mocked(window.electronAPI.getRecentFiles).mockResolvedValue(mockRecentFiles)
    const { result } = renderHook(() => useRecentFiles())

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.isRecentMenuOpen).toBe(false)

    act(() => {
      result.current.handleRecentMenuKeyDown(keyEvent('ArrowDown'))
    })
    expect(result.current.recentMenuFocusIndex).toBe(-1)
  })

  it('handleRecentMenuButtonKeyDown ArrowDown opens menu and focuses first', async () => {
    vi.mocked(window.electronAPI.getRecentFiles).mockResolvedValue(mockRecentFiles)
    const { result } = renderHook(() => useRecentFiles())

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.isRecentMenuOpen).toBe(false)

    act(() => {
      result.current.handleRecentMenuButtonKeyDown(keyEvent('ArrowDown') as ReactKeyboardEvent<HTMLButtonElement>)
    })
    expect(result.current.isRecentMenuOpen).toBe(true)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(result.current.recentMenuFocusIndex).toBe(0)
  })

  it('handleRecentMenuButtonKeyDown ArrowUp opens menu', async () => {
    vi.mocked(window.electronAPI.getRecentFiles).mockResolvedValue(mockRecentFiles)
    const { result } = renderHook(() => useRecentFiles())

    await act(async () => {
      await Promise.resolve()
    })

    act(() => {
      result.current.handleRecentMenuButtonKeyDown(keyEvent('ArrowUp') as ReactKeyboardEvent<HTMLButtonElement>)
    })
    expect(result.current.isRecentMenuOpen).toBe(true)
  })
})
