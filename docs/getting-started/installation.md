# Installation

## Prerequisites

### For Standard Use
*   **OpenSCAD** ([Download](https://openscad.org/downloads.html)) - Required for default CAD backend.
*   **Python 3.10+** & `build123d` - Optional, only for Python backend.
    ```bash
    pip install build123d
    ```

### For Development
See the [Developer Guide](../developer/getting-started.md).

## Installation

### Option 1: Installers (Recommended)
Download the latest installer for your OS from [GitHub Releases](https://github.com/caseyhartnett/torrify/releases).

*   **Windows**: Run the `.exe` installer.
*   **macOS**: Open the `.dmg` and drag to Applications.
*   **Linux**: Make the `.AppImage` executable (`chmod +x`) and run.

### Option 2: Build from Source
*For advanced users and contributors.*
👉 **[See the Developer Guide](../developer/README.md)**


## Configuration

### 1. CAD Backend
On first launch, check your CAD paths in **Settings > General**:
*   **OpenSCAD Path**: e.g., `C:\Program Files\OpenSCAD\openscad.exe`
*   **Python Path**: e.g., `C:\Python310\python.exe` (if using build123d)

### 2. AI Provider (BYOK)
Torrify uses a "Bring Your Own Key" model. Configure this in **Settings > AI Configuration**:
1.  Select Provider: **Google Gemini**, **OpenRouter**, or **Ollama**.
2.  Enter API Key (not required for Ollama).
3.  Enable **"Enable AI Assistant"**.

> **Note**: API keys are stored locally in `~/.torrify/settings.json` and are never sent to our servers.
