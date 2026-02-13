# Quickstart

This guide gets you from install to first model quickly.

## 1. Install

- Install Torrify from [GitHub Releases](https://github.com/caseyhartnett/torrify/releases)
- Install [OpenSCAD](https://openscad.org/downloads.html)

## 2. Configure

Open `Settings` in Torrify and set:

- `OpenSCAD Path`
- AI provider (`Gemini`, `OpenRouter`, or `Ollama`)
- API key if required

## 3. Render Your First Model

Paste this in the editor:

```scad
cube([20, 20, 20]);
```

Save or render (`Ctrl+S`) to update the 3D preview.

## 4. Try AI-Assisted Editing

Use chat prompts such as:

- `Add a centered cylinder cutout through the cube.`
- `Make this parametric with width, depth, and height variables.`

## 5. Optional: Use build123d

If you prefer Python CAD:

```bash
pip install build123d
```

Then set `Python Path` in `Settings` and switch backend.

## Next

- See [Feature Overview](../features/overview.md)
- If something fails, check [Troubleshooting](./TROUBLESHOOTING.md)
