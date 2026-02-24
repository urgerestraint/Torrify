# Code Health - Torrify

**Last Updated**: February 23, 2026  
**Reviewer**: Codex repository audit  
**Assessment Type**: Static code health review + runtime verification

## Current Snapshot

- Total tracked files: `228`
- Source files in `src/` + `electron/`: `154`
- Test files detected (`__tests__`, `.test`, `.spec`): `68`
- Total TS/TSX line count (`src` + `electron`): `20,223`

Runtime checks completed in this environment:

- `npm run lint` -> pass
- `npm test` -> pass (`56` test files passed, `1` skipped; `499` tests passed, `6` skipped)
- `npm run test:coverage` -> pass (global coverage: statements `87.2%`, branches `73.16%`, functions `65.53%`, lines `87.2%`)

## Health Summary

The repository remains healthy overall. This pass validated runtime checks and completed additional refactors for async test stability in `SettingsModal` and `ChatPanel`.

### Strengths

- Clear separation of renderer (`src/`) and main process (`electron/`) concerns.
- IPC handlers are modularized by domain (`electron/ipc/*`).
- Extensive test footprint by file count (`68` test files).
- No broad `TODO/FIXME/HACK` markers found in source/doc scans.
- Logging is centralized through `src/utils/logger.ts` and `electron/utils/logger.ts`.

### Areas to Improve

1. **Large UI files still centralize too much behavior**
- `src/components/ChatPanel.tsx` (`739` lines)
- `src/App.tsx` (`698` lines)
- Prompt duplication was removed; `electron/llm/prompts.ts` now re-exports the renderer prompt source instead of maintaining a second 600+ line copy.

2. **Test output still includes expected-but-noisy stderr logs**
- `ErrorBoundary` tests intentionally emit React/JSDOM error traces.
- `ChatPanel` disabled-AI test intentionally emits logger error output.
- These are expected and non-failing, but they reduce readability of CI logs.

## Resolved In This Pass

1. **IPC payload validation gaps tightened**
- `llm-send-message` / `llm-stream-message` are Zod-validated.
- `export-stl` now validates payload shape/size at the IPC boundary before decode/write.

2. **Ollama endpoint hardening**
- Added request timeout handling in `get-ollama-models`.
- Remote endpoints are blocked by default; explicit opt-in via `TORRIFY_ALLOW_REMOTE_OLLAMA=1`.

3. **Cross-layer type drift reduced**
- Removed duplicate `Window` global declaration from `electron/preload.ts`.
- Renderer keeps the single global bridge declaration in `src/vite-env.d.ts`.

4. **Documentation loader path drift fixed**
- `DOC_FILES` entries in `electron/ipc/window-doc-handlers.ts` now map to existing docs.

5. **Async test stability improved**
- `SettingsModal` now uses consolidated initial async loading/validation and mounted guards.
- `SettingsModal` and `ChatPanel` tests now await async transitions with explicit `act(...)` wrapping.
- Prior high-volume `act(...)` warning noise from these suites has been removed.

## Prioritized Recommendations

### P1 (High Impact)

1. Keep runtime schema validation as a release gate for all new IPC handlers.
2. Keep docs loader paths validated in tests/CI to prevent filename drift.
3. Continue publishing quality summary:
- lint violations
- test pass rate
- coverage summary

### P2 (Maintainability)

1. Break down `ChatPanel` and `App` into smaller orchestration + feature slices.
2. Reduce expected stderr noise in tests (error-boundary and intentional logger-path tests), or document/scope it in CI output.

### P3 (Tooling)

1. Add/confirm pre-commit checks (`lint`, targeted tests, formatting).
2. Add CI gates for docs link integrity and IPC contract tests.
3. Pin to a supported Node LTS/npm combination in CI and local docs (current environment is Node `24.13.1` + npm `11.8.0`).

## Evidence Commands (Static)

Commands used in this review:

- `rg --files | wc -l`
- `rg --files src electron | wc -l`
- `rg --files src electron | rg "__tests__|\.test\.|\.spec\." | wc -l`
- `find src electron -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 | xargs -0 wc -l | sort -nr | head -n 20`
- `rg -n "\bany\b" src electron --glob '!**/__tests__/**' --glob '!**/*.test.*' --glob '!**/*.spec.*'`
- `rg -n "TODO|FIXME|HACK|XXX" src electron docs`

## Re-Run Plan

1. `npm run lint`
2. `npm test`
3. `npm run test:coverage`
4. Update this file with exact lint/test/coverage outputs.
