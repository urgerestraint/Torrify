# Torrify - Quick Reference Card

## 🚀 Launch Commands

```powershell
npm run electron:dev    # Development mode
npm test               # Run tests
npm run build         # Production build
```

## 🎯 What Works Right Now

| Feature | Status | Shortcut |
|---------|--------|----------|
| Code Editing | ✅ | - |
| Render OpenSCAD | ✅ | Ctrl+S |
| AI Chat (Gemini) | ✅ | Enter |
| Settings | ✅ | Click ⚙️ |
| Auto-save | ❌ | - |
| File Open/Save | ✅ | Ctrl+O / Ctrl+S |
| Project (.torrify) | ✅ | - |
| Export Source/STL | ✅ | - |

## 🤖 AI Configuration

**Providers:**
- **Gemini:** Google's AI (BYOK)
- **OpenRouter:** Multi-model gateway (BYOK)
- **Ollama:** Local models (No key required)
- **Gateway:** Managed PRO access via license key

**To Change:**
Settings (⚙️) → AI Configuration → Access Mode (PRO/BYOK) → Configure → Save

## 📁 Important Locations

```
App:           e:\Torrify\
Settings:      C:\Users\casey\.torrify\settings.json
OpenSCAD:      C:\Program Files\OpenSCAD (Nightly)\openscad.exe
Temp Files:    C:\Users\casey\AppData\Local\Temp\torrify\
```

## 🔧 Common Tasks

### Change OpenSCAD Path
1. Click ⚙️
2. General tab
3. Update path
4. Save

### Configure AI
1. Click ⚙️
2. AI Configuration tab
3. Adjust settings
4. Save

### Render Code
- Method 1: Press Ctrl+S
- Method 2: Click "Render" button
- Result appears in right panel

### Get AI Help
1. Type question in chat
2. Press Enter
3. AI responds with context

## 📊 Current Settings

```json
{
  "openscadPath": "C:\\Program Files\\OpenSCAD (Nightly)\\openscad.exe",
  "llm": {
    "provider": "gemini",
    "model": "gemini-2.0-flash-exp",
    "apiKey": "AIzaSyC...",
    "enabled": true,
    "temperature": 0.7,
    "maxTokens": 2048
  }
}
```

## 🎨 UI Layout

```
┌──────────────────────────────────────────────────┐
│ Torrify  OpenSCAD IDE             [⚙️]        │
├────────────┬────────────────┬────────────────────┤
│ AI Chat    │ Monaco Editor  │ Render Preview    │
│ (30%)      │ (40%)          │ (30%)             │
│            │                │                   │
│ [Chat]     │ [Code]         │ [Image]           │
│            │                │                   │
│ [Input]    │ [Render]       │ [Refresh]         │
└────────────┴────────────────┴────────────────────┘
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| App won't start | Check `__dirname` fix in main.ts |
| No AI response | Check Settings → AI → Enabled |
| Render fails | Verify OpenSCAD path in settings |
| Tests fail | Run `npm install` again |

## 📚 Documentation Map

### Start Here
1. `START_HERE.md` - Orientation
2. `WHATS_NEW.md` - Latest features

### Setup
3. `QUICKSTART.md` - 5-min setup
4. `README.md` - Complete guide

### Technical
5. `LLM_INTEGRATION.md` - AI details
6. `TESTING.md` - Test guide
7. `SETTINGS_FEATURE.md` - Settings docs

### History
8. `HANDOFF.md` - Complete log
9. `SESSION_SUMMARY.md` - This session
10. `ARCHITECTURE.md` - Architecture overview

## 🔑 Keyboard Shortcuts

```
Ctrl+S        Render OpenSCAD code
Enter         Send chat message
Shift+Enter   New line in chat
F12           DevTools
```

## 📦 Dependencies

**Production (4):**
- react
- react-dom
- @monaco-editor/react
- @google/generative-ai

**Dev (21):**
- electron, vite, vitest, typescript, etc.

## 🧪 Test Status

```
Test Files:  36 passed (37 total)
Tests:       368 passed (374 total)
Time:        ~6s tests + ~38s env
Coverage:    ~61% statements/lines (run npm run test:coverage)
```

## 🌟 Features

- [x] 3-column layout
- [x] Monaco editor
- [x] OpenSCAD rendering
- [x] Real AI chat (Gemini)
- [x] Settings system
- [x] Tests passing
- [x] Documentation complete
- [x] File operations
- [x] Project save/load
- [x] Multi-backend (OpenSCAD + build123d)
- [x] Image import
- [x] Streaming AI
- [ ] Custom OpenSCAD syntax highlighting
- [ ] OpenAI support (BYOK)
- [x] Local models (Ollama)

## 💾 Build Output

```
dist/
  index.html           0.49 kB
  assets/
    index.css         13.40 kB (3.44 kB gzip)
    index.js         204.82 kB (62.10 kB gzip)

dist-electron/
  main.js              3.27 kB
  preload.js           0.36 kB
```

## 🎯 Next Steps

1. ✅ **Done:** Core product features
2. 🎯 **Next:** Custom OpenSCAD syntax highlighting
3. 🎯 **Next:** Multiple render views
4. 🎯 **Next:** Code snippets library
5. 🎯 **Next:** Additional providers (OpenAI/Anthropic)

## 📞 Quick Links

**Run App:**
```powershell
npm run electron:dev
```

**Run Tests:**
```powershell
npm test
```

**Read Docs:**
- Start: `START_HERE.md`
- AI: `LLM_INTEGRATION.md`
- Complete: `HANDOFF.md`

---

**Version:** 0.9.2  
**Status:** ✅ Core product complete  
**AI:** ✅ Integrated (PRO = Gateway + license key; BYOK = Gemini, OpenRouter, Ollama)  
**Tests:** Run `npm test` for current results

---

*Quick Reference - Print/Bookmark This Page*

