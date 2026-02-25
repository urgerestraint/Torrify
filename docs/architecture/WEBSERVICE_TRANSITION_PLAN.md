# Torrify Webservice Plan

**Date**: February 25, 2026  
**Status**: Phase 2 implemented (WASM-first rendering)

## Decision

Keep one repository and maintain both desktop and web runtimes behind a runtime adapter.

- Desktop remains Electron.
- Web is a static app hosted on Cloudflare Pages.
- Managed LLM access is always routed through Gatekeeper (Railway).
- Web users cannot use BYOK.

This gives fastest delivery with low duplication and keeps existing desktop users unblocked.

## Phase 1-2 Scope (Completed)

Phase 1 delivers a working hosted webservice path with managed usage controls.

1. Added a web runtime target (`VITE_RUNTIME_TARGET=web`) and browser `electronAPI` shim.
2. Enforced gateway-only LLM mode in web runtime:
- provider is always `gateway`
- BYOK UI and provider switching are disabled
- model is managed by service policy (`VITE_GATEWAY_MODEL`)
3. Implemented free-to-paid flow:
- users can use the app without a key (free tier)
- optional Lemon Squeezy license key is sent as `X-License-Key`
- license input is a password field with password-manager-friendly attributes
4. Added web build/deploy scripts:
- `npm run dev:web`
- `npm run build:web`
5. Added deployment documentation for Cloudflare Pages.
6. Added browser-side OpenSCAD WASM worker rendering with optional API fallback controls.

## Architecture (Phase 2)

```text
Browser (Cloudflare Pages static app)
  - React app + web runtime adapter
  - Managed gateway chat only
  - Optional license key entry
        |
        | HTTPS
        v
Gatekeeper API (Railway)
  - OpenRouter proxy
  - IP-based throttling / abuse protection
  - Lemon Squeezy license validation
  - Usage tracking in Postgres
        |
        v
OpenRouter

Rendering (current):
Browser -> OpenSCAD WASM Worker -> STL

Optional fallback:
Browser -> Render API -> STL
```

## LLM Policy

Web app policy is now fixed:

- No BYOK in web mode.
- No provider selection in web mode.
- No user-side model selection in web mode.
- All chat traffic goes through Gatekeeper.

Usage policy is server-enforced in Gatekeeper:

- New or anonymous IPs get limited free usage.
- Valid Lemon Squeezy license key unlocks higher limits.
- Budget/rate controls remain centralized in one service.

## Cost Impact (Phase 1)

- Removes support burden for BYOK in hosted product.
- Centralizes spend control in Gatekeeper.
- Uses static hosting for frontend (low cost baseline).
- Keeps Postgres on Railway (existing ops path).

## Security Notes

Phase 2 significantly reduces render RCE exposure:

- Default path is browser-side WASM rendering (no default server-side code execution).
- If API fallback is enabled, server-side render is exception-only and must be sandboxed with strict controls.

## Deployment Topology

Recommended production setup:

1. `torrify-web` on Cloudflare Pages (static bundle from `npm run build:web`).
2. `gatekeeper` on Railway (existing deployment).
3. Railway Postgres for usage/license data (existing).
4. Render API service is optional fallback only, with strict sandboxing.

## Keep One Project or Split?

Recommendation: keep one codebase now.

- Shared UI/domain logic is high.
- Runtime adapter keeps desktop/web differences isolated.
- Lower maintenance and faster iteration.

Revisit split only if team ownership or release cadence diverges.

## Next Phases

### Phase 2

- Browser-side OpenSCAD WASM worker is the default render path.
- Server render is optional fallback (`VITE_WEB_WASM_API_FALLBACK` / `VITE_WEB_RENDER_MODE=api`).

### Phase 3

- Add authenticated project persistence and multi-device sync.
- Add stronger observability dashboards (cost, abuse, latency, conversion).
