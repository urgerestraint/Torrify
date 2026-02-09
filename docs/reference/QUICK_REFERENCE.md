# Quick Reference

## 🚀 Commands

| Command | Action |
|---------|--------|
| `npm run electron:dev` | Start app (Development) |
| `npm test` | Run tests |
| `npm run build` | Build production artifacts |
| `npm run package` | Create installer |

## ⌨️ Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Render (or Save if file open) |
| `Ctrl+O` | Open File |
| `Ctrl+N` | New File |
| `Ctrl+Shift+S` | Save As |
| `Enter` | Send Chat Message |
| `Shift+Enter` | New Line in Chat |
| `F12` | Toggle DevTools |

## 📂 Key Paths

*   **Settings**: `~/.torrify/settings.json`
*   **Logs**: `~/.torrify/logs/`
*   **Temp Render**: `%TEMP%/torrify/`

## ⚙️ Configuration

**Settings** (⚙️) > **General**:
*   Set **OpenSCAD Path** (`openscad.exe`)
*   Set **Python Path** (for build123d)

**Settings** (⚙️) > **AI Configuration**:
*   **Enable AI**: Toggle On
*   **Access Mode**: PRO (License Key) or BYOK (API Key)

## 🐛 Troubleshooting

*   **Render Fails**: Check OpenSCAD/Python path in Settings.
*   **No AI Response**: Check API Key and Internet connection.
*   **Changes Lost**: Watch for `*` in window title (unsaved changes).

## 📚 Doc Links

*   [User Guide](../features/overview.md)
*   [Developer Guide](../developer/README.md)
*   [Architecture](../architecture/ARCHITECTURE.md)
