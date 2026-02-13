# Security Audit - Torrify

**Last Updated**: February 12, 2026 (22:14 EST)  
**Reviewer**: Codex static review (repository-local)  
**Assessment Type**: Source audit + static checks + runtime verification

## Scope and Method

Reviewed:

- Electron security posture (`electron/main.ts`, `electron/preload.ts`)
- IPC handlers and validation (`electron/ipc/*.ts`, `electron/validation/*.ts`)
- CAD process execution paths (`electron/cad/*.ts`, `electron/ipc/render-handlers.ts`)
- Network entry points (`electron/llm/*.ts`, context and settings handlers)
- File and project handling (`electron/ipc/file-handlers.ts`, `electron/ipc/project-handlers.ts`, `electron/ipc/recent-handlers.ts`)

Attempted runtime verification commands:

- `npm test`
- `npm run lint`
- `npm run test:coverage`

Runtime verification status:

- `npm run lint` -> pass
- `npm test` -> pass (`50` test files passed, `1` skipped; `469` tests passed, `6` skipped)
- `npm run test:coverage` -> not executed in this pass

## Executive Summary

Torrify has a solid baseline for an Electron desktop app:

- `contextIsolation: true` and `nodeIntegration: false` are enabled.
- CSP is present in both `index.html` and response headers in production.
- Most high-risk IPC surfaces use schema validation and explicit size/path controls.
- Child process usage is via argument arrays (`spawn`) without `shell: true` in production code.

However, the previous claim that "all IPC inputs are validated with Zod" is not accurate for the current codebase. Critical path IPC endpoints for LLM payloads still rely on ad-hoc checks.

## Findings

### High

None identified in this static pass.

### Medium

1. **LLM IPC payloads are not schema-validated**  
   - Files: `electron/ipc/llm-handlers.ts`  
   - Affected handlers: `llm-send-message`, `llm-stream-message`  
   - Detail: Payloads only check `messages` is an array, with no limits on array length, message size, or nested content shape.  
   - Risk: Memory pressure / DoS via oversized renderer payloads; inconsistent behavior from malformed message objects.

2. **Output size limits increased to 250MB; base64 memory amplification risk**  
   - File: `electron/constants.ts`  
   - Detail: `MAX_OUTPUT_FILE_SIZE` and `MAX_SCAD_FILE_SIZE` are now `250MB`. STL/PNG payloads are then base64-encoded and moved over IPC.  
   - Risk: A large render can create very high memory pressure in main and renderer processes.

### Low

1. **Ollama endpoint fetch is user-configurable without strict endpoint policy**  
   - File: `electron/ipc/settings-handlers.ts` (`get-ollama-models`)  
   - Detail: Accepts arbitrary endpoint string and fetches `/api/tags` without host/protocol allowlist or explicit timeout.

2. **`export-stl` lacks runtime payload validation**  
   - File: `electron/ipc/file-handlers.ts` (`export-stl`)  
   - Detail: `stlBase64` is not schema-checked for size or format at IPC boundary.

3. **Startup settings load is not schema-validated from disk**  
   - File: `electron/settings/manager.ts`  
   - Detail: `loadSettings()` merges JSON data without Zod validation; normalization is partial.

## Verified Security Controls (Present)

- Main window hardening:
  - `nodeIntegration: false` (`electron/main.ts`)
  - `contextIsolation: true` (`electron/main.ts`)
  - navigation restriction via `will-navigate`
  - restrictive `setWindowOpenHandler`
- CSP in app shell (`index.html`) and production header injection (`electron/main.ts`).
- Context update URL constraints:
  - HTTPS required
  - host allowlist: `raw.githubusercontent.com`, `github.com`
  - content-type/size checks (`electron/context/loader.ts`, `electron/ipc/context-handlers.ts`)
- File/path/project controls:
  - path validation and extension allowlist (`electron/validation/pathValidator.ts`)
  - project size cap (`MAX_PROJECT_FILE_SIZE`) and structure validation (`validateProject`)
- Process safety:
  - render timeouts and capped buffers for stderr/stdout
  - no `shell: true` in production spawn calls

## Notes on Previous Audit Claims

The previous audit text is partially outdated:

- Claim "all IPC payloads validated with Zod" is not fully true (LLM handlers and some file payloads are exceptions).
- Older sections refer to outdated limits (e.g., 50MB); current code uses 250MB limits for several flows.

## Recommended Remediation (Priority Order)

1. Add Zod schemas for LLM IPC payloads (`messages`, `content`, optional image arrays, max sizes/counts) and apply in `llm-send-message` and `llm-stream-message`.
2. Add schema validation for `export-stl` payload (`string().max(...)` and base64 shape check).
3. Add endpoint policy + timeout for `get-ollama-models`:
   - default localhost
   - optional explicit allowlist
   - request timeout via `AbortController`
4. Revisit output/file-size ceilings with performance testing and set safe upper bounds for base64 IPC transfer.
5. Validate loaded settings from disk against `SettingsSchema` before use.

## Re-Verification Checklist

After remediation:

- Run `npm run lint`
- Run `npm test`
- Run `npm run test:coverage`
- Add dedicated tests for IPC schema rejection paths in `electron/__tests__/`.
- Record results under a stable Node/npm baseline and include the exact versions used.
