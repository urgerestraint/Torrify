# Torrify - Developer Reference

**For Developers**: Quick reference guide for development workflows, special commands, and testing procedures.

## Table of Contents

- [Quick Start](#quick-start)
- [Development Commands](#development-commands)
- [Command Line Arguments](#command-line-arguments)
- [Testing](#testing)
- [Build & Package](#build--package)
- [Project Structure](#project-structure)
- [Key Files Reference](#key-files-reference)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Run tests
npm test
```

---

## Development Commands

### Start Development Server

```bash
# Start Vite dev server + Electron (recommended)
npm run electron:dev

# Start Vite dev server only (for browser testing)
npm run dev
```

**What it does:**
- Starts Vite dev server on `http://localhost:5173`
- Builds Electron main process
- Launches Electron with hot reload
- Opens DevTools automatically

### Build Commands

```bash
# Build everything (renderer + main process)
npm run build

# Build Electron main process only
npm run build:electron

# Preview production build (Vite only)
npm run preview
```

### Package for Distribution

```bash
# Create installer for current platform
npm run package

# Or build for specific platforms
npm run package:win      # Windows NSIS installer (.exe)
npm run package:mac      # macOS DMG (.dmg)
npm run package:linux    # Linux AppImage (.AppImage)
```

**Output Directory**: `dist-installer/`

See [Build & Package Installers](#build--package-installers) for detailed instructions.

---

## Command Line Arguments

### Reset/Wipe Settings

**Purpose**: Delete settings file and reset to defaults (useful for testing welcome screen)

**Usage:**
```bash
# After building Electron
npm run build:electron
electron . --reset-settings

# Or with the alias
electron . --wipe-settings
```

**What it does:**
- Deletes `~/.torrify/settings.json`
- Resets to default settings on next launch
- Welcome screen will appear on next launch

**When to use:**
- Testing welcome screen functionality
- Resetting corrupted settings
- Testing first-time user experience
- Debugging settings-related issues

**Note**: Settings are wiped **before** the app starts, so you'll see default values immediately.

---

## Testing

### Run Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
src/
├── components/
│   └── __tests__/
│       ├── ChatPanel.test.tsx
│       ├── DemoDialog.test.tsx
│       ├── EditorPanel.test.tsx
│       ├── EditorPanel.backend.test.tsx
│       ├── HelpBot.test.tsx
│       ├── PreviewPanel.test.tsx
│       ├── SettingsModal.test.tsx
│       ├── SettingsModal.backend.test.tsx
│       ├── StlViewer.test.tsx
│       └── WelcomeModal.test.tsx
├── services/
│   ├── cad/__tests__/cad.test.ts
│   └── llm/__tests__/code-generation.test.ts
└── App.test.tsx
```

**Current Status**: Run `npm test` for the latest count and status.

### Writing New Tests

1. Create test file: `src/components/__tests__/ComponentName.test.tsx`
2. Import testing utilities:
   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react'
   import { describe, it, expect, vi } from 'vitest'
   ```
3. Mock Electron API in `src/test/setup.ts` if needed
4. Run: `npm run test:watch`

---

## Build & Package

### Development Build

```bash
# Full development workflow
npm run electron:dev
```

**Output:**
- `dist/` - Vite build (renderer process)
- `dist-electron/` - Electron build (main process)

### Production Build

```bash
# Build for production
npm run build

# Package into installer
npm run package
```

**Output:**
- `dist/` - Production renderer build
- `dist-electron/` - Production main process
- `dist-installer/` - Packaged installers

---

## Build & Package Installers

Torrify uses `electron-builder` to create platform-specific installers.

### Prerequisites

Before building installers, ensure you have:

1. **Node.js 18+** installed
2. **All dependencies** installed: `npm install`
3. **Icons** in the `build/` directory (see [Icon Requirements](#icon-requirements))
4. **Clean build state**: `npm run build`
5. **Windows Only**: Developer Mode enabled (see [Windows Developer Mode](#windows-developer-mode))

### Building Installers

#### Windows Developer Mode

**Required for Windows builds**: electron-builder downloads signing tools that contain symbolic links, which require special privileges on Windows.

**Enable Developer Mode:**
1. Open **Windows Settings**
2. Navigate to **Privacy & Security** → **For developers**
3. Toggle **Developer Mode** to **ON**
4. Restart your terminal/IDE

**Alternative**: Run PowerShell as Administrator (not recommended for regular development)

#### Build for Current Platform

```bash
# Build application first
npm run build

# Create installer for your current OS
npm run package
```

#### Build for Specific Platforms

```bash
# Windows (NSIS installer)
npm run package:win
# Output: dist-installer/Torrify Setup X.X.X.exe
# Must run on: Windows with Developer Mode enabled

# macOS (DMG)
npm run package:mac
# Output: dist-installer/Torrify-X.X.X.dmg
# Output: dist-installer/Torrify-X.X.X-arm64.dmg
# Must run on: macOS only

# Linux (AppImage)
npm run package:linux
# Output: dist-installer/Torrify-X.X.X.AppImage
# Must run on: Linux (or WSL)
```

**Platform Requirements Summary**:
- **Windows**: Must build on Windows (requires Developer Mode)
- **macOS**: Must build on macOS (uses Apple-specific tools)
- **Linux**: Must build on Linux or WSL (uses Linux-specific tools like mksquashfs)

**Cannot cross-compile**: Each platform requires native build tools that don't work on other operating systems.

#### Cross-Platform Builds via CI/CD

To build for all platforms without having all three operating systems:

1. **Use GitHub Actions** (recommended):
   ```bash
   git push origin main
   # Automatically builds Windows, macOS, and Linux
   # Download from GitHub Actions artifacts
   ```

2. **Use WSL for Linux builds on Windows**:
   ```bash
   # In WSL Ubuntu
   cd /mnt/e/Torrify
   npm install
   npm run package:linux
   ```

3. **Use Virtual Machines**:
   - Windows VM for Windows builds
   - macOS VM (on Mac hardware only) for macOS builds
   - Linux VM for Linux builds

### Icon Requirements

Icons are required in the `build/` directory:

| Platform | File | Format | Sizes |
|----------|------|--------|-------|
| Windows | `icon.ico` | ICO | 16, 32, 48, 64, 128, 256 |
| macOS | `icon.icns` | ICNS | 16-1024 (multiple) |
| Linux | `icon.png` | PNG | 512x512 or larger |

#### Quick Icon Generation

For development/testing, you can use a simple "T" icon:

```bash
# Generate basic icons (requires canvas package)
npm install --save-dev canvas png2icons
node scripts/generate-icon.mjs
```

Then convert the generated PNGs to ICO and ICNS formats:
- **Online converters**: https://convertio.co/png-ico/, https://convertio.co/png-icns/
- **Command line**: `png2icons` package

See `build/README.md` for detailed icon instructions.

### electron-builder Configuration

The installer configuration is in `package.json` under the `build` key:

```json
{
  "build": {
    "appId": "com.torrify.app",
    "productName": "Torrify",
    "directories": {
      "buildResources": "build",
      "output": "dist-installer"
    },
    "files": ["dist/**/*", "dist-electron/**/*", "package.json"],
    "extraResources": [{"from": "resources", "to": "resources"}],
    "asar": true,
    "win": { ... },
    "mac": { ... },
    "linux": { ... }
  }
}
```

### Platform-Specific Notes

#### Windows (NSIS)

**Features:**
- Custom installation directory
- Desktop and Start Menu shortcuts
- Uninstaller included
- Per-user or system-wide installation

**Testing locally:**
```bash
npm run package:win
cd dist-installer
.\Torrify Setup 0.9.2.exe
```

**Installer options:**
- One-click: Disabled (user can choose install location)
- Desktop shortcut: Optional
- Start menu: Yes

#### macOS (DMG)

**Features:**
- Drag-to-Applications installer
- Universal binary (x64 + arm64)
- Code signing support (requires Apple Developer ID)
- Notarization support (requires credentials)

**Requirements for signing:**
- Apple Developer ID Application certificate
- Set environment variables:
  - `CSC_LINK` - Path to certificate
  - `CSC_KEY_PASSWORD` - Certificate password
  - `APPLE_ID` - Apple ID for notarization
  - `APPLE_ID_PASSWORD` - App-specific password

**Building unsigned (development):**
```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run package:mac
```

**Testing DMG:**
- Open the `.dmg` file
- Drag Torrify to Applications
- Launch from Applications

#### Linux (AppImage)

**Features:**
- Self-contained executable
- No installation required
- Works on most Linux distributions
- Desktop integration via AppImageLauncher

**Testing AppImage:**
```bash
chmod +x dist-installer/Torrify-*.AppImage
./dist-installer/Torrify-*.AppImage
```

**Desktop integration:**
- Install AppImageLauncher: `sudo apt install appimagelauncher`
- Double-click the AppImage
- Choose "Integrate and run"

### CI/CD with GitHub Actions

Torrify includes a GitHub Actions workflow to build installers for all platforms automatically.

**Workflow file**: `.github/workflows/build-installers.yml`

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests
- Git tag `release` (for release-candidate builds)
- Manual dispatch

**Platforms built:**
- Windows (on `windows-latest`)
- macOS (on `macos-latest`)
- Linux (on `ubuntu-latest`)

**Artifacts:**
- Uploaded to GitHub Actions artifacts (30 day retention)
- No automatic publishing to GitHub Releases

#### Triggering a Build

**Automatic (on push to main):**
```bash
git push origin main
```

**Manual dispatch:**
1. Go to GitHub Actions tab
2. Select "Build Installers" workflow
3. Click "Run workflow"

**Trigger a release-candidate build:**
```bash
# Tag the release build
git tag release
git push origin release

# Workflow will build and upload installers to Actions artifacts
```
To publish a release, download artifacts from the Actions run and attach them to a GitHub Release manually.

#### Viewing Build Artifacts

1. Go to GitHub Actions tab
2. Click on the workflow run
3. Scroll to "Artifacts" section
4. Download platform-specific artifacts

### Troubleshooting Builds

#### Windows: Cannot Create Symbolic Link

**Error**: `ERROR: Cannot create symbolic link : A required privilege is not held by the client`

**Cause**: Windows requires special privileges to create symbolic links, which electron-builder needs when extracting signing tools.

**Solution 1 (Recommended)**:
1. Open **Windows Settings**
2. Go to **Privacy & Security** → **For developers**
3. Enable **Developer Mode**
4. Restart your terminal/IDE
5. Run `npm run package:win` again

**Solution 2 (Alternative)**:
- Run PowerShell as Administrator
- Execute `npm run package:win`
- Note: You'll need admin privileges every time

**Why This Happens**: The `CSC_IDENTITY_AUTO_DISCOVERY=false` flag doesn't prevent electron-builder from downloading signing tools. It still downloads them and tries to extract symlinks, which fails without proper Windows privileges.

#### Missing Icons

**Error**: `WARNING: No icon found at build/icon.png`

**Solution**:
1. Check if `build/` directory exists
2. Generate icons: `node scripts/generate-icon.mjs`
3. Convert PNGs to ICO/ICNS formats
4. Place files in `build/` directory

#### Build Fails on macOS

**Error**: `Code signing failed`

**Solution**:
- Signing is already disabled in package scripts via `CSC_IDENTITY_AUTO_DISCOVERY=false`
- If still failing, manually set:
  ```bash
  export CSC_IDENTITY_AUTO_DISCOVERY=false
  npm run package:mac
  ```
- Or provide proper signing credentials

#### Linux: Cannot Build AppImage on Windows

**Error**: `cannot execute: "mksquashfs": file does not exist`

**Cause**: AppImage requires Linux-specific tools that don't run on Windows.

**Solution**:
- **Option 1**: Use WSL (Windows Subsystem for Linux)
  ```bash
  # In WSL Ubuntu
  cd /mnt/e/Torrify
  npm install
  npm run package:linux
  ```
- **Option 2**: Use GitHub Actions CI/CD (automatic)
- **Option 3**: Use a Linux VM or dual boot

**Why**: The `mksquashfs` tool is a Linux binary that creates the AppImage filesystem. It cannot run on Windows directly.

#### macOS: Cannot Build DMG on Windows/Linux

**Error**: Various errors about missing macOS tools

**Cause**: DMG creation requires macOS-specific tools.

**Solution**:
- **Option 1**: Use GitHub Actions CI/CD (runs on macOS runner)
- **Option 2**: Use a Mac or macOS VM (requires Apple hardware)

**Why**: DMG and code signing tools are macOS-only.

#### electron-builder Hangs

**Error**: Build process hangs or freezes

**Solution**:
1. Check for Node.js version issues (use Node 18+)
2. Clear cache: `rm -rf ~/.electron ~/.cache/electron-builder`
3. Try with verbose logging: `DEBUG=electron-builder npm run package`
4. Check antivirus isn't blocking electron-builder

#### Large Installer Size

**Problem**: Installer is very large (>200MB)

**Solution**:
- Verify `asar` is enabled in `package.json` (it is by default)
- Check `files` array only includes necessary files
- Remove unnecessary dependencies
- Check for large files in `resources/`

#### Windows Installer Unsigned Warning

**Problem**: Windows shows "Unknown Publisher" warning

**Solution**:
- This is normal for unsigned installers
- For production, sign with a code signing certificate
- Set `CSC_LINK` and `CSC_KEY_PASSWORD` environment variables
- Or purchase a certificate from DigiCert, Sectigo, etc.

### Advanced Configuration

#### Custom Installer Graphics

Add custom installer graphics to `build/`:

**Windows:**
- `installerIcon.ico` - Installer icon
- `installerHeader.bmp` - Installer header image (150x57)
- `installerSidebar.bmp` - Installer sidebar image (164x314)

**macOS:**
- `background.png` - DMG background image (540x380)
- `background@2x.png` - Retina DMG background (1080x760)

#### Code Signing

**Windows:**
```bash
# Set certificate
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password

# Build signed installer
npm run package:win
```

**macOS:**
```bash
# Set certificate and notarization credentials
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=your_password
export APPLE_ID=your@apple.id
export APPLE_ID_PASSWORD=app-specific-password

# Build and notarize
npm run package:mac
```

#### Custom Build Scripts

Add custom build scripts to `package.json`:

```json
{
  "scripts": {
    "package:all": "npm run package:win && npm run package:mac && npm run package:linux",
    "package:unsigned": "CSC_IDENTITY_AUTO_DISCOVERY=false npm run package",
    "clean:build": "rm -rf dist dist-electron dist-installer"
  }
}
```

### Version Management

Version is managed in `package.json`:

```json
{
  "version": "0.9.2"
}
```

To bump version:

```bash
# Patch (0.9.2 -> 0.9.3)
npm version patch

# Minor (0.9.2 -> 0.10.0)
npm version minor

# Major (0.9.2 -> 1.0.0)
npm version major
```

This will:
1. Update `package.json` version
2. Create a git commit
3. Create a git tag

Then push the tag to trigger CI/CD:

```bash
git push && git push --tags
```

---

## Project Structure

```
e:\Torrify/
├── electron/              # Electron main process
│   ├── cad/               # CAD backend services
│   ├── main.ts           # Main process (IPC, CAD integration)
│   └── preload.ts        # Preload script (context bridge)
├── src/                   # React frontend
│   ├── components/        # React components
│   ├── services/          # CAD + LLM service layer
│   ├── App.tsx           # Main app component
│   └── main.tsx          # React entry point
├── resources/             # Bundled API context
├── scripts/               # Context generation scripts
├── dist/                  # Build output (renderer)
├── dist-electron/         # Build output (main)
└── package.json
```

---

## Key Files Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `vite.config.ts` | Vite build configuration |
| `tsconfig.json` | TypeScript config (renderer) |
| `tsconfig.electron.json` | TypeScript config (main) |
| `tailwind.config.js` | TailwindCSS configuration |
| `vitest.config.ts` | Test configuration |

### Core Application Files

| File | Purpose |
|------|---------|
| `electron/main.ts` | Electron main process, IPC handlers |
| `electron/preload.ts` | Context bridge, API exposure |
| `src/App.tsx` | Main React component, layout |
| `src/main.tsx` | React entry point |
| `src/vite-env.d.ts` | TypeScript definitions for Electron API |

### Component Files

| File | Purpose |
|------|---------|
| `src/components/ChatPanel.tsx` | AI chat interface |
| `src/components/EditorPanel.tsx` | Monaco code editor |
| `src/components/PreviewPanel.tsx` | 3D preview display |
| `src/components/SettingsModal.tsx` | Settings configuration UI |
| `src/components/WelcomeModal.tsx` | First-time welcome screen |
| `src/components/StlViewer.tsx` | Three.js STL viewer |

### Service Files

| File | Purpose |
|------|---------|
| `src/services/llm/types.ts` | LLM service interfaces |
| `src/services/llm/index.ts` | LLM service factory |
| `src/services/llm/GeminiService.ts` | Google Gemini implementation |

---

## Common Tasks

### Reset Settings for Testing

```bash
# Method 1: Command line argument
npm run build:electron
electron . --reset-settings

# Method 2: Delete manually
# Windows: Delete C:\Users\<username>\.torrify\settings.json
# Linux/Mac: Delete ~/.torrify/settings.json
```

### Test Welcome Screen

1. Reset settings: `electron . --reset-settings`
2. Launch app: `npm run electron:dev`
3. Welcome screen should appear
4. Configure OpenSCAD path and/or API key
5. Welcome screen should not appear on next launch

### Add New LLM Provider

1. Create service file: `src/services/llm/ProviderNameService.ts`
2. Implement `LLMService` interface
3. Add to factory: `src/services/llm/index.ts`
4. Update `PROVIDER_NAMES` and `DEFAULT_MODELS`
5. Add tests if needed

**Example**: See `GeminiService.ts` for reference

### Debug IPC Communication

1. Open DevTools (auto-opens in dev mode)
2. Check Console for errors
3. Check Network tab for IPC calls
4. Add `console.log` in `electron/main.ts` (gated to dev mode)

### Test OpenSCAD Integration

1. Ensure OpenSCAD is installed
2. Configure path in Settings (⚙️ icon)
3. Write test code in editor:
   ```openscad
   cube([10, 10, 10]);
   ```
4. Press `Ctrl+S` or click Render
5. Check preview panel for 3D model

### Test File Operations

1. **Open File**:
   - Click "Open" button or press `Ctrl+O`
   - Select a `.scad` file
   - Verify code loads in editor
   - Verify window title updates with filename
   - Verify chat is cleared

2. **Save File**:
   - Open a file or create new code
   - Click "Save" (only enabled if file is open) or press `Ctrl+S`
   - Verify file saves correctly
   - Verify window title removes `*` indicator

3. **Save As**:
   - Click "Save As" or press `Ctrl+Shift+S`
   - Choose location and filename
   - Verify file saves
   - Verify window title updates

4. **Unsaved Changes**:
   - Modify code in editor
   - Verify `*` appears in window title
   - Try opening new file - should warn about unsaved changes
   - Try creating new file - should warn about unsaved changes

---

## Troubleshooting

### Port 5173 Already in Use

**Error**: `Port 5173 is already in use`

**Solution**: Change port in `vite.config.ts`:
```typescript
server: {
  port: 5174, // Use different port
}
```

### OpenSCAD Not Found

**Error**: `OpenSCAD executable not found`

**Solution**:
1. Open Settings (⚙️ icon)
2. Click "Browse..." next to OpenSCAD path
3. Select `openscad.exe` (Windows) or `openscad` (Linux/Mac)
4. Save settings

### Tests Failing

**Error**: Tests fail with mock errors

**Solution**:
1. Check `src/test/setup.ts` for proper mocks
2. Ensure all Electron API methods are mocked
3. Run: `npm test -- --clearCache`

### Build Errors

**Error**: TypeScript compilation errors

**Solution**:
```bash
# Clean and rebuild
rm -rf dist dist-electron node_modules/.vite
npm install
npm run build
```

### Welcome Screen Not Showing

**Check**:
1. Settings file exists: `~/.torrify/settings.json`
2. OpenSCAD path is configured and valid
3. API key is configured (if required)
4. Reset settings: `electron . --reset-settings`

### Settings Not Persisting

**Check**:
1. Settings file location: `~/.torrify/settings.json`
2. File permissions (should be user-readable only)
3. Check console for save errors
4. Verify IPC communication in DevTools

---

## Environment Variables

### Development

- `VITE_DEV_SERVER_URL` - Set automatically by Vite
- Used to gate console.log statements
- Used to determine if DevTools should open
- `OPENROUTER_API_KEY` - Required for PRO (OpenRouter) access

### Production

- `OPENROUTER_API_KEY` required for PRO (OpenRouter)
- Settings stored in `~/.torrify/settings.json`

---

## IPC API Reference

### Settings

- `get-settings` - Get current settings
- `save-settings` - Save settings
- `check-openscad-path` - Validate OpenSCAD path
- `select-openscad-path` - Open file dialog for OpenSCAD
- `should-show-welcome` - Check if welcome screen should show
- `reset-settings` - Delete settings file (programmatic)
- `get-openrouter-key` - Read `OPENROUTER_API_KEY` from environment

### Rendering

- `render-scad` - Render OpenSCAD to PNG (legacy)
- `render-stl` - Render OpenSCAD to STL (current)

### File Operations

- `open-scad-file` - Open .scad file dialog and load file
- `save-scad-file` - Save .scad file (direct save or Save As dialog)
- `set-window-title` - Update window title with filename
- `get-recent-files` - Load recent files list
- `clear-recent-files` - Clear recent files list
- `remove-recent-file` - Remove a single recent entry
- `open-recent-file` - Open a recent file or project

### Projects

- `save-project` - Save project file (.torrify)
- `load-project` - Load project file
- `export-scad` - Export code as .scad file
- `export-stl` - Export STL file

### Documentation & Knowledge Base
- `load-documentation` - Load docs for Help Bot
- `get-context` - Load API context for a backend
- `get-context-status` - Read context file metadata
- `update-context-from-cloud` - Update context from a URL
- `reset-context-to-factory` - Restore bundled context

### Local LLM
- `get-ollama-models` - Fetch available Ollama models

### Menu Events
- `on-menu-event` - Listen for menu commands
- `remove-menu-listener` - Unsubscribe from menu commands

### Utilities

- `get-temp-dir` - Get temporary directory path

---

## Development Workflow

### Typical Development Session

1. **Start Development**
   ```bash
   npm run electron:dev
   ```

2. **Make Changes**
   - Edit React components in `src/components/`
   - Edit Electron code in `electron/`
   - Hot reload should pick up changes

3. **Test Changes**
   - Manual testing in Electron window
   - Run tests: `npm run test:watch`

4. **Build for Testing**
   ```bash
   npm run build
   npm run electron
   ```

### Testing Welcome Screen Flow

1. **Reset Settings**
   ```bash
   npm run build:electron
   electron . --reset-settings
   ```

2. **Launch App**
   ```bash
   npm run electron:dev
   ```

3. **Verify Welcome Shows**
   - Welcome modal should appear
   - Both OpenSCAD and API key should show as not configured

4. **Configure Settings**
   - Click "Open Settings" or "Configure OpenSCAD Path"
   - Set OpenSCAD path
   - Optionally set API key
   - Save

5. **Verify Welcome Doesn't Show**
   - Close and reopen app
   - Welcome should not appear

---

## File Locations

### Settings File

**Location**: `~/.torrify/settings.json`

**Windows**: `C:\Users\<username>\.torrify\settings.json`  
**Linux/Mac**: `~/.torrify/settings.json`

**Contents**:
```json
{
  "openscadPath": "C:\\Program Files\\OpenSCAD\\openscad.exe",
  "llm": {
    "provider": "gemini",
    "model": "gemini-2.0-flash-exp",
    "apiKey": "",
    "enabled": false,
    "temperature": 0.7,
    "maxTokens": 2048
  }
}
```

### Temporary Files

**Location**: `%TEMP%\torrify\` (Windows) or `/tmp/torrify/` (Linux/Mac)

**Files**:
- `temp_model.scad` - Current OpenSCAD code
- `render_preview.png` - PNG render output (legacy)
- `render_preview.stl` - STL render output (current)

---

## Quick Command Reference

```bash
# Development
npm run electron:dev          # Start dev server + Electron
npm run dev                    # Vite dev server only
npm run build:electron         # Build Electron main process

# Testing
npm test                       # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # With coverage

# Building
npm run build                  # Full production build
npm run package                # Create installer

# Settings
electron . --reset-settings    # Wipe settings (after build)
electron . --wipe-settings     # Alias for --reset-settings
```

---

## Notes

- **Hot Reload**: React components hot reload automatically
- **Electron Reload**: Main process requires restart (run `npm run build:electron`)
- **DevTools**: Auto-opens in development mode
- **Logging**: Console.log only in development (gated by `VITE_DEV_SERVER_URL`)
- **Settings**: Persist across app restarts
- **Welcome Screen**: Only shows if OpenSCAD path or API key is missing
- **File Operations**: File size limit is 10MB for `.scad` files
- **Window Title**: Automatically updates with filename and unsaved changes indicator

---

## Additional Resources

- [Main README](../../README.md) - User-facing documentation
- [HANDOFF.md](../architecture/HANDOFF.md) - Complete project history
- [SECURITY_AUDIT.md](../security/SECURITY_AUDIT.md) - Security documentation
- [TESTING.md](TESTING.md) - Testing guide
- [LLM_INTEGRATION.md](../features/LLM_INTEGRATION.md) - AI integration guide

---

**Last Updated**: January 24, 2026

