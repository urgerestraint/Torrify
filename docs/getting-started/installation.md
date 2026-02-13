# Installation

## Prerequisites

### Required

- [OpenSCAD](https://openscad.org/downloads.html)

### Optional

- Python `3.10+` and `build123d` if you plan to use the Python backend:

```bash
pip install build123d
```

## Install Torrify

Download the latest installer from [GitHub Releases](https://github.com/caseyhartnett/torrify/releases).

- Windows: run the `.exe`
- macOS: open the `.dmg` and drag to Applications
- Linux: mark the `.AppImage` executable and run

## First-Run Configuration

In `Settings` configure:

1. CAD backend paths
- OpenSCAD executable path
- Python executable path (only for build123d)

2. AI provider
- Gemini, OpenRouter, or Ollama
- API key for cloud providers

API keys are stored locally in `~/.torrify/settings.json`.

## Build From Source (Contributors)

Use the [Developer Guide](../developer/README.md) for local development setup.
