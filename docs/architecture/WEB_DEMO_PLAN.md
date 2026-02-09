# Torrify Web Demo - Exploration & Plan

**Date**: February 6, 2026  
**Status**: Exploration / Idea Phase  
**Author**: Planning document — no code changes

---

## Executive Summary

This document explores what it would take to create a browser-based demo version of Torrify. The goal is a publicly accessible web app where people can try the core experience — write OpenSCAD code with AI assistance, render it to 3D — without downloading or installing anything.

### Scope Constraints (Simplifying Assumptions)
- **OpenSCAD only** — no build123d/Python support in the web version.
- **Single LLM model** — Gemini Flash via the existing PRO gateway, keeping cost control simple.
- **Demo-grade** — not a full replacement for the desktop app. No local file system, no project persistence beyond the browser session.

---

## Current Architecture (Desktop)

Understanding what we're adapting from:

```
┌─────────────────────────────────────────────────┐
│                  Electron App                    │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │         Renderer (React + Vite)          │   │
│  │  ChatPanel │ EditorPanel │ PreviewPanel  │   │
│  │         ↕ window.electronAPI (IPC)       │   │
│  └──────────────────────────────────────────┘   │
│                      ↕                           │
│  ┌──────────────────────────────────────────┐   │
│  │           Main Process (Node.js)         │   │
│  │                                          │   │
│  │  OpenSCADService ← spawns openscad.exe   │   │
│  │  GeminiService   ← @google/generative-ai │   │
│  │  GatewayService  ← fetch to Railway      │   │
│  │  Settings/Files  ← fs read/write         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Key coupling point**: Everything in the renderer goes through `window.electronAPI` (defined in `electron/preload.ts`). The renderer never touches the filesystem, never calls AI APIs directly, never spawns processes. This is actually good news — the API surface is well-defined.

---

## Proposed Web Architecture

```
┌──────────────────────────────────────┐
│     Browser (Cloudflare Pages)       │
│                                      │
│  React SPA (same UI components)      │
│  window.webAPI (replaces electronAPI)│
│          ↕ fetch()                   │
└──────┬──────────────┬────────────────┘
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────────────────┐
│  LLM Proxy   │  │  OpenSCAD Render API │
│  (CF Worker  │  │  (Railway + Docker)  │
│   or Gateway)│  │                      │
│              │  │  POST /render        │
│  Gemini Flash│  │  ← code in          │
│  only        │  │  → STL base64 out   │
└──────────────┘  └──────────────────────┘
```

### Three Deployment Pieces

| Piece | What It Does | Where It Runs |
|-------|-------------|---------------|
| **Frontend SPA** | The UI — editor, chat, 3D viewer | Cloudflare Pages (static) |
| **LLM Proxy** | Forwards chat to Gemini Flash, holds API key | Cloudflare Worker OR existing Railway gateway |
| **Render API** | Runs OpenSCAD headless, returns STL | Railway (Docker container) |

---

## Piece 1: Frontend SPA (Cloudflare Pages)

### What Changes
The React components (`ChatPanel`, `EditorPanel`, `PreviewPanel`, `StlViewer`) are already pure UI — they don't import anything from `electron/`. They communicate through `window.electronAPI`. The job is to provide an alternative implementation of that API.

### The Web Adapter Pattern
Create a `webAPI` object that implements the same interface as `electronAPI`, but uses `fetch()` and browser APIs instead of IPC:

| electronAPI method | Web equivalent |
|---|---|
| `renderStl(code)` | `fetch('https://render-api.../render', { body: code })` |
| `llmStreamMessage(payload)` | `fetch('https://llm-proxy.../chat', { stream: true })` |
| `getSettings()` | `JSON.parse(localStorage.getItem('settings'))` |
| `saveSettings(s)` | `localStorage.setItem('settings', JSON.stringify(s))` |
| `getContext(backend)` | `fetch('/context_openscad.txt')` (from public/) |
| `shouldShowWelcome()` | `!localStorage.getItem('hasVisited')` |
| `setWindowTitle(t)` | `document.title = t` |
| `openScadFile()` | Not needed for demo (or File System Access API) |
| `saveScadFile()` | `Blob` download or File System Access API |
| `exportStl()` | `Blob` download |
| `getRecentFiles()` | `localStorage` or omit for demo |

### Methods That Can Be Omitted for Demo
- `selectOpenscadPath` — no local OpenSCAD
- `checkOpenscadPath` / `checkPythonPath` / `validateCadBackend` — server handles this
- `loadProject` / `saveProject` — could use localStorage or omit
- `onMenuEvent` / `removeMenuListener` — no native menu bar
- `resetSettings` — simplified settings

### Build Configuration
The current `vite.config.ts` includes `vite-plugin-electron`. For the web build:
- Add an environment variable: `VITE_TARGET=web` vs `VITE_TARGET=electron`
- Conditionally include the electron plugins
- At runtime: `const api = import.meta.env.VITE_TARGET === 'web' ? webAPI : window.electronAPI`

### Static Assets
Move `resources/context_openscad.txt` into `public/` so the web build can fetch it. This file provides the OpenSCAD API reference that gets injected into the LLM system prompt.

### Hosting
- **Cloudflare Pages**: Free tier. Connect to GitHub, auto-deploys on push.
- Build command: `npm run build:web` (a new script that builds without electron plugins)
- Output directory: `dist/`

---

## Piece 2: OpenSCAD Render API (Railway)

This is the most important new piece. The browser cannot run OpenSCAD, so we need a server that does.

### API Design

```
POST /api/render
Content-Type: application/json

{
  "code": "cube(10);",
  "format": "stl"       // optional, default stl
}

Response (success):
{
  "success": true,
  "stlBase64": "c29saWQ..."
}

Response (error):
{
  "success": false,
  "error": "OpenSCAD failed (Code 1): ..."
}
```

### Implementation
A thin Express.js (or Fastify) server. The logic is essentially the same as `electron/cad/OpenSCADService.ts`:
1. Write code to a temp `.scad` file
2. Spawn `openscad -o output.stl input.scad`
3. Read the STL, base64-encode it, return as JSON
4. Clean up temp files

### Dockerfile

```dockerfile
FROM node:20-slim

# Install OpenSCAD (headless) and virtual framebuffer
RUN apt-get update && \
    apt-get install -y --no-install-recommends openscad xvfb && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY . .

EXPOSE 3000
# xvfb-run allows OpenSCAD to run without a display
CMD ["xvfb-run", "--auto-servernum", "node", "server.js"]
```

### Security Considerations
This is a **code execution service** — it runs user-provided code via OpenSCAD. Protections needed:

- **Timeout**: 30 seconds max (same as desktop). Kill the process after.
- **File size limit**: 50MB max STL output (same as desktop).
- **Rate limiting**: Per-IP rate limiting (e.g., 5 renders/minute for anonymous, more for authenticated).
- **Input sanitization**: OpenSCAD's `import()` and `include` statements could potentially read files from the server. Options:
  - Run in a Docker container with minimal filesystem
  - Strip/block `import` and `include` from user code
  - Use seccomp profiles to restrict filesystem access
- **Resource limits**: Docker memory/CPU limits to prevent abuse.
- **No persistent state**: Each render is isolated. Temp files cleaned up immediately.

### Railway Hosting
- **Plan**: Starter or Pro ($5-$20/mo depending on usage)
- **Resources**: 0.5-1 vCPU, 512MB-1GB RAM should be sufficient
- **Region**: Choose closest to your Cloudflare region
- **Scaling**: Railway supports auto-sleep (container sleeps when idle, cold-start ~2-5s). For a demo this is acceptable.
- **Note**: You already have `the-gatekeeper-production` on Railway, so you're familiar with the platform.

### Cost Estimate (Railway)
- Idle: ~$0 (auto-sleep)
- Active: ~$0.000463/min of compute
- Realistic demo usage (100 renders/day, 10s each): ~$0.50/month compute
- **Biggest cost**: Memory reservation if you keep the container warm (~$3-5/mo)

---

## Piece 3: LLM Proxy

### Option A: Reuse Existing Gateway (Simplest)
You already have `the-gatekeeper-production.up.railway.app` running. The `GatewayService` already:
- Accepts `X-License-Key` for auth
- Routes to OpenRouter models
- Supports streaming (SSE)
- Has rate limiting and cost tracking

For the web demo, you could:
1. Create a special "demo" license key
2. Hard-code it to only allow `google/gemini-2.5-flash`
3. Set aggressive rate limits (e.g., 20 requests/day per IP)
4. The frontend sends requests directly to the gateway

**Pros**: No new infrastructure. Already battle-tested.  
**Cons**: Exposes the gateway URL publicly. Need to ensure the demo key can't be abused.

### Option B: Cloudflare Worker as Thin Proxy
A CF Worker sits between the browser and Gemini's API:
- Holds the `GEMINI_API_KEY` as an environment secret
- Validates requests (rate limit by IP, max token limits)
- Forwards to `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent`
- Streams the response back via SSE

**Pros**: Free (100k requests/day on CF free tier). Extremely fast (edge network). API key never exposed.  
**Cons**: New code to write and maintain. Would need to replicate prompt construction logic.

### Option C: Call Gemini Directly from Browser
Google's Gemini API supports browser calls with an API key. You could:
- Use the `@google/generative-ai` SDK directly in the frontend
- Embed the API key (it's restricted to Gemini Flash and your domain via API restrictions)

**Pros**: Zero infrastructure. No proxy needed.  
**Cons**: API key is visible in browser (even if domain-restricted). Less control over abuse.

### Recommendation
**Option A** (reuse gateway) for a quick launch. It's already built and handles auth, rate limiting, and streaming. Create a demo-specific license key with tight limits.

If the demo grows beyond casual use, migrate to **Option B** (CF Worker) to remove the OpenRouter middleman and call Gemini directly for even lower costs.

---

## Cost Control Strategy

### Gemini Flash Costs (Direct, No OpenRouter)
| Metric | Value |
|--------|-------|
| Free tier | 15 RPM, 1M tokens/day |
| Paid: Input | $0.075 / 1M tokens |
| Paid: Output | $0.30 / 1M tokens |
| Avg request (500 in + 250 out) | ~$0.0001 |
| 10,000 demo requests | ~$1.00 |

### Via OpenRouter (Current Gateway)
| Metric | Value |
|--------|-------|
| `google/gemini-2.5-flash` input | $0.30 / 1M tokens |
| `google/gemini-2.5-flash` output | $2.50 / 1M tokens |
| Avg request (500 in + 250 out) | ~$0.0008 |
| 10,000 demo requests | ~$8.00 |

**Observation**: Calling Gemini directly (Option B/C) is ~8x cheaper than via OpenRouter. For a free public demo, this matters. But for initial launch, the gateway convenience may be worth the extra few dollars.

### Abuse Prevention
- **Per-session limit**: Cap at 20-30 AI messages per browser session
- **Per-IP daily limit**: 50 requests/day
- **Global daily budget**: Hard cap at $X/day, disable when reached
- **No image uploads**: For demo, disable the "send snapshot to AI" feature to avoid large payloads

---

## What the Demo Experience Looks Like

### User Flow
1. User visits `demo.torrify.org` (or `torrify.org/demo`)
2. Lands on a simplified version of the IDE — same 3-panel layout
3. "Run Demo" button available — shows the Raspberry Pi backing plate example
4. User can type OpenSCAD code in the editor
5. User can chat with the AI ("Make me a phone stand")
6. AI generates OpenSCAD code, user clicks "Apply to Editor"
7. User clicks "Render" → code sent to Railway API → STL returned → 3D viewer shows it
8. User can rotate/zoom the 3D model
9. User can download the STL file

### What's Removed vs Desktop
- No file open/save dialogs (replaced with download button)
- No project files (.scadgpt persistence)
- No settings modal (or a very simplified one)
- No build123d backend toggle
- No menu bar (web toolbar only)
- No OpenSCAD path configuration
- No BYOK (bring your own key) — just the demo model

### What's Kept
- The 3-panel IDE layout
- Monaco code editor with syntax highlighting
- AI chat with streaming responses
- 3D STL viewer (Three.js)
- The demo flow
- Error diagnosis ("Diagnose" button on render errors)

---

## Implementation Phases

### Phase 0: Preparation (No User-Facing Changes)
- [ ] Audit all `window.electronAPI` call sites in `src/`
- [ ] Catalog which methods are essential vs. can be stubbed/omitted
- [ ] Determine if `context_openscad.txt` should be bundled or fetched

### Phase 1: OpenSCAD Render API
- [ ] Create a new repo or subdirectory: `services/render-api/`
- [ ] Express server with `POST /api/render`
- [ ] Dockerfile with OpenSCAD + xvfb
- [ ] Basic rate limiting (express-rate-limit)
- [ ] CORS configuration (allow only your domain)
- [ ] Deploy to Railway
- [ ] Test with curl / Postman

### Phase 2: Web Adapter Layer
- [ ] Create `src/services/webAPI.ts` implementing the electronAPI interface
- [ ] Implement render calls (fetch to Railway)
- [ ] Implement LLM calls (fetch to gateway or CF Worker)
- [ ] Implement settings (localStorage)
- [ ] Implement context loading (fetch from public/)
- [ ] Stub out desktop-only methods (no-op or throw)

### Phase 3: Conditional Build
- [ ] Create `vite.config.web.ts` (no electron plugins)
- [ ] Add `build:web` script to package.json
- [ ] Environment-based API switching (`VITE_TARGET`)
- [ ] Move `context_openscad.txt` to `public/` (or copy at build time)
- [ ] Test: `npm run build:web && npx serve dist`

### Phase 4: UI Simplification for Web
- [ ] Hide/remove file toolbar (or replace with download buttons)
- [ ] Hide settings that don't apply (OpenSCAD path, build123d, BYOK)
- [ ] Add a "Download STL" button to the preview panel
- [ ] Add a banner: "This is a demo — Download the full app at torrify.org"
- [ ] Simplified welcome/onboarding for web

### Phase 5: Deploy & Polish
- [ ] Deploy frontend to Cloudflare Pages
- [ ] Configure custom domain (demo.torrify.org)
- [ ] Set up CORS between CF Pages ↔ Railway ↔ Gateway
- [ ] Add monitoring/alerting for costs
- [ ] Add analytics (how many demos run, renders, AI messages)
- [ ] Load test the render API

---

## Open Questions

1. **Subdomain or subpath?** `demo.torrify.org` vs `torrify.org/demo` — Cloudflare Pages works best with a subdomain.

2. **Monorepo or separate repo?** The render API could live in the same repo (as `services/render-api/`) or be its own repo. Monorepo is simpler for a small team.

3. **OpenSCAD version on Railway**: The `apt` version of OpenSCAD on Debian/Ubuntu is often outdated. May need to use the OpenSCAD PPA or download a nightly build in the Dockerfile for feature parity with what desktop users have.

4. **Cold start latency**: Railway auto-sleep means the first render after idle could take 2-5 seconds. Is that acceptable for a demo? Could add a "warming" ping on page load.

5. **Concurrent renders**: If multiple users hit render at the same time, the server processes them sequentially (one OpenSCAD process at a time per container). For a demo this is probably fine. For scale, you'd need a queue or multiple containers.

6. **Image support in chat**: The desktop app supports sending screenshots to the AI. For the web demo, this could be kept (canvas snapshot → base64 → send) or removed to simplify. Keeping it is relatively easy since it's already client-side.

7. **Gateway vs direct Gemini**: Start with gateway (already built), but keep the option to switch to direct Gemini calls if OpenRouter costs become a concern.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Render API abuse (crypto mining, etc.) | Medium | High | Timeout, resource limits, input sanitization |
| LLM cost runaway | Low | Medium | Per-IP limits, daily budget cap, Gemini free tier |
| OpenSCAD crashes on malicious input | Medium | Low | Process isolation, Docker restart policy |
| Cold start frustrates users | Medium | Low | Keep-alive ping, loading indicator |
| Railway cost spikes | Low | Low | Budget alerts, auto-sleep |

---

## Summary

The web demo is very achievable with the current codebase. The key insight is that the Electron app already has a clean separation between UI and backend via `window.electronAPI`. The work is:

1. **One new microservice** (OpenSCAD render API on Railway, ~200 lines of code + Dockerfile)
2. **One adapter file** (`webAPI.ts` replacing `electronAPI`, ~150 lines)
3. **One build config** (Vite without electron plugins)
4. **UI tweaks** (hide desktop-only features, add download buttons)

Estimated effort: **1-2 weeks** for a working demo, assuming familiarity with Railway and Cloudflare.

Estimated monthly cost: **$5-10/month** for casual demo traffic (Railway + Gemini).

---

_This is an exploration document. No code changes have been made._
