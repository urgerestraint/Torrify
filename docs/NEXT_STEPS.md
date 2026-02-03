# Torrify - Next Steps & Recommendations

Website: https://torrify.org

**Date**: February 2, 2026  
**Current Version**: 0.9.2 (Pre-release)  
**Status**: ✅ Feature complete, security hardened, licensed (GPLv3). Ready for distribution.  
**Versioning**: One more release after 0.9.2, then v1.0. Do not move to 1.0 without explicit release approval.

---

## 📊 Current Project State

### ✅ Completed Features (Phase 1)

- **Core IDE**: 3-column layout with Monaco editor
- **Rendering**: OpenSCAD CLI integration with STL preview
- **AI Integration**: Real Google Gemini 2.0 Flash integration
- **Local LLMs**: Ollama provider with local models and endpoint configuration
- **Project Management**: Save/load `.torrify` projects (legacy `.opencursor` supported)
- **Export**: SCAD and STL file export
- **Settings**: Full settings UI with OpenSCAD path and AI configuration
- **Security**: Audit complete; IPC validation, path sanitization, logging, CSP implemented; proxy optional for PRO tier
- **Testing**: Component + service tests, plus LLM code-generation suite (run `npm test` for current counts)
- **Documentation**: Complete wiki-style documentation structure
- **PRO LLM Access Mode**: OpenRouter-backed PRO mode with curated model groups
- **Native Menu Bar**: Full application menu with LLM and Help menus
- **Error Diagnosis**: One-click AI error diagnosis button
- **Version Control**: Git repo initialized with private GitHub remote and `main` default branch

### ✅ Phase 2 - Completed

- [x] **File operations** (open .scad files directly) ✅
- [x] **Recent files list** ✅
- [x] **First startup demo** ✅
- [x] **Help Bot with documentation context** ✅
- [x] **Multi-Backend CAD Support** (OpenSCAD + build123d) ✅
- [x] **Context Management / Knowledge Base** ✅
- [x] **Streaming AI responses** ✅
- [x] **Security Hardening** (CSP, IPC Validation, Logging Sanitization) ✅
- [x] **Licensing** (GPLv3 applied) ✅
- [x] **Installers** (Windows, macOS, Linux) ✅
- [ ] **Custom OpenSCAD syntax highlighting**
- [ ] **Proxy-based PRO service** (replace env-based key)

### 🚨 Critical / Immediate

- No blockers for pre-release distribution.
- **Proxy Service**: Required for PRO tier monetization (currently using direct keys).

### 🔮 Phase 3 & 4 - Future

- **Syntax Highlighting**: Custom Monaco language definition for OpenSCAD.
- **Advanced AI**: Additional providers (Anthropic direct), multi-file context.
- **Refactoring**: ✅ Completed (February 2026) — `main.ts`, `App.tsx`, and `SettingsModal.tsx` refactored into modules; see [CODE_HEALTH.md](CODE_HEALTH.md).

### 🧾 Project Ideas (Backlog)

- Git for objects: time-based history using `.3mf`, interactive timeline (rotate/zoom), code history, separate tab
- Render display settings: adjust visual-only properties like color in the preview pane
- ~~Alternative backend: swap OpenSCAD with Build123d while keeping UX/workflow~~ ✅ **COMPLETED** - Multi-backend CAD support implemented!
- Additional CAD backends: CadQuery, FreeCAD, etc.
- Proxy server for non-BYOK/pro tier: manage model access, keys, and subscription checks
- OpenRouter integration: single gateway for multiple model providers

### ⚠️ Security Warning (Immediate)

- **Do NOT store or hardcode API keys** in the repo.
- **CSP & Validation**: Strict Content Security Policy and IPC input validation (Zod) are now active. Do not bypass these.
- **Proxy**: Prioritize implementing the proxy service for managed keys and subscription checks for the PRO tier.

---

## 🎯 Recommended Next Steps (Priority Order)

### **Priority 1: File Operations** ⭐ COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 24, 2026

**What Was Built:**
1. **Open .scad Files** ✅
   - "Open File" button in header (`Ctrl+O`)
   - IPC handler: `open-scad-file`
   - File dialog with `.scad` filter
   - Loads code into editor
   - Clears chat history (new file = new session)
   - Updates window title with filename
   - File size validation (max 10MB)

2. **Save .scad Files** ✅
   - "Save" button (saves to current file if open)
   - "Save As" button (`Ctrl+Shift+S`)
   - Tracks current file path
   - Auto-saves to current file if opened from disk
   - "Save As" dialog for new files

3. **File State Management** ✅
   - Tracks current file path in App state
   - Shows filename in window title
   - Unsaved changes warning (`*` indicator)
   - Warns before opening new file with unsaved changes
   - Keyboard shortcuts: `Ctrl+O`, `Ctrl+N`, `Ctrl+S`, `Ctrl+Shift+S`

**Implementation Details:**
- IPC handlers in `electron/main.ts`
- File operations exposed via `electron/preload.ts`
- Type definitions in `src/vite-env.d.ts`
- File state and handlers in `src/App.tsx`
- UI buttons in header toolbar

---

### **Priority 2: Recent Files List** 📋 COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 24, 2026

**What Was Built:**
1. **Recent Files Storage** ✅
   - Stores list in settings file (max 10 files)
   - Tracks: file path, last opened timestamp (ISO format)
   - Persists across app restarts
   - Automatic deduplication (moves to top if already exists)

2. **Recent Files UI** ✅
   - "Recent" dropdown button in header (between "Open" and "Save")
   - Shows last 10 files with relative timestamps (e.g., "2 hours ago", "Yesterday")
   - Click to open file directly
   - "Clear Recent Files" option at bottom
   - Handles missing files gracefully (offers to remove from list)

3. **Auto-Update** ✅
   - Automatically adds to recent files when opening files
   - Automatically adds when saving new files (Save As)
   - Removes duplicates and moves to top
   - Limited to 10 entries (MAX_RECENT_FILES constant)

**Implementation Details:**
- Extended Settings interface with `recentFiles: RecentFile[]`
- Added `addToRecentFiles()` helper function in `electron/main.ts`
- IPC handlers: `get-recent-files`, `clear-recent-files`, `remove-recent-file`, `open-recent-file`
- UI dropdown with click-outside handler
- Timestamp formatting with relative time display
- File validation before opening (checks if file exists)

**Files Modified:**
- `electron/main.ts` - Settings structure, helper function, IPC handlers
- `electron/preload.ts` - Exposed new methods
- `src/vite-env.d.ts` - Type definitions
- `src/App.tsx` - Recent files state, UI dropdown, handlers
- `src/test/setup.ts` - Test mocks

---

### **Priority 2.5: First Startup Demo** 🎬 COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 24, 2026

**What Was Built:**
1. **Demo Dialog** ✅
   - Shown on first startup (after welcome modal if configured)
   - Asks user if they want to see a demo
   - Explains what the demo will show (all three panels)

2. **Demo Functionality** ✅
   - Demonstrates all three panels working together:
     - **Chat Panel**: Shows AI conversation asking for Raspberry Pi 5 backing plate
     - **Editor Panel**: Displays generated OpenSCAD code
     - **Preview Panel**: Automatically renders the 3D model
   - Uses pre-generated content for reliability
   - Tracks if demo has been shown (`hasSeenDemo` in settings)

3. **Help Menu Integration** ✅
   - Added "Show Demo" option to Help menu
   - Can be run anytime from Help → Show Demo

**Implementation Details:**
- Demo code stored as `DEMO_CODE` constant (Raspberry Pi 5 backing plate)
- Demo prompt and response pre-generated
- Sequential execution with delays for better UX
- Settings tracking to prevent showing demo again

**Files Created/Modified:**
- `src/components/DemoDialog.tsx` - New component
- `src/App.tsx` - Demo state, `runDemo()` function, Help menu integration
- `electron/main.ts` - Added `hasSeenDemo` to Settings
- `electron/preload.ts` - Updated Settings interface
- `src/vite-env.d.ts` - Updated Settings interface

---

### **Priority 2.6: Help Bot with Documentation Context** 🤖 COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 24, 2026

**What Was Built:**
1. **Documentation Loading** ✅
   - IPC handler loads all documentation files from `docs/` directory
   - Loads key files: README, guides, architecture docs, feature docs, etc.
   - Handles both development and production paths

2. **Help Bot Component** ✅
   - Modal dialog with chat interface
   - Loads documentation on open
   - Uses existing LLM service (works with Gemini, OpenRouter, etc.)
   - Includes documentation context in conversations
   - Answers questions about:
     - Getting started
     - Development workflows
     - Features and capabilities
     - Troubleshooting
     - Project architecture

3. **Help Menu Integration** ✅
   - Added "Help Bot" option to Help menu
   - Always accessible for project questions

**Implementation Details:**
- Documentation loaded via `load-documentation` IPC handler
- Context included in first user message or conversation
- Works with all LLM providers (BYOK and PRO)
- Error handling for missing docs or LLM issues

**Files Created/Modified:**
- `src/components/HelpBot.tsx` - New component
- `electron/main.ts` - Added `load-documentation` IPC handler
- `electron/preload.ts` - Exposed `loadDocumentation` method
- `src/vite-env.d.ts` - Added type definition
- `src/App.tsx` - Help Bot state and menu integration

---

### **Priority 2.7: Multi-Backend CAD Support** 🔧 COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 24, 2026

**What Was Built:**
1. **CAD Backend Selection** ✅
   - Backend selector in Settings (General tab)
   - Choose between OpenSCAD and build123d
   - Backend-specific configuration (paths, validation)

2. **OpenSCAD Backend** ✅
   - Existing OpenSCAD CLI integration (refactored)
   - OpenSCAD path configuration
   - C syntax highlighting in editor

3. **build123d Backend** ✅
   - Python interpreter configuration
   - build123d library integration
   - Python syntax highlighting in editor
   - Auto-export wrapper for geometry detection
   - Supports Builder mode and Algebra mode

4. **Editor Integration** ✅
   - Automatic language switching (C ↔ Python)
   - Dynamic tab size (2 for OpenSCAD, 4 for Python)
   - Dynamic label in editor header

5. **AI Integration** ✅
   - Backend-aware system prompts
   - OpenSCAD prompt for OpenSCAD backend
   - build123d/Python prompt for build123d backend
   - Code extraction adapts to backend

6. **Testing** ✅
   - Expanded component and service coverage
   - Additional backend-specific tests

**Implementation Details:**
- CAD service architecture in `electron/cad/` and `src/services/cad/`
- Factory pattern for backend instantiation
- Interface-based design for extensibility
- Auto-export wrapper for build123d geometry detection

**Documentation:**
- `docs/features/CAD_BACKENDS.md` - Comprehensive feature guide

---

### **Priority 2.8: Menu Bar & Error Diagnosis** 🔧 COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 24, 2026

**What Was Built:**

1. **Native Menu Bar** ✅
   - Full application menu (File, Edit, View, LLM, Help)
   - File menu: New, Open, Save, Save As, Export SCAD, Export STL, Quit
   - Edit menu: Undo, Redo, Cut, Copy, Paste, Select All
   - View menu: Render, Reload, DevTools, Zoom, Fullscreen
   - LLM menu: Toggle AI, Switch to BYOK, Switch to PRO, LLM Settings
   - Help menu: Help Bot, Show Demo, Settings
   - Keyboard accelerators for common actions
   - macOS-specific app menu handling

2. **Toolbar Cleanup** ✅
   - Removed LLM dropdown button from toolbar
   - Removed Help dropdown button from toolbar
   - Cleaner, more focused toolbar

3. **Error Diagnosis Button** ✅
   - "Ask AI to Diagnose" button appears on render errors
   - Purple button with lightbulb icon
   - Sends error message + current code to AI
   - AI analyzes error and suggests fixes
   - One-click troubleshooting for syntax/render issues

4. **Testing** ✅
   - 44 tests total (was 42)
   - 2 new tests for diagnose button functionality
   - All tests passing

**Implementation Details:**
- Menu events sent via `webContents.send()` from Electron
- React app listens via `onMenuEvent` / `removeMenuListener`
- Pending diagnosis state in App.tsx
- ChatPanel auto-processes diagnosis requests

**Files Modified:**
- `electron/main.ts` - Added Menu import and full menu configuration
- `electron/preload.ts` - Added menu event listener methods
- `src/vite-env.d.ts` - Updated ElectronAPI types
- `src/App.tsx` - Removed toolbar buttons, added menu event listeners, diagnosis state
- `src/components/PreviewPanel.tsx` - Added diagnose button
- `src/components/ChatPanel.tsx` - Pending diagnosis handling
- `src/components/__tests__/PreviewPanel.test.tsx` - New tests
- `src/test/setup.ts` - Updated mocks

---

### **Priority 2.9: Context Management / Knowledge Base** 📚 COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 25, 2026

**What Was Built:**

1. **API Context Generator Scripts** ✅
   - `scripts/generate-context.cjs` - Node.js generator for both backends
   - `scripts/generate-build123d-context.py` - Python introspection for build123d
   - OpenSCAD: Scrapes https://openscad.org/cheatsheet/ for API reference
   - build123d: Uses Python introspection to extract function signatures
   - Falls back to comprehensive static content if generation fails

2. **Bundled API Reference Files** ✅
   - `resources/context_openscad.txt` - OpenSCAD API reference
   - `resources/context_build123d.txt` - build123d API reference with full signatures
   - Contains function signatures, parameters, usage patterns
   - Dynamically generated from actual library introspection

3. **Enhanced LLM System Prompts** ✅
   - Updated prompts with Code-CAD Standard v1.0 guidelines
   - Configuration-first approach with human-readable naming
   - OpenSCAD: Epsilon rule, BOSL2 recommendations, no magic numbers
   - build123d: Builder pattern, semantic selection, sketching rules
   - API context injected into prompts for accurate assistance

4. **Settings UI - Knowledge Base Tab** ✅
   - New "Knowledge Base" tab in Settings modal
   - Shows status of context files (user/bundled, size, last updated)
   - "Update from Cloud" button to fetch latest definitions from GitHub
   - "Reset to Factory" button to revert to bundled versions
   - Visual feedback during update operations

5. **IPC Handlers** ✅
   - `get-context` - Loads context content (user-modified or bundled)
   - `get-context-status` - Returns metadata about context files
   - `update-context-from-cloud` - Downloads context from GitHub
   - `reset-context-to-factory` - Deletes user overrides

**NPM Scripts:**
```bash
npm run generate:context           # Generate both contexts
npm run generate:context:openscad  # OpenSCAD only (scrapes cheatsheet)
npm run generate:context:build123d # build123d only (Python introspection)
```

**Implementation Details:**
- Context files prioritize user-modified versions in `app.getPath('userData')`
- Falls back to bundled `resources/` directory if no user modifications
- API context automatically loaded in ChatPanel based on current backend
- Passed to LLM service as optional `apiContext` parameter
- Injected into system prompt under "API Reference" section

**Files Created:**
- `scripts/generate-context.cjs` - Context generator script
- `scripts/generate-build123d-context.py` - Python introspection script
- `resources/context_openscad.txt` - OpenSCAD API reference
- `resources/context_build123d.txt` - build123d API reference

**Files Modified:**
- `electron/main.ts` - Context IPC handlers, getBundledResourcesDir
- `electron/preload.ts` - Exposed context methods
- `src/vite-env.d.ts` - Context type definitions
- `src/components/SettingsModal.tsx` - Knowledge Base tab UI
- `src/components/ChatPanel.tsx` - API context loading and injection
- `src/services/llm/types.ts` - Added apiContext parameter
- `src/services/llm/GeminiService.ts` - Enhanced system prompts, API context injection
- `src/services/llm/OpenRouterService.ts` - Enhanced system prompts, API context injection
- `src/test/setup.ts` - Added context method mocks
- `package.json` - Added generate:context scripts, cheerio, node-fetch

---

### **Priority 2.95: UX Improvements** 🎨 COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 25, 2026

**What Was Built:**

1. **Disable Render When Editor Empty** ✅
   - Render button disabled when no code in editor
   - Both EditorPanel and PreviewPanel buttons disabled
   - Ctrl+S shortcut only renders if code exists
   - Tooltip shows "Add code to render" when disabled

2. **Backend-Aware File Dialogs** ✅
   - File Open dialog filters based on CAD backend
   - OpenSCAD: Shows `.scad` files
   - build123d: Shows `.py` files
   - Save/Save As uses correct default extension
   - Dialog titles reflect current backend

3. **Recent Files Include Projects** ✅
- Recent files list now includes `.torrify` project files (legacy `.opencursor` supported)
   - Visual distinction: Purple folder icon for projects, document icon for code files
   - File type labels: "Project", "OpenSCAD", "Python"
   - Projects highlighted in purple for easy identification
   - Opening project restores full state (code, chat history, STL)

4. **LLM Prompt Improvements** ✅
   - Explicit import guidance for build123d (avoid `import *`)
   - Complete code requirement (no partial snippets)
   - Correct API usage examples (filter_by, sort_by, offset_3d)
   - "Common API Mistakes to AVOID" section

**Files Modified:**
- `src/components/EditorPanel.tsx` - Disable render when empty
- `src/components/PreviewPanel.tsx` - Disable refresh when empty, hasCode prop
- `src/App.tsx` - Pass hasCode to PreviewPanel, backend-aware file ops, recent files icons
- `electron/main.ts` - Backend-aware file dialogs, project files in recents
- `electron/preload.ts` - Updated API signatures
- `src/services/llm/GeminiService.ts` - Enhanced prompts
- `src/services/llm/OpenRouterService.ts` - Enhanced prompts

---

### **Priority 2.96: Image Import for Chat** 📷 COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 25, 2026

**What Was Built:**

1. **Image Attachment Button** ✅
   - Paperclip icon button in chat input area
   - Opens file picker for images (any image format)
   - Supports selecting multiple images at once

2. **Staged Image Preview** ✅
   - Thumbnails of selected images shown above input
   - Hover to reveal remove (×) button
   - Images cleared after sending message

3. **Images in Messages** ✅
   - Images displayed inline in user message bubbles
   - Click to open full-size in new window
   - Combined with preview snapshots when sending

4. **Project Persistence** ✅
- Images saved with messages in `.torrify` project files (legacy `.opencursor` supported)
   - Images restored when loading projects
   - Uses data URL format for portability

**Implementation:**
- Extended `Message` interface with `imageDataUrls?: string[]`
- Added `stagedImages` state and file input handling
- Images combined with `pendingSnapshots` when sending
- Leveraged existing LLM image support in GeminiService and OpenRouterService

**Files Modified:**
- `src/components/ChatPanel.tsx` - Main implementation

---

### **Priority 2.97: Documentation & Bug Fixes** 📝 COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 25, 2026

**What Was Built:**

1. **Documentation Update** ✅
   - Updated README.md with "Three Ways to Start a Project" section
   - Highlighted three main usage pathways:
     - Chat directly with AI
     - Send 3D snapshot for iteration
     - Attach reference images
   - Updated QUICKSTART.md with same pathways
   - Updated roadmap and manual testing checklist

2. **Demo Bug Fix** ✅
   - Fixed duplicate messages appearing when running demo
   - Added `isDemoRunning` guard state to prevent multiple simultaneous runs
   - Changed menu handler to show dialog instead of running directly
   - Proper cleanup in finally block

3. **Backend-Aware Export** ✅
   - Changed menu from "Export SCAD..." to "Export Source..."
   - Export dialog adapts to backend:
     - build123d: "Export Python", `model.py`, `.py` filter
     - OpenSCAD: "Export SCAD", `model.scad`, `.scad` filter
   - Updated all layers (main, preload, types, App)

**Files Modified:**
- `README.md` - Documentation update
- `docs/getting-started/QUICKSTART.md` - Documentation update
- `src/App.tsx` - Demo guard, backend-aware export
- `electron/main.ts` - Menu label, export handler
- `electron/preload.ts` - Export signature
- `src/vite-env.d.ts` - Type definition
- `src/test/setup.ts` - Mock update

---

### **Priority 3: Streaming AI Responses** ⚡ COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 25, 2026

**What Was Built:**

1. **LLM Service Layer Updates:**
   - Added `StreamCallback` type for handling streaming chunks
   - Added `StreamController` interface for aborting streams
   - Added optional `streamMessage()` method to `LLMService` interface

2. **GeminiService Streaming:**
   - Implemented `streamMessage()` using `sendMessageStream()`
   - Proper error handling and abort support
   - Chunked text delivered via callback

3. **OpenRouterService Streaming:**
   - Implemented `streamMessage()` using Server-Sent Events (SSE)
   - Parses SSE format with `data:` lines
   - Handles `[DONE]` signal and abort via AbortController

4. **ChatPanel UI Updates:**
   - Added `isStreaming` state for streaming indicator
   - Added `streamControllerRef` for abort functionality
   - Bot messages show blinking cursor while streaming
   - "Stop" button appears during streaming (red button to cancel)
   - Code extraction happens after streaming completes
   - Header shows "Streaming..." status during active stream

5. **Cleanup and Error Handling:**
   - Abort stream on component unmount
   - Graceful handling of network errors
   - Stream abort marked in message with "[Stopped]"

**Files Modified:**
- `src/services/llm/types.ts` - StreamCallback and StreamController types
- `src/services/llm/GeminiService.ts` - streamMessage implementation
- `src/services/llm/OpenRouterService.ts` - streamMessage implementation
- `src/components/ChatPanel.tsx` - Streaming UI and state management

**User Experience:**
- See AI responses word-by-word as they generate
- Blinking cursor indicates active streaming
- Click "Stop" to abort mid-response
- Code automatically applied to editor after complete response

---

### **Priority 3.1: LLM Code Generation Test Suite** 🧪 COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 25, 2026

**What Was Built:**

1. **Comprehensive Test Suite** ✅
   - 25 test prompts covering basic shapes, parametric designs, operations, and complex shapes
   - Tests both OpenSCAD and build123d backends (50 total tests)
   - Supports both mocked and real API testing
   - Execution validation that actually runs code through backends

2. **Enhanced Code Extraction** ✅
   - Multi-format extraction: XML tags, fenced blocks, plain text
   - Robust pattern detection for various LLM response formats
   - Handles responses that don't follow XML tag instructions

3. **Validation** ✅
   - Static validation: Syntax checking (balanced brackets, imports, etc.)
   - No rendering/execution in tests (keeps the suite fast and deterministic)

4. **Real API Testing Support** ✅
   - Conditional mocking based on `LLM_TEST_API_KEY` environment variable
   - Can test with actual Gemini or OpenRouter APIs
   - Debug logging for response analysis

**Implementation Details:**
- Test suite validates that LLM-generated code is both syntactically correct AND executable
- Confirms contexts are working properly (API references, system prompts)
- Reduces need for manual testing by validating 25 prompts automatically
- Validation ensures code structure matches the expected backend conventions

**Files Created:**
- `src/services/llm/__tests__/code-generation.test.ts` - Main test suite
- `src/services/llm/__tests__/code-validation.ts` - Validation utilities
- `src/services/llm/__tests__/test-prompts.ts` - Test prompt definitions
- `src/services/llm/__tests__/README.md` - Test suite documentation

**Files Modified:**
- `src/test/setup.ts` - Conditional LLM service mocking for real API testing

**Usage:**
```bash
# Mocked tests (CI/CD)
npm test -- --run code-generation.test.ts

# Real API tests
$env:LLM_TEST_API_KEY=$env:OPENROUTER_API_KEY
$env:LLM_TEST_PROVIDER='openrouter'
npm test -- --run code-generation.test.ts
```

**Benefits:**
- Validates contexts are working correctly
- Catches LLM generation issues early
- Reduces manual testing burden
- Confirms generated code is actually executable

---

### **Priority 3.5: OpenRouter Context Caching** 💰 COMPLETED ✅

**Status**: ✅ **IMPLEMENTED** - January 25, 2026

**What Was Built:**

1. **Model capability detection** ✅
   - `CACHE_CAPABLE_MODEL_PREFIXES` in `OpenRouterService`: `anthropic/`, `google/`
   - `supportsPromptCaching(model)` checks model ID; extend prefixes as OpenRouter adds cache support

2. **Split system prompt into cacheable vs dynamic blocks** ✅
   - `getSystemPromptBlocks(cadBackend, currentCode?, apiContext?)` in `prompts.ts`
   - **Static blocks**: Base prompt + API reference (cached when provider supports it)
   - **Dynamic block**: Current editor code only (never cached)
   - `getSystemPrompt` unchanged for non-OpenRouter / non-cache use

3. **Cache-aware OpenRouter payloads** ✅
   - `buildSystemContent()` builds system message: string (fallback) or `content` array with `cache_control`
   - Cache path: static blocks get `cache_control: { type: 'ephemeral' }`; dynamic block has none
   - Non-cache path: single string system prompt (unchanged behavior)
   - `buildPayloadMessages` accepts `SystemMessageContent` (string | array)

4. **Streaming parity** ✅
   - `sendMessage` and `streamMessage` both use `buildSystemContent` → `buildPayloadMessages`
   - Caching behavior identical for streaming and non-streaming

5. **Debug logging** ✅
   - `console.debug('[OpenRouter] Prompt caching enabled for model:', model)` when caching used

6. **Tests** ✅
   - `prompts.test.ts`: `getSystemPromptBlocks` for both backends, with/without API context and current code
   - `OpenRouterService.test.ts`: Cache-capable model → array + `cache_control`; non-cache model → string; `streamMessage` uses same logic

**Files Modified:**
- `src/services/llm/prompts.ts` - `getSystemPromptBlocks`, `SystemPromptBlocks` type
- `src/services/llm/OpenRouterService.ts` - Cache detection, `buildSystemContent`, payload construction
- `src/services/llm/__tests__/prompts.test.ts` - `getSystemPromptBlocks` tests
- `src/services/llm/__tests__/OpenRouterService.test.ts` - Cache vs fallback payload tests

**References:**
- [OpenRouter Prompt Caching](https://openrouter.ai/docs/features/prompt-caching)
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)

---

### 3.6 Code Quality & Error Handling Hardening 🔧 COMPLETED ✅

**Status**: ✅ **COMPLETE** (Feb 2, 2026)

**Completed:**
1. **React Error Boundaries** ✅
   - Added `ErrorBoundary` component
   - Wrapped the root app with error boundary
   - Added user-friendly fallback UI

2. **TypeScript `any` Types** ✅
   - Replaced `any` with `unknown` + narrowing in `electron/main.ts`
   - Replaced `any` with safe error handling in `src/App.tsx`
   - Services updated to avoid explicit `any`

3. **Console Logging in Production** ✅
   - Implemented `safeLogger` in `electron/utils/logger.ts`
   - Strips sensitive data (API keys)
   - Disables debug logs in production builds

4. **IPC Input Validation** ✅
   - Implemented Zod schemas for all IPC handlers
   - Validates paths, settings, and payloads before processing
   - Rejects invalid or malicious inputs

5. **Error Handling Consistency** ✅
   - Standardized error response shapes in IPC handlers
   - Graceful degradation for missing tools (e.g., Python not found)

**Files Modified:**
- `electron/main.ts`
- `electron/validation/` (new module)
- `src/App.tsx`

---

### **Priority 3.7: Testing & Code Quality Tooling** 🧪 COMPLETED ✅

**Status**: ✅ **COMPLETE** (Feb 2, 2026)

**Completed:**
1. **ESLint Configuration** ✅
   - Added `eslint.config.cjs` (Flat Config)
   - Configured TypeScript and React Hooks rules
   - Fixed all outstanding lint errors in the codebase

2. **Linting Scripts** ✅
   - Added `npm run lint` and `npm run lint:fix`
   - Integrated into CI/CD workflow considerations

**Remaining:**
1. **Pre-commit Hooks**
   - Add Husky and lint-staged (optional but recommended for team scale)

2. **Build Optimization**
   - Add bundle analysis (optional enhancement)

**Files Created/Modified:**
- `eslint.config.cjs`
- `package.json`

---

### **Priority 4: Custom OpenSCAD Syntax Highlighting** 🎨 MEDIUM VALUE

**Why Fourth?**
- Nice-to-have enhancement
- Improves code readability
- Requires Monaco language definition
- Lower immediate user impact

**What to Build:**
1. **OpenSCAD Language Definition**
   - Create Monaco language definition
   - Define keywords, operators, functions
   - Syntax highlighting rules
   - Basic IntelliSense (optional)

2. **Integration**
   - Register language with Monaco
   - Set editor language to 'openscad'
   - Test with various OpenSCAD code

**Implementation Notes:**
- Monaco supports custom languages
- Can start with basic highlighting
- Full IntelliSense is more complex
- Estimated effort: **4-6 hours** (basic), **8-12 hours** (with IntelliSense)

**Files to Create/Modify:**
- `src/monaco/openscad.ts` - Language definition
- `src/components/EditorPanel.tsx` - Register language
- `src/main.tsx` - Initialize Monaco with language

---

## 🔄 Alternative Quick Wins

If you want to tackle smaller features first:

### **Quick Win 1: Window Title Updates**
- Show current filename in window title
- Show "Untitled" for new files
- Show "*" for unsaved changes
- **Effort**: 30 minutes

### **Quick Win 2: Keyboard Shortcuts**
- `Ctrl+O` - Open file
- `Ctrl+S` - Save file (already renders, could also save)
- `Ctrl+Shift+S` - Save As
- `Ctrl+N` - New file
- **Effort**: 1 hour

### **Quick Win 3: Unsaved Changes Warning**
- Detect code changes
- Warn before closing/opening new file
- Simple state tracking
- **Effort**: 1 hour

### **Quick Win 4: Additional AI Providers**
- Implement OpenAI service (architecture ready)
- Implement Anthropic service (architecture ready)
- Add to provider dropdown
- **Effort**: 2-3 hours each

---

## 📈 Implementation Strategy

### **Option A: Complete Phase 2 (Recommended)**
1. File operations (2-3 hours)
2. Recent files (1-2 hours)
3. Streaming AI (3-4 hours)
4. Syntax highlighting (4-6 hours)

**Total**: ~10-15 hours  
**Result**: Complete Phase 2, ready for Phase 3

### **Option B: Quick Wins First**
1. Window title updates (30 min)
2. Keyboard shortcuts (1 hour)
3. Unsaved changes warning (1 hour)
4. File operations (2-3 hours)

**Total**: ~4-5 hours  
**Result**: Better UX, then continue with Phase 2

### **Option C: Focus on AI**
1. Streaming responses (3-4 hours)
2. OpenAI provider (2-3 hours)
3. Anthropic provider (2-3 hours)

**Total**: ~7-10 hours  
**Result**: Enhanced AI capabilities

---

## 🎯 Recommended Path Forward

**✅ Priority 1: File Operations - COMPLETED**

File operations have been successfully implemented! Users can now:
- Open existing `.scad` files directly
- Save files to disk
- See filename in window title
- Get warnings about unsaved changes

**Next Steps:**
- **Priority 3**: Streaming AI responses (improves UX) ✅ COMPLETED
- **Priority 3.5**: OpenRouter context caching (cost optimization) ✅ COMPLETED
- **Priority 4**: Custom OpenSCAD syntax highlighting (enhancement)
- **Priority 5**: Proxy-based PRO service (replace env-based key) — still pending, high priority

---

## 📝 Technical Considerations

### **File Operations Implementation Details**

**IPC Handlers Needed:**
```typescript
// electron/main.ts
ipcMain.handle('open-scad-file', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open OpenSCAD File',
    properties: ['openFile'],
    filters: [
      { name: 'OpenSCAD Files', extensions: ['scad'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true }
  }
  
  const filePath = result.filePaths[0]
  const code = fs.readFileSync(filePath, 'utf-8')
  
  // Add to recent files
  addToRecentFiles(filePath)
  
  return { canceled: false, filePath, code }
})

ipcMain.handle('save-scad-file', async (event, code: string, filePath?: string) => {
  if (filePath && fs.existsSync(filePath)) {
    // Save to existing file
    fs.writeFileSync(filePath, code, 'utf-8')
    return { canceled: false, filePath }
  }
  
  // Save As dialog
  const result = await dialog.showSaveDialog({
    title: 'Save OpenSCAD File',
    defaultPath: 'model.scad',
    filters: [
      { name: 'OpenSCAD Files', extensions: ['scad'] }
    ]
  })
  
  if (result.canceled || !result.filePath) {
    return { canceled: true }
  }
  
  fs.writeFileSync(result.filePath, code, 'utf-8')
  addToRecentFiles(result.filePath)
  
  return { canceled: false, filePath: result.filePath }
})
```

**App State Updates:**
```typescript
// src/App.tsx
const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

const handleOpenFile = async () => {
  if (hasUnsavedChanges && !confirm('Unsaved changes. Continue?')) {
    return
  }
  
  const result = await window.electronAPI.openScadFile()
  if (!result.canceled && result.filePath) {
    setCode(result.code)
    setCurrentFilePath(result.filePath)
    setHasUnsavedChanges(false)
    setMessages(DEFAULT_MESSAGES) // Clear chat
  }
}
```

---

## 🚀 Getting Started

1. **Review this document** - Understand priorities
2. **File operations, recent files, streaming AI, and OpenRouter context caching are complete** ✅
3. **Next priority**: Priority 4 (Custom OpenSCAD syntax highlighting) or Priority 5 (Proxy-based PRO service)
4. **Iterate** - Add features incrementally
5. **Test** - Ensure each feature works before moving on

---

## 📚 Related Documentation

- **[Code Health Analysis](CODE_HEALTH.md)** - Comprehensive code quality and technical debt analysis ⭐ NEW!
- **[Security Audit](security/SECURITY_AUDIT.md)** - Security vulnerabilities and remediation ⭐ UPDATED!
- [Developer Guide](developer/DEV_README.md) - Development workflows
- [Architecture](architecture/HANDOFF.md) - System design
- [Features](features/) - Feature documentation
- [Roadmap](../README.md#-roadmap) - Full roadmap

---

## 🧭 Strategic Roadmap & Architecture Notes

### Phase 2: User Experience (Next Session)
- [ ] **Implement Streaming AI**: Update `GeminiService` to use `generateContentStream` to reduce perceived latency.
- [ ] **Add Recent Files**: Implement "Recent Files" list in settings/menu to reduce friction after File I/O.

### Phase 3: "Pro" Architecture (Long Term)
- [ ] **Monetization Strategy**: Adopt an "Open Core / Service" model:
  - **Client**: Potential GPL/Open Source release. Option to bundle OpenSCAD for "it just works" onboarding.
  - **Free Tier**: BYOK (Bring Your Own Key) or Local LLM. User provides compute/access.
  - **Pro Tier**: Paid subscription via proprietary Proxy Server. User pays for convenience/managed access.
- [ ] **Proxy Requirements**:
  - Authentication (OAuth/JWT) to link users to subscriptions.
  - Managed API keys for upstream providers (OpenAI/Anthropic/etc).
- [ ] **Performance Watchlist**: Monitor IPC data transfer sizes (Base64 STL strings). If performance degrades, pivot to a file-protocol approach (e.g., `torrify://`) to reduce main-thread bottlenecks.

---

**Last Updated**: February 2, 2026  
**Status**: Priority 1–3.5 completed ✅; Security hardening completed ✅; Licensing finalized ✅  
**CAD Backends**: OpenSCAD (default) + build123d (Python)  
**Test Coverage**: Run `npm test` for the current count (includes LLM code-generation tests)  
**Recent Features**: 
- **Security Hardening**: Content Security Policy (CSP), IPC input validation (Zod), and production logging sanitization.
- **Licensing**: GPLv3 license officially adopted and applied.
- **Code Quality**: ESLint configuration added and linting errors resolved.
- **Backend-switch clear state**: When CAD backend changes, UI resets state to prevent conflicts.
- **OpenRouter Context Caching**: PRO-only prompt caching for efficiency.
- **Streaming AI**: Live token streaming for responsive chat.
- **Knowledge Base**: Context injection for OpenSCAD and build123d APIs.
**Next Review**: After implementing Syntax Highlighting or Proxy Service.

