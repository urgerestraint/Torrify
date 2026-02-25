# Web Deployment (Phase 1 + Phase 2)

This guide deploys Torrify as a static web app while keeping LLM access on the managed gateway.

## What Phase 1 Includes

- Static frontend deployment (Cloudflare Pages supported).
- Managed LLM access only (Gateway/OpenRouter PRO path).
- No BYOK in the web app.
- Free usage path with optional license key upgrade in Settings.
- OpenSCAD rendering in-browser via WebAssembly (WASM-first).
- Optional server render API fallback for edge/browser compatibility.

## Prerequisites

1. Gatekeeper service running (Railway).
2. Gateway policy configured to support:
- limited anonymous/free usage by IP.
- higher limits when `X-License-Key` is present and valid.

## 1) Build Commands

Use the web build target:

```bash
npm install
npm run build:web
```

Local web dev mode:

```bash
npm run dev:web
```

## 2) Required Environment Variables

Set these in your static hosting build environment:

- `VITE_RUNTIME_TARGET=web`
  Note: already set by `dev:web` and `build:web` scripts.
- `VITE_GATEWAY_URL=https://<your-gateway-domain>`

Optional:

- `VITE_GATEWAY_MODEL=<managed-default-model>`
  - This is the only model used by the web runtime; users cannot select BYOK or local provider models.
- `VITE_WEB_RENDER_MODE=wasm`
  - Default is `wasm`. Set to `api` to force server render API only.
- `VITE_WEB_WASM_RENDER_TIMEOUT_MS=45000`
  - Per-render timeout for browser-side WASM rendering.
- `VITE_WEB_WASM_API_FALLBACK=true`
  - If `true`, fallback to API when WASM render fails and `VITE_RENDER_API_URL` is configured.
- `VITE_RENDER_API_URL=https://<your-render-api-domain>`
  - Needed only if you want API fallback or `VITE_WEB_RENDER_MODE=api`.

## 3) Cloudflare Pages Setup

Recommended settings:

- Framework preset: `Vite`
- Build command: `npm run build:web`
- Build output directory: `dist-web`
- Node version: 18+
- Environment variables: set values listed above

After deploy, verify the site loads over HTTPS.

## 4) LLM Access Behavior (Web)

- Web runtime always uses managed gateway mode.
- Users can chat without entering an API key (free tier behavior is enforced server-side).
- Users can enter a Lemon Squeezy license key in Settings for higher usage.
- License key input is a password field and includes password-manager-friendly attributes.

## 5) Validation Checklist

1. Open app in browser.
2. Open Settings > AI Configuration.
3. Confirm there is no BYOK provider flow.
4. Confirm license key field accepts optional value.
5. Send chat without license key (free path).
6. Send chat with license key (paid path).
7. Render STL in browser (WASM path).
8. (Optional) Validate fallback path by forcing `VITE_WEB_RENDER_MODE=api`.

## 6) Troubleshooting

- `Web render endpoint is not configured`
  This only applies if `VITE_WEB_RENDER_MODE=api` or fallback is enabled. Set `VITE_RENDER_API_URL` and redeploy.

- Chat fails with unauthorized
  Check gateway anonymous policy and `VITE_GATEWAY_URL`.

- License key not accepted
  Verify Lemon Squeezy sync/webhook state in gateway DB and key status.
