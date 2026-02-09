# Knowledge Base Context

Torrify ships with API reference context for OpenSCAD and build123d. This context is injected into AI prompts to improve accuracy and reduce hallucinations.

## What It Includes

- OpenSCAD API reference
- build123d function signatures
- Backend-specific usage guidance

Bundled context files live in `resources/`:

- `resources/context_openscad.txt`
- `resources/context_build123d.txt`

## Why Updating Matters

The knowledge base is what the AI uses for API accuracy. When the context is out of date, the model may:

- Suggest deprecated functions or missing parameters.
- Use old build123d signatures that no longer match your installed version.
- Generate code that runs but produces unexpected geometry.

This is especially important after upgrading build123d, since its Python API and signatures evolve regularly.

## When To Update (Especially build123d)

- You upgrade `build123d` to a new version.
- You notice the AI referencing functions that no longer exist.
- You add a custom build123d install in a different Python environment.
- You want to sync to the newest bundled context in the repo.

## Settings UI

In **Settings → Knowledge Base** you can:

- Check context file status and size
- Update from the cloud
- Reset to factory bundled versions

User updates are stored in the app data directory and override bundled defaults.

## How To Update

### Option A: Update from the App (Recommended)

1. Open **Settings → Knowledge Base**.
2. Click **Update from the cloud**.
3. Verify the status and file size update.

### Option B: Regenerate Bundled Context (For Repo Updates)

Use this when you are shipping a new build or when build123d changes:

```bash
npm run generate:context
npm run generate:context:openscad
npm run generate:context:build123d
```

Make sure the Python environment running `generate:context:build123d` has the **same build123d version** you intend to support.

## Regenerating Context

These scripts rebuild context files:

```bash
npm run generate:context
npm run generate:context:openscad
npm run generate:context:build123d
```

### Optional: Condense with LLM (Lower Token Use)

To reduce context size and save money on LLM tokens, you can run the generator with an **LLM condense step**. The script will generate raw context as usual, then call an LLM (OpenRouter or Gemini) to produce a denser "Context Guide" (build123d) or "Syntax Context" (OpenSCAD) with the same semantic value and ~60% fewer characters.

**Preferred: OpenRouter** (uses the same key as in the app)

1. Set `OPENROUTER_API_KEY` in your environment (same as in the app):
   - **Windows (PowerShell):** `$env:OPENROUTER_API_KEY = "your-api-key"`
   - **macOS/Linux:** `export OPENROUTER_API_KEY=your-api-key`
2. Optionally set the model (default is `google/gemini-2.0-flash`):
   - `$env:OPENROUTER_MODEL = "google/gemini-2.0-flash"` (PowerShell) or `export OPENROUTER_MODEL=google/gemini-2.0-flash` (bash)
3. Run the generator. If `OPENROUTER_API_KEY` is set, the script will condense each context file after generating it:
   ```bash
   npm run generate:context
   ```

**Alternative: Gemini** (direct Google API)

1. Set `GEMINI_API_KEY` (from [Google AI Studio](https://makersuite.google.com/app/apikey)):
   - **Windows (PowerShell):** `$env:GEMINI_API_KEY = "your-api-key"`
   - **macOS/Linux:** `export GEMINI_API_KEY=your-api-key`
2. Optionally set `GEMINI_MODEL` (e.g. `gemini-2.0-flash` or `gemini-3-flash`).

**Skip condense:** To regenerate raw context only (skip the LLM step even if a key is set):
   ```bash
   npm run generate:context -- --no-gemini
   ```

Condensed output is written over the same `context_openscad.txt` and `context_build123d.txt` files. Use `--no-gemini` when you want to keep the raw scrape/introspection output.

## Files Involved

- `scripts/generate-context.cjs`
- `scripts/generate-build123d-context.py`
- `resources/context_openscad.txt`
- `resources/context_build123d.txt`
- `src/components/SettingsModal.tsx`
- `src/components/ChatPanel.tsx`

