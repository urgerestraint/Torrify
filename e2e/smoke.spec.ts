import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const settings = {
      cadBackend: 'openscad',
      openscadPath: '/usr/bin/openscad',
      build123dPythonPath: 'python',
      llm: {
        provider: 'gemini',
        model: 'gemini-3-flash',
        apiKey: 'test-api-key',
        enabled: true,
        temperature: 0.7,
        maxTokens: 2048,
      },
      recentFiles: [],
      hasSeenDemo: true,
    }

    const streamListeners: Record<
      string,
      (delta: string, full: string, done: boolean) => void
    > = {}

    const calls = {
      llmSendMessage: [] as unknown[],
      llmStreamMessage: [] as unknown[],
      renderStl: [] as unknown[],
    }

    ;(window as unknown as { __torrifyCalls: typeof calls }).__torrifyCalls = calls

    const asciiStl = [
      'solid smoke',
      'facet normal 0 0 1',
      'outer loop',
      'vertex 0 0 0',
      'vertex 1 0 0',
      'vertex 0 1 0',
      'endloop',
      'endfacet',
      'endsolid smoke',
    ].join('\n')

    ;(window as unknown as { electronAPI: Record<string, unknown> }).electronAPI = {
      renderScad: async () => ({ success: true, image: '', timestamp: Date.now() }),
      renderStl: async (code: string) => {
        calls.renderStl.push({ code })
        return { success: true, stlBase64: btoa(asciiStl), timestamp: Date.now() }
      },
      saveProject: async () => ({ canceled: true }),
      loadProject: async () => ({ canceled: true }),
      exportScad: async () => ({ canceled: true }),
      exportStl: async () => ({ canceled: true }),
      getTempDir: async () => '/tmp/torrify',
      getSettings: async () => settings,
      saveSettings: async () => ({ success: true }),
      checkOpenscadPath: async () => true,
      checkPythonPath: async () => ({ valid: true, version: 'Python 3.12.0' }),
      validateCadBackend: async () => ({ valid: true, version: 'OpenSCAD 2024.01' }),
      selectOpenscadPath: async () => ({ canceled: true }),
      shouldShowWelcome: async () => false,
      resetSettings: async () => ({ success: true }),
      openScadFile: async () => ({ canceled: true }),
      saveScadFile: async () => ({ canceled: true }),
      setWindowTitle: async () => undefined,
      getOpenRouterConfigured: async () => true,
      llmSendMessage: async (payload: unknown) => {
        calls.llmSendMessage.push(payload)
        return {
          success: true,
          response: {
            content: 'Generated code for smoke test.',
            model: 'gemini-3-flash',
          },
        }
      },
      llmStreamMessage: async (payload: unknown) => {
        calls.llmStreamMessage.push(payload)
        const streamId = `stream-${calls.llmStreamMessage.length}`
        setTimeout(() => {
          const callback = streamListeners[streamId]
          if (!callback) return
          const full = '<assistant>Generated code for smoke test.</assistant><openscad>cube([10,10,10]);</openscad>'
          callback(full, full, true)
        }, 10)
        return { streamId }
      },
      llmStreamAbort: async () => undefined,
      onLlmStreamChunk: (streamId: string, callback: (delta: string, full: string, done: boolean) => void) => {
        streamListeners[streamId] = callback
      },
      getRecentFiles: async () => [],
      clearRecentFiles: async () => ({ success: true }),
      removeRecentFile: async () => ({ success: true }),
      openRecentFile: async () => ({ canceled: true }),
      loadDocumentation: async () => ({ success: true, docs: {} }),
      getContext: async () => ({
        success: true,
        content: '# Mock API Context\ncube(size=[x,y,z]);',
        source: 'bundled',
        filename: 'context_openscad.txt',
      }),
      getContextStatus: async () => ({
        success: true,
        openscad: {
          user: { exists: false, size: 0, modified: null },
          bundled: { exists: true, size: 100, modified: '2026-01-01T00:00:00.000Z' },
          active: 'bundled',
        },
        build123d: {
          user: { exists: false, size: 0, modified: null },
          bundled: { exists: true, size: 100, modified: '2026-01-01T00:00:00.000Z' },
          active: 'bundled',
        },
      }),
      updateContextFromCloud: async () => ({ success: true, message: 'ok', size: 100 }),
      resetContextToFactory: async () => ({ success: true, message: 'ok' }),
      getOllamaModels: async () => ({ success: true, models: [] }),
      onMenuEvent: () => undefined,
      removeMenuListener: () => undefined,
    }
  })

  await page.goto('/')
  await expect(page.getByText('AI Assistant')).toBeVisible()
})

test('text input accepts user message entry', async ({ page }) => {
  const input = page.getByPlaceholder('Type a message...')
  await input.fill('Create a simple cube mount')
  await expect(input).toHaveValue('Create a simple cube mount')
})

test('LLM stream request is issued and response text appears', async ({ page }) => {
  const input = page.getByPlaceholder('Type a message...')
  await input.fill('Generate code')
  await page.getByRole('button', { name: 'Send message' }).click()

  await expect(page.getByText('Generated code for smoke test.')).toBeVisible()

  const llmCalls = await page.evaluate(
    () =>
      (window as unknown as { __torrifyCalls: { llmStreamMessage: unknown[] } }).__torrifyCalls
        .llmStreamMessage.length
  )
  expect(llmCalls).toBeGreaterThan(0)
})

test('render action invokes renderStl after code is available', async ({ page }) => {
  const input = page.getByPlaceholder('Type a message...')
  await input.fill('Generate code for render')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByText('Generated code for smoke test.')).toBeVisible()

  const renderButton = page.locator('button', { hasText: /refresh|render/i }).first()
  await expect(renderButton).toBeEnabled()
  await renderButton.click()

  const renderCalls = await page.evaluate(
    () =>
      (window as unknown as { __torrifyCalls: { renderStl: unknown[] } }).__torrifyCalls.renderStl
        .length
  )
  expect(renderCalls).toBeGreaterThan(0)
})
