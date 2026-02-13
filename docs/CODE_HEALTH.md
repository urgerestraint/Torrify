# Code Health - Torrify

**Last Updated**: February 12, 2026 (22:14 EST)  
**Reviewer**: Codex repository audit  
**Assessment Type**: Static code health review + runtime verification

## Current Snapshot

- Total tracked files: `210`
- Source files in `src/` + `electron/`: `139`
- Test files detected (`__tests__`, `.test`, `.spec`): `54`
- Total TS/TSX line count (`src` + `electron`): `19,746`

Runtime checks completed in this environment:

- `npm run lint` -> pass
- `npm test` -> pass (`50` test files passed, `1` skipped; `469` tests passed, `6` skipped)
- `npm run test:coverage` -> not executed in this pass

## Health Summary

The repository is generally in good shape architecturally, but a few maintenance gaps remain.

### Strengths

- Clear separation of renderer (`src/`) and main process (`electron/`) concerns.
- IPC handlers are modularized by domain (`electron/ipc/*`).
- Extensive test footprint by file count (`54` test files).
- No broad `TODO/FIXME/HACK` markers found in source/doc scans.
- Logging is centralized through `src/utils/logger.ts` and `electron/utils/logger.ts`.

### Areas to Improve

1. **Large files still centralize too much behavior**
- `src/components/ChatPanel.tsx` (`739` lines)
- `src/App.tsx` (`698` lines)
- `src/services/llm/prompts.ts` (`635` lines)
- `electron/llm/prompts.ts` (`622` lines)

2. **Cross-layer type duplication persists**
- Similar API/types exist in both `electron/preload.ts` and `src/vite-env.d.ts`.
- This increases drift risk for IPC contracts.

3. **Stale documentation paths in runtime help loader**
- `electron/ipc/window-doc-handlers.ts` still references removed/renamed docs such as:
  - `docs/developer/DEV_README.md`
  - `docs/features/SETTINGS_FEATURE.md`
  - `docs/reference/DOCUMENTATION_INDEX.md`
- Result: Help/docs loading may silently miss expected content.

4. **Type safety gaps are small but present at public boundary types**
- `any` remains in `src/vite-env.d.ts` and `src/types/three.d.ts`.
- Production logic is mostly strongly typed, but these are still drift points.

## Prioritized Recommendations

### P1 (High Impact)

1. Add runtime schema validation for all remaining untyped IPC payloads (see security audit findings).
2. Fix `DOC_FILES` in `electron/ipc/window-doc-handlers.ts` to match current documentation filenames.
3. Run and publish coverage summary:
- lint violations
- test pass rate
- coverage summary

### P2 (Maintainability)

1. Break down `ChatPanel` and `App` into smaller orchestration + feature slices.
2. Consolidate shared public types into a single shared module consumed by preload and renderer declarations.
3. Deduplicate long prompt files if both renderer and electron maintain parallel copies.

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
