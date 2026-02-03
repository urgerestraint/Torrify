import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMenuHandlers, type MenuHandlerConfig } from '../useMenuHandlers'

function createHandlers(): MenuHandlerConfig {
  return {
    handleNewFile: vi.fn(),
    handleOpenFile: vi.fn(),
    handleSaveFile: vi.fn(),
    handleSaveAs: vi.fn(),
    handleExportScad: vi.fn(),
    handleExportStl: vi.fn(),
    handleRender: vi.fn(),
    updateLlmSettings: vi.fn().mockResolvedValue(undefined),
    onOpenSettings: vi.fn(),
    onOpenHelpBot: vi.fn(),
    onShowDemo: vi.fn()
  }
}

describe('useMenuHandlers', () => {
  let onMenuEventCalls: Array<[string, () => void]>

  beforeEach(() => {
    vi.clearAllMocks()
    onMenuEventCalls = []
    vi.mocked(window.electronAPI.onMenuEvent).mockImplementation((channel: string, handler: () => void) => {
      onMenuEventCalls.push([channel, handler])
    })
    vi.mocked(window.electronAPI.removeMenuListener).mockImplementation(() => {})
  })

  it('registers listeners for known channels on mount', () => {
    const handlers = createHandlers()
    renderHook(() => useMenuHandlers(handlers))

    expect(window.electronAPI.onMenuEvent).toHaveBeenCalled()
    const channels = onMenuEventCalls.map(([ch]) => ch)
    expect(channels).toContain('menu-new-file')
    expect(channels).toContain('menu-open-file')
    expect(channels).toContain('menu-save-file')
    expect(channels).toContain('menu-save-as')
    expect(channels).toContain('menu-render')
    expect(channels).toContain('menu-settings')
    expect(channels).toContain('menu-help-bot')
    expect(channels).toContain('menu-show-demo')
  })

  it('calls removeMenuListener for each channel on unmount', () => {
    const handlers = createHandlers()
    const { unmount } = renderHook(() => useMenuHandlers(handlers))
    const registeredCount = onMenuEventCalls.length

    unmount()

    expect(window.electronAPI.removeMenuListener).toHaveBeenCalledTimes(registeredCount)
  })

  it('invoking menu-new-file handler calls handleNewFile', () => {
    const handlers = createHandlers()
    renderHook(() => useMenuHandlers(handlers))

    const entry = onMenuEventCalls.find(([ch]) => ch === 'menu-new-file')
    expect(entry).toBeDefined()
    entry![1]()

    expect(handlers.handleNewFile).toHaveBeenCalledTimes(1)
  })

  it('invoking menu-render handler calls handleRender', () => {
    const handlers = createHandlers()
    renderHook(() => useMenuHandlers(handlers))

    const entry = onMenuEventCalls.find(([ch]) => ch === 'menu-render')
    expect(entry).toBeDefined()
    entry![1]()

    expect(handlers.handleRender).toHaveBeenCalledTimes(1)
  })

  it('invoking menu-settings handler calls onOpenSettings', () => {
    const handlers = createHandlers()
    renderHook(() => useMenuHandlers(handlers))

    const entry = onMenuEventCalls.find(([ch]) => ch === 'menu-settings')
    expect(entry).toBeDefined()
    entry![1]()

    expect(handlers.onOpenSettings).toHaveBeenCalledTimes(1)
  })

  it('invoking menu-show-demo handler calls onShowDemo', () => {
    const handlers = createHandlers()
    renderHook(() => useMenuHandlers(handlers))

    const entry = onMenuEventCalls.find(([ch]) => ch === 'menu-show-demo')
    expect(entry).toBeDefined()
    entry![1]()

    expect(handlers.onShowDemo).toHaveBeenCalledTimes(1)
  })
})
