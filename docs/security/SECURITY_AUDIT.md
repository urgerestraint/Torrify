# Security Audit - Torrify

**Last Updated**: February 24, 2026  
**Reviewer**: Codex static review (repository-local)  
**Assessment Type**: Source audit + runtime verification

## Scope and Method

Reviewed:

- Electron security posture (`electron/main.ts`, `electron/preload.ts`)
- IPC handlers and validation (`electron/ipc/*.ts`, `electron/validation/*.ts`)
- CAD process execution paths (`electron/cad/*.ts`, `electron/ipc/render-handlers.ts`)
- Network entry points (`electron/llm/*.ts`, context/settings handlers)
- File and project handling (`electron/ipc/file-handlers.ts`, `electron/ipc/project-handlers.ts`, `electron/ipc/recent-handlers.ts`)

Runtime verification commands in this pass:

- `npm run lint`
- `npm test`
- `npm run test:coverage`

Runtime verification status:

- `npm run lint` -> pass
- `npm test` -> pass (`57` test files passed, `1` skipped; `502` tests passed, `6` skipped)
- `npm run test:coverage` -> pass (global coverage: statements `87.07%`, branches `73.53%`, functions `64.4%`, lines `87.07%`)

## Executive Summary

Torrify has a strong baseline for an Electron desktop app, and several previously reported issues are now resolved:

- LLM IPC payloads are schema-validated (`LLMRequestPayloadSchema`).
- `export-stl` payloads are schema-validated (`StlBase64Schema`).
- `get-ollama-models` now enforces endpoint normalization, localhost-by-default policy, and timeout handling.
- Settings loaded from disk are schema-validated in `electron/settings/manager.ts`.

Remaining risks are concentrated in context-source policy strictness and high binary transfer limits.

## Findings

### High

None identified in this pass.

### Medium

None in this pass.

### Low

1. **Context updater still allows `github.com` and broad `text/*` responses**
   - Files:
     - `electron/context/loader.ts`
     - `electron/ipc/context-handlers.ts`
   - Detail:
     - Non-raw GitHub HTML/text responses may pass current host/content-type checks.
   - Risk:
     - Context integrity degradation (unexpected or noisy content persisted as trusted context).

2. **High binary limits + base64 IPC transfer can amplify memory pressure**
   - File: `electron/constants.ts`
   - Detail:
     - `MAX_OUTPUT_FILE_SIZE` and `MAX_SCAD_FILE_SIZE` remain `250MB`.
   - Risk:
     - Large render payloads can cause avoidable memory spikes across Electron processes.

## Verified Security Controls (Present)

- Main window hardening:
  - `nodeIntegration: false`
  - `contextIsolation: true`
  - navigation restriction via `will-navigate`
  - restrictive `setWindowOpenHandler`
- CSP in app shell (`index.html`) and production header injection (`electron/main.ts`)
- IPC schema validation on critical boundaries (`electron/validation/schemas.ts`)
- Path/extension validation in file/project handlers
- Timeout + capped stderr/stdout buffers for spawned CAD processes
- No `shell: true` usage in production process execution paths

## Recommended Remediation (Priority Order)

1. Tighten context source policy:
   - Prefer `raw.githubusercontent.com` for cloud context imports.
   - Narrow accepted content types and/or validate expected file structure.
2. Reassess high file-size limits with memory/performance tests and lower thresholds where practical.

## Re-Verification Checklist

After remediation:

- Run `npm run lint`
- Run `npm test`
- Run `npm run test:coverage`
- Add/extend tests for:
  - context updater rejection of non-raw GitHub responses

## Resolved In This Pass

1. CAD temp artifact handling is now request-scoped with per-request temp directories and cleanup.
2. Provider network calls now use a shared timeout wrapper via `fetchWithTimeout`.
3. Added timeout utility tests in `electron/__tests__/llm-utils.test.ts`.
