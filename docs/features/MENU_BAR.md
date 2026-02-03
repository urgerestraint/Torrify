# Native Menu Bar & Error Diagnosis

Torrify uses the native application menu to provide familiar desktop shortcuts and quick access to AI tools.

## Menu Overview

| Menu | Highlights |
|------|------------|
| **File** | New, Open, Save, Save As, Export Source, Export STL |
| **Edit** | Undo/Redo, Cut/Copy/Paste, Select All |
| **View** | Render, Reload, DevTools, Zoom, Fullscreen |
| **LLM** | Toggle AI, Switch to BYOK / Switch to PRO, LLM Settings |
| **Help** | Help Bot, Show Demo, Settings |

- **Switch to PRO:** Uses the managed LLM (gateway + license key). Enter your PRO license key in Settings.
- **Switch to BYOK:** Uses a bring-your-own-key provider (Gemini, OpenRouter, Ollama, etc.). Choose provider and API key in Settings.

Menu items send events to the renderer so the UI stays in sync with keyboard shortcuts and toolbar actions.

## One-Click Error Diagnosis

When a render error occurs, the preview panel shows an **Ask AI to Diagnose** button:

- Sends the error message and current code to the AI
- Returns a diagnosis and suggested fix
- Helps debug syntax or backend-specific issues quickly

## Files Involved

- `electron/main.ts` (menu definition + events)
- `electron/preload.ts` (menu event API)
- `src/App.tsx` (menu event listeners)
- `src/components/PreviewPanel.tsx` (diagnosis button)
- `src/components/ChatPanel.tsx` (diagnosis handling)

