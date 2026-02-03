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

## Files Involved

- `scripts/generate-context.cjs`
- `scripts/generate-build123d-context.py`
- `resources/context_openscad.txt`
- `resources/context_build123d.txt`
- `src/components/SettingsModal.tsx`
- `src/components/ChatPanel.tsx`

