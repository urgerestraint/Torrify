# Quick Start Guide

This guide covers installation and basic usage of Torrify.

## Installation

### Option A: Installers (Recommended)
Download the latest installer for your operating system from [GitHub Releases](https://github.com/caseyhartnett/torrify/releases).

**Supported Platforms:**
*   **Windows:** `.exe` installer
*   **macOS:** `.dmg` image
*   **Linux:** `.AppImage`

### Option B: Build from Source
*For developers who want to modify the code.*
👉 **[See the Developer Guide](../developer/README.md)**


## Configuration

On first launch, configure your settings via the **Settings (⚙️)** icon:

1.  **CAD Backend**: 
    *   **OpenSCAD**: Verify path (default: `C:\Program Files\OpenSCAD\openscad.exe` on Windows).
    *   **build123d**: Set path to Python executable with `build123d` installed.
2.  **AI Provider** (Optional):
    *   Choose Gemini, OpenRouter, or Ollama.
    *   Enter API Key.

## Basic Usage

### creating a Model
1.  **Code**: Type OpenSCAD code in the editor.
    ```openscad
    cube([10, 10, 10]);
    ```
2.  **Render**: Press `Ctrl+S` or click **Render**. The 3D view will update.

### Using AI Assistance
1.  **Chat**: Describe what you want in the chat panel (e.g., "Create a cylinder with radius 5").
2.  **Refine**: Ask for modifications (e.g., "Make it taller").
3.  **Images**: Attach reference images using the paperclip icon.

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run electron:dev` | Start app in development mode |
| `npm test` | Run test suite |
| `npm run build` | Build for production |
| `npm run package` | Create installer for current OS |

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions to common issues like:
*   "OpenSCAD not found"
*   Port conflicts
*   Build errors
