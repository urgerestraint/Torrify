# Node Code Health - Torrify

**Last Updated**: February 23, 2026  
**Reviewer**: Codex repository audit  
**Scope**: Electron main process + Node services (`electron/`)

## Current Snapshot

- Node/Electron files in scope: `60`
- Node/Electron test files: `21`
- TS line count in `electron/`: `7,063`

Runtime checks completed in this pass:

- `npm test -- electron/__tests__` -> pass (`21` files, `171` tests)

## New Findings

### Medium

1. **Shared temp filenames create race/corruption risk across concurrent renders**
- `electron/cad/OpenSCADService.ts:22`
- `electron/cad/OpenSCADService.ts:25`
- `electron/cad/Build123dService.ts:17`
- `electron/cad/Build123dService.ts:18`
- `electron/ipc/render-handlers.ts:26`
- `electron/ipc/render-handlers.ts:27`
- Impact:
  - Concurrent render requests can overwrite each other’s input/output files.
  - Users may receive mismatched STL/PNG results from another request.

2. **No request timeout on external LLM provider fetch calls**
- `electron/llm/OpenRouterService.ts:50`
- `electron/llm/OpenRouterService.ts:121`
- `electron/llm/GatewayService.ts:112`
- `electron/llm/GatewayService.ts:188`
- `electron/llm/OllamaService.ts:42`
- `electron/llm/OllamaService.ts:95`
- Impact:
  - Hung upstream sockets can stall request lifecycle until OS/network timeout.
  - Stream sessions can appear stuck even though user did not abort.

3. **Context updater accepts `github.com` and generic `text/*` payloads**
- `electron/context/loader.ts:8`
- `electron/ipc/context-handlers.ts:121`
- Impact:
  - Non-raw HTML/text responses can be persisted as context.
  - Degrades prompt quality and raises integrity risk for “trusted” context updates.

### Low

1. **Path traversal check is overly broad and can reject valid normalized paths**
- `electron/validation/pathValidator.ts:30`
- Impact:
  - Any path containing `..` is rejected before normalization.
  - Valid user-selected relative paths can be blocked (false negatives).

## Positive Notes

- IPC payload validation coverage is materially stronger than prior audits (LLM + STL export boundaries validated).
- Endpoint hardening for Ollama model discovery is in place (`localhost` default, remote opt-in, timeout path).
- Electron-side automated test coverage is broad and currently green.

## Recommended Remediation Order

1. **Isolate render temp artifacts per request**
- Use request-scoped filenames (UUID or mkdtemp directory) for source + outputs.
- Clean up files in `finally` blocks.

2. **Add uniform fetch timeout helper for LLM services**
- Centralize `AbortController` + timeout handling in `electron/llm/utils.ts`.
- Apply to both sync and stream entry requests.

3. **Tighten context source policy**
- Prefer `raw.githubusercontent.com` only, or enforce raw-path patterns.
- Restrict accepted content-type to `text/plain`/`application/octet-stream` + heuristic validation.

4. **Refine path validation semantics**
- Validate normalized absolute path against policy instead of raw `..` substring checks.

## Evidence Commands

- `rg --files electron | wc -l`
- `rg --files electron | rg "__tests__|\\.test\\.|\\.spec\\." | wc -l`
- `find electron -type f -name '*.ts' -print0 | xargs -0 wc -l | tail -n 1`
- `rg -n "ipcMain\\.handle\\(|ipcMain\\.on\\(" electron/ipc`
- `npm test -- electron/__tests__`
