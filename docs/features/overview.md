# Features Overview

Torrify connects natural language prompts with parametric 3D modeling tools.

## Demo

The following demo shows the app in use, including the **parameter panel** for tweaking model parameters (e.g. dimensions, options) with sliders and controls while the 3D preview updates live.

<p align="center">
  <img src="../assets/TorrifyDemo.gif" alt="Torrify demo with parameter panel" width="800" />
</p>

## Core Features

### 🛠️ CAD Backends
*   **Multi-Backend Support**: Switch between **OpenSCAD** (default) and **build123d** (Python).
*   **Live Rendering**: Instant preview on save (`Ctrl+S`).
*   **3D Preview**: Interactive STL viewer with rotation, zoom, and pan.

### 🤖 AI Assistance
*   **Chat Interface**: Dedicated panel for AI interaction.
*   **Context Awareness**: The AI sees your current code and can reference it.
*   **Knowledge Base**: Injects API documentation into the AI context for accurate code generation.
*   **Error Diagnosis**: One-click AI diagnosis for render errors.
*   **Image Import**: Attach images to chat for reference (e.g., "Model this part").

### 📝 Editor & Workflow
*   **Monaco Editor**: Professional-grade editor with syntax highlighting.
*   **File Operations**: Open, Save, and New File support for `.scad` and `.py` files.
*   **Project Files**: Save your entire workspace (code + chat + settings) as a `.torrify` file.
*   **Native Menu Bar**: Standard desktop application menus.

### ⚙️ Configuration
*   **Settings UI**: Configure paths, AI providers, and preferences.
*   **BYOK AI**: Support for Google Gemini, OpenRouter, and Ollama (Bring Your Own Key).
