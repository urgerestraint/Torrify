# AGENTS.md — Torrify Project Knowledge

## Architecture Overview

Torrify is an AI-assisted CAD IDE for OpenSCAD and build123d. It runs as:
- **Desktop app**: Electron + Vite + React (TypeScript)
- **Web app**: Vite + React with browser-based OpenSCAD WASM rendering

### Key Directories

| Path | Purpose |
|---|---|
| `electron/` | Electron main process (TypeScript, compiled by tsc to CJS) |
| `electron/ipc/` | IPC message handlers (settings, LLM, file operations) |
| `electron/services/llm/` | LLM service providers (Gemini, OpenRouter, OpenAI, Ollama, Gateway) |
| `electron/settings/` | Settings persistence (`manager.ts`) |
| `electron/menu/` | Native application menu builder |
| `src/` | React renderer (Vite-served) |
| `src/components/` | UI components including `SettingsModal.tsx`, `ProjectToolbar.tsx` |
| `src/hooks/` | React hooks including `useMenuHandlers.ts`, `useFileOperations.ts` |
| `src/platform/web/` | Web runtime fallback (`electronAPI.ts` — browser-only shim) |
| `src/services/llm/` | Shared LLM utilities (`utils.ts` — SSE parsing, content building) |
| `dist-electron/` | Compiled Electron output (vite-plugin-electron + tsc) |

### Runtime Detection

- `VITE_RUNTIME_TARGET=desktop` → Electron mode; `vite-plugin-electron` compiles main/preload
- `VITE_RUNTIME_TARGET=web` → Web mode; `src/platform/web/electronAPI.ts` provides browser shims
- `vite.config.ts` aliases away the web electronAPI stub when in desktop mode

---

## Dev Server (`npm run electron:dev`)

**Architecture**: `vite-plugin-electron` handles the entire dev lifecycle:
1. Vite starts the dev server on `localhost:5173`
2. The plugin compiles `electron/main.ts` and `electron/preload.ts`
3. The plugin automatically launches Electron with `VITE_DEV_SERVER_URL` set
4. HMR is handled by the preload entry's `onstart(options) { options.reload() }`

> [!CAUTION]
> **Do NOT use `concurrently` to manually launch Electron alongside Vite.** This creates a
> race condition where two Electron instances fight for `requestSingleInstanceLock()`. The
> loser exits with code 0, which can cause `vite-plugin-electron` to shut down the dev server,
> leaving the winner staring at a dead `localhost:5173`.

### Production Build

```
npm run build          # tsc + vite build + build:electron (tsc + rename-electron.cjs)
npm run build:electron # tsc -p tsconfig.electron.json && node rename-electron.cjs
```

`rename-electron.cjs` renames all `.js` → `.cjs` in `dist-electron/` and rewrites `require()` paths. This is necessary because `package.json` has `"type": "module"` but Electron expects CJS for the main process.

### Preload Script

- Electron 35+ supports ESM preload scripts, so `vite-plugin-electron`'s ESM output works
- `preload.ts` uses `contextBridge.exposeInMainWorld('electronAPI', {...})` to expose IPC
- The valid menu event channels are whitelisted in `onMenuEvent`

---

## Common Gotchas

### 1. `isMountedRef` in SettingsModal

`SettingsModal.tsx` uses `isMountedRef` to guard async setState calls. The ref **must** be
reset to `true` on mount:

```tsx
useEffect(() => {
  isMountedRef.current = true   // ← CRITICAL: reset on mount
  return () => {
    isMountedRef.current = false
  }
}, [])
```

Without the reset, any HMR hot-reload permanently poisons the ref to `false`, silently
preventing `setSettings()` from ever being called.

### 2. `will-navigate` Security Handler

`electron/main.ts` blocks navigation to non-`file://` URLs for security. In development,
the Vite dev server URL must also be allowed:

```tsx
const devServerUrl = process.env.VITE_DEV_SERVER_URL
mainWindow.webContents.on('will-navigate', (event, url) => {
  const isFile = url.startsWith('file://')
  const isDevServer = devServerUrl ? url.startsWith(devServerUrl) : false
  if (!isFile && !isDevServer) {
    event.preventDefault()
  }
})
```

### 3. `useMenuHandlers` Stability

The `useMenuHandlers` hook registers IPC listeners **once** on mount using `useRef` to hold
the latest callback references. This prevents re-registering all IPC handlers on every
keystroke (which was a prior bug caused by unstable `useFileOperations` callbacks in the
dependency array).

### 4. Settings Cog Button Passes MouseEvent

`ProjectToolbar`'s settings button calls `onOpenSettings()` with the click event. In
`App.tsx`, `handleOpenSettings` guards against this:

```tsx
const handleOpenSettings = useCallback((tab?: SettingsTab | unknown) => {
  if (typeof tab === 'string') {       // Rejects MouseEvent objects
    setSettingsInitialTab(tab as SettingsTab)
  }
  setIsSettingsOpen(true)
}, [])
```

### 5. ContextBridge Serialization

When forwarding IPC events via `contextBridge`, never pass the raw `IpcRendererEvent`
object — it is not cloneable and will throw. Wrap callbacks:

```tsx
// ✅ Correct — strips the event
ipcRenderer.on(channel, () => callback())

// ❌ Breaks — passes uncloneable event across bridge
ipcRenderer.on(channel, callback)
```

### 6. Windows Python Execution Aliases

On Windows, `python` and `python3` may be Microsoft Store execution aliases that silently
open the Store instead of running Python. CAD backend validation (`checkPythonPath`,
`validateCadBackend`) can hang for 10-15 seconds waiting for these to timeout.
`SettingsModal.loadSettings` sets state **before** awaiting validations to avoid blocking
the modal render.

### 7. Zombie Processes on Windows

Electron and Node processes frequently survive after `Ctrl+C` on Windows. Always kill
zombies before restarting:

```powershell
taskkill /F /IM electron.exe; taskkill /F /IM node.exe
```

Port 5173 held by a zombie will cause Vite to silently shift to 5174 (unless `--strictPort`
is used), breaking the dev server URL alignment.

---

## LLM Provider Architecture

All providers implement streaming via SSE. Error handling appends `[System Error: ...]` to
the streamed content so users see errors inline in the chat.

| Provider | Service File | Notes |
|---|---|---|
| Gemini | `GeminiService.ts` | Uses `@google/generative-ai` SDK |
| OpenRouter | `OpenRouterService.ts` | OpenAI-compatible API with `X-Title` header |
| OpenAI | `OpenAIService.ts` | Standard OpenAI chat completions |
| Ollama | `OllamaService.ts` | Local model; requires `TORRIFY_ALLOW_REMOTE_OLLAMA` for non-localhost |
| Gateway | `GatewayService.ts` | Managed pro service with license key support |

### IPC Flow for LLM Streaming

```
Renderer                    Main Process
   │                            │
   ├─ llm-stream-message ──────►│ Creates streamId, starts async stream
   │                            │
   │◄── llm-stream-chunk ──────┤ Sends {streamId, delta, full, done}
   │◄── llm-stream-chunk ──────┤
   │◄── llm-stream-chunk ──────┤ done=true
   │                            │
   ├─ llm-stream-abort ────────►│ (optional: user cancels)
```

---

## Settings

- **Desktop**: Stored in `~/.torrify/settings.json` (via `electron/settings/manager.ts`)
- **Web**: Stored in `localStorage` key `torrify.web.settings.v1`
- Settings file has restricted permissions (`0o600`) on Unix

---

## Testing

```bash
npm test              # Vitest unit tests
npm run test:e2e      # Playwright E2E tests
npm run lint          # ESLint (src + electron)
```
