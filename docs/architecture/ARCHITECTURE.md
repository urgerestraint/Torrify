# Architecture

## Overview
Torrify is an **AI-assisted desktop IDE for 3D CAD** built on **Electron**. It follows a secure, three-layer architecture to separate the user interface from system-level operations.

## Tech Stack
*   **Electron**: Desktop application framework.
*   **React + TypeScript**: User interface and logic.
*   **Vite**: Build tool and development server.
*   **TailwindCSS**: Styling.
*   **Monaco Editor**: Code editing (same engine as VS Code).
*   **OpenSCAD / build123d**: CAD backends.

## Project Structure
```
torrify/
├── electron/                # Main Process (Backend)
│   ├── cad/                 # CAD service integration
│   ├── main.ts              # App lifecycle & IPC
│   └── preload.ts           # Context bridge
├── src/                     # Renderer Process (Frontend)
│   ├── components/          # UI Components
│   ├── services/            # Client-side services (LLM, CAD)
│   ├── App.tsx              # Main application shell
│   └── main.tsx             # Entry point
├── resources/               # Bundled assets & context
└── scripts/                 # Build & generation scripts
```

## The Three-Layer Design

### 1. The Renderer (Frontend)
*   **Role**: The UI you interact with (Editor, Chat, Preview).
*   **Security**: Runs in a sandboxed environment. Cannot directly access the OS.
*   **Key Components**: React, Monaco Editor, Three.js (STL Viewer).

### 2. The Main Process (Backend)
*   **Role**: The "engine" running in the background.
*   **Capabilities**: Full system access (Filesystem, Spawn Processes).
*   **Responsibilities**:
    *   Saving/Loading files.
    *   Running CAD engines (OpenSCAD CLI, Python).
    *   Managing application windows.

### 3. The Preload Bridge
*   **Role**: Secure connector between Renderer and Main.
*   **Function**: Exposes a limited, typed API to the Renderer via `window.electronAPI`.
*   **Benefit**: Prevents the UI from executing arbitrary system commands.

## Key Workflows

### Rendering
1.  **Request**: Renderer sends code via IPC to Main.
2.  **Execution**: Main process writes a temp file and spawns the CAD CLI (OpenSCAD or Python).
3.  **Output**: CAD engine generates an STL file.
4.  **Display**: Main returns the STL path; Renderer loads it into the 3D viewer.

### AI Chat
1.  **Context Assembly**: System combines:
    *   System Prompt (Rules & Behavior).
    *   CAD Context (API Reference).
    *   Current Code (from Editor).
    *   User Message.
2.  **Request**: Payload sent to AI Provider (Gemini/OpenRouter/Ollama).
3.  **Response**: Streamed back to the UI.

## Data Storage
*   **Settings**: `~/.torrify/settings.json`
*   **Logs**: `~/.torrify/logs/` (or platform specific app data)
*   **Project Files**: `.torrify` (JSON containing code, chat, and settings).

## Security
*   **Context Isolation**: Enabled.
*   **Node Integration**: Disabled in Renderer.
*   **Content Security Policy (CSP)**: Strict policy applied to Renderer.
*   **API Keys**: Stored locally in settings.json; never transmitted to Torrify servers.
