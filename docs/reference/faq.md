# Frequently Asked Questions

## General

### What is Torrify?
Torrify is an AI-assisted IDE for 3D CAD modeling. It combines a modern code editor with live 3D rendering and an AI chat assistant to help you generate and debug OpenSCAD and build123d code.

### Is Torrify free?
Torrify is open-source software (GPLv3). However, the AI features require access to Large Language Models (LLMs).
*   **BYOK (Bring Your Own Key)**: You can use your own API keys for services like Google Gemini or OpenRouter.
*   **Local AI**: You can use Ollama for free, local AI processing.
*   **PRO**: A managed service option is available for convenience.

### What platforms are supported?
Torrify supports Windows, macOS, and Linux.

## Technical

### Which CAD engines are supported?
*   **OpenSCAD**: The default backend. Requires OpenSCAD to be installed on your system.
*   **build123d**: A Python-based CAD framework. Requires Python 3.10+ and the `build123d` library.

### Where are my settings stored?
Settings are stored in a JSON file in your home directory:
*   **Windows**: `C:\Users\<Username>\.torrify\settings.json`
*   **macOS/Linux**: `~/.torrify/settings.json`

### Can I use Torrify offline?
Yes! The core features (editor, rendering, file management) work offline. For AI chat, you can use **Ollama** running locally on your machine to fully work without an internet connection.

## Troubleshooting

### Why isn't my code rendering?
1.  Check the **Chat Panel** for error messages.
2.  Ensure you have the correct backend selected in **Settings > General**.
3.  Verify that your CAD engine path (OpenSCAD or Python) is correct in **Settings**.

### The AI says "API key not configured"
Go to **Settings > AI Configuration** and ensure you have selected a provider and entered a valid API key (or enabled Ollama).
