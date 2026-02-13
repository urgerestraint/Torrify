# Start App

## Launch Installed Torrify

### Windows

- Open `Start` and run `Torrify`
- Or launch from desktop shortcut if created by installer

### macOS

- Open `Applications` and run `Torrify`

If macOS blocks the app on first run, allow it from `Privacy & Security`.

### Linux (AppImage)

```bash
chmod +x Torrify-*.AppImage
./Torrify-*.AppImage
```

## Initial Setup Checklist

After first launch:

1. Open `Settings`
2. Set CAD tool paths
- `OpenSCAD Path`
- `Python Path` (only if using build123d)
3. Configure AI provider
- Select provider
- Add API key when needed

## Run From Source

For development builds:

```bash
npm install
npm run electron:dev
```

See the [Developer Guide](../developer/README.md) for full setup.
