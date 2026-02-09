# Settings System

Torrify settings are persisted locally and control the behavior of CAD backends, AI integration, and the editor.

## Accessing Settings
Click the **Gear Icon (⚙️)** in the top-right corner of the application window.

## Configuration Categories

### 1. General
*   **CAD Backend**: Switch between OpenSCAD and build123d.
*   **OpenSCAD Path**: Path to `openscad.exe`. (Validated on entry).
*   **Python Path**: Path to python interpreter for build123d.
*   **Theme**: (Future) UI theme selection.

### 2. AI Configuration
*   **Enable AI**: Master toggle for AI features.
*   **Access Mode**: Choose between **PRO** (License Key) or **BYOK** (Bring Your Own Key).
*   **Provider**: Select Gemini, OpenRouter, or Ollama.
*   **Model**: Specific model string (e.g., `gemini-2.0-flash`).
*   **Temperature**: Control randomness (0.0 - 1.0).
*   **Max Tokens**: Limit response length.

### 3. Knowledge Base
*   **Context Status**: Shows version and size of the loaded API context.
*   **Update**: Fetch the latest documentation context from the cloud.
*   **Reset**: Revert to the factory-bundled context.

## Storage
Settings are stored in a JSON file:
*   **Windows**: `C:\Users\<User>\.torrify\settings.json`
*   **macOS/Linux**: `~/.torrify/settings.json`

> **Note**: API keys are stored in plain text in this file. Do not share your settings file.
