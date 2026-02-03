# Quick Start Guide - Torrify

Get Torrify up and running in 5 minutes!

## Choose Your Installation Method

### Option A: Using Installers (Recommended for End Users)

Download and install Torrify without needing Node.js or build tools. See [Using the Installer](#using-the-installer) below.

### Option B: Build from Source (For Developers)

Build and run Torrify from source code. See [Building from Source](#building-from-source) below.

---

## Using the Installer

Perfect if you just want to use Torrify without setting up a development environment.

### Prerequisites

- **OpenSCAD** (for OpenSCAD backend) - [Download](https://openscad.org/downloads.html)
- **Python 3.x + build123d** (for build123d backend) - `pip install build123d`

### Installation Steps

#### Windows

1. **Download** the latest `.exe` installer from [GitHub Releases](https://github.com/caseyhartnett/torrify/releases)
2. **Run** the installer
3. **Follow** the setup wizard:
   - Choose installation directory (default: `C:\Program Files\Torrify`)
   - Select "Create desktop shortcut" if desired
   - Select "Create start menu shortcut"
4. **Launch** Torrify from:
   - Start Menu → Torrify
   - Desktop shortcut (if created)
   - Or navigate to installation directory

#### macOS

1. **Download** the latest `.dmg` file from [GitHub Releases](https://github.com/caseyhartnett/torrify/releases)
2. **Open** the DMG file
3. **Drag** Torrify to your Applications folder
4. **Launch** from Applications
5. **If you see a security warning**:
   - Go to System Preferences → Security & Privacy
   - Click "Open Anyway" for Torrify

#### Linux

1. **Download** the latest `.AppImage` from [GitHub Releases](https://github.com/caseyhartnett/torrify/releases)
2. **Make it executable**:
   ```bash
   chmod +x Torrify-*.AppImage
   ```
3. **Run** it:
   ```bash
   ./Torrify-*.AppImage
   ```
4. **Optional**: Install AppImageLauncher for better desktop integration

### First Run Configuration

When you first launch Torrify:

1. The Welcome dialog will appear
2. Configure your CAD backend path:
   - For **OpenSCAD**: Point to `openscad.exe` (usually `C:\Program Files\OpenSCAD\openscad.exe`)
   - For **build123d**: Point to your Python executable with build123d installed
3. Configure your AI provider (optional):
   - Select Google Gemini, OpenRouter, or Ollama
   - Enter your API key (Gemini/OpenRouter) or Ollama URL
4. Click "Save" and start creating!

### Next Steps After Installation

Jump to [First Test](#first-test) to start using Torrify!

---

## Building from Source

Perfect for developers who want to modify Torrify or contribute to the project.

### Prerequisites Check

Before starting, ensure you have:

1. **Node.js 18+** installed
   ```powershell
   node --version
   # Should output v18.x.x or higher
   ```

2. **OpenSCAD** installed at default location
   ```powershell
   Test-Path "C:\Program Files\OpenSCAD\openscad.exe"
   # Should output: True
   ```

If OpenSCAD is not found, download it from: https://openscad.org/downloads.html

### Installation Steps

### 1. Navigate to Project Directory

```powershell
cd e:\Torrify
```

### 2. Install Dependencies

```powershell
npm install
```

This will install approximately 1,500 packages (~300 MB). It may take 2-5 minutes.

### 3. Verify Installation

```powershell
npm test
```

All tests should pass. You should see output like:

```
✓ src/App.test.tsx (2)
✓ src/components/__tests__/ChatPanel.test.tsx (7)
✓ src/components/__tests__/EditorPanel.test.tsx (4)
✓ src/components/__tests__/PreviewPanel.test.tsx (7)

Test Files  4 passed (4)
     Tests  20 passed (20)
```

## Running the Application

### Development Mode (Recommended)

```powershell
npm run electron:dev
```

This will:
1. Start Vite dev server (takes ~5 seconds)
2. Launch Electron window automatically
3. Open DevTools for debugging
4. Enable hot reload for code changes

**The application window should appear within 10-15 seconds.**

### What You Should See

When the application launches, you should see:

```
┌─────────────────────────────────────────────────────────┐
│  Chat Assistant  │  Code Editor    │  Render Preview   │
│                  │                 │                   │
│  [Chat UI]       │  [Monaco]       │  [No preview yet] │
│                  │  cube([10,      │                   │
│  [Input box]     │     10, 10]);   │  [Refresh button] │
│  [Send button]   │  [Render btn]   │                   │
└─────────────────────────────────────────────────────────┘
```

## First Test

### Test the Render Feature

1. The editor should already contain: `cube([10, 10, 10]);`
2. Press **Ctrl+S** or click **"Render"**
3. Wait 2-3 seconds
4. A white cube should appear in the preview panel

### Test the Chat Feature

1. In the left panel, type: `Create a simple box with a hole in the center`
2. Press Enter or click Send
3. The AI will generate code and apply it to the editor
4. Press **Ctrl+S** to render the result

## Three Ways to Use Torrify

### 1. Chat Directly with AI
Simply describe what you want to build:
- "Create a mounting bracket with 4 screw holes"
- "Make a box with rounded corners, 50mm x 30mm x 20mm"
- "Design a phone stand with adjustable angle"

### 2. Send a 3D Snapshot to AI
Iterate on existing models:
1. Write or load CAD code
2. Render with **Ctrl+S**
3. Click **"Send to AI"** in the Preview panel
4. Describe changes: "Add ventilation slots to the top"

### 3. Attach Reference Images
Start from photos of real objects:
1. Click the **📎 paperclip button** in the Chat input
2. Select your reference image(s)
3. Describe what you need: "Create a cover plate for this hole"
4. Include a ruler in photos for accurate dimensions!

## Troubleshooting

### Problem: "OpenSCAD not found" error

**Solution:**

1. Verify OpenSCAD installation:
   ```powershell
   Test-Path "C:\Program Files\OpenSCAD\openscad.exe"
   ```

2. If installed elsewhere, set the path in the app:
   - Open Torrify → Settings (⚙️) → General → OpenSCAD Executable Path
   - Browse or type the path to `openscad.exe` (e.g. `C:\Program Files\OpenSCAD\openscad.exe`)
   - Save

3. Restart the application if it was already running

### Problem: Port 5173 already in use

**Solution:**

Edit `vite.config.ts` and change the port:

```typescript
server: {
  port: 5174, // Use any available port
}
```

### Problem: Application won't start

**Solution:**

1. Delete node_modules and reinstall:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

2. Clear build artifacts:
   ```powershell
   Remove-Item -Recurse -Force dist, dist-electron
   ```

3. Try again:
   ```powershell
   npm run electron:dev
   ```

### Problem: Tests failing

**Solution:**

1. Ensure you're using Node.js 18+:
   ```powershell
   node --version
   ```

2. Reinstall dependencies:
   ```powershell
   npm install
   ```

3. Run tests with verbose output:
   ```powershell
   npm test -- --reporter=verbose
   ```

### Problem: Blank white screen

**Solution:**

1. Check the DevTools console for errors (press F12)
2. Verify all dependencies installed correctly
3. Try a hard refresh: Ctrl+Shift+R

## Development Workflow

### Making Code Changes

1. **Edit files** in `src/` directory
2. **Save** the file (Ctrl+S)
3. **Wait** for hot reload (~1-2 seconds)
4. Changes appear automatically in the Electron window

### Running Tests While Developing

In a separate terminal:

```powershell
npm run test:watch
```

Tests will re-run automatically when you save files.

### Building for Production

**Important**: Each platform must be built on that OS (no cross-compilation)

```powershell
# Build the application
npm run build

# Create distributable installers (must be on target OS)
npm run package          # Build for current platform only
npm run package:win      # Windows only (requires Developer Mode)
npm run package:mac      # macOS only
npm run package:linux    # Linux only (or WSL)
```

Output will be in `dist-installer/` directory.

**Platform Requirements**:
- **Windows**: Enable Developer Mode (Settings → Privacy & Security → For developers)
- **macOS**: Must have macOS (uses Apple tools)
- **Linux**: Must have Linux or WSL (uses mksquashfs)

**Build All Platforms**: Use GitHub Actions CI/CD (tests + builds) by pushing to `main`; download installers from Actions artifacts. Tag `release` to run a release-candidate build.

## Next Steps

### Try These Examples

Replace the code in the editor and render:

**Sphere:**
```openscad
sphere(r=10, $fn=100);
```

**Cylinder:**
```openscad
cylinder(h=20, r=5, $fn=50);
```

**Combined Shapes:**
```openscad
difference() {
    cube([20, 20, 20], center=true);
    sphere(r=12, $fn=50);
}
```

### Explore the Code

Key files to understand:
- `src/App.tsx` - Main application layout
- `electron/main.ts` - OpenSCAD integration
- `src/components/EditorPanel.tsx` - Monaco editor setup
- `src/components/PreviewPanel.tsx` - Render display

### Read the Documentation

- `README.md` - Comprehensive documentation
- `TESTING.md` - Testing guide
- `electron/main.ts` - Comments explain OpenSCAD integration

## Command Reference

```powershell
# Development
npm run electron:dev    # Run app in dev mode
npm run dev            # Run Vite dev server only

# Testing
npm test               # Run tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report

# Building
npm run build          # Build for production
npm run package        # Create distributable
npm run preview        # Preview production build

# Electron
npm run electron       # Run Electron (after build)
```

## Getting Help

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review `README.md` for detailed information
3. Check the DevTools console for errors (F12)
4. Review `TESTING.md` for testing-specific issues

## Success Checklist

- [x] Node.js 18+ installed
- [x] CAD backend installed (OpenSCAD or Python + build123d)
- [x] Dependencies installed (`npm install`)
- [x] Tests passing (`npm test`)
- [x] Application launches (`npm run electron:dev`)
- [x] Can edit code in Monaco editor
- [x] Can render CAD code (Ctrl+S)
- [x] Can see rendered 3D preview
- [x] Can send chat messages to AI
- [x] Can attach images with 📎 button
- [x] Can send 3D snapshot to AI
- [x] No console errors

**Congratulations! Torrify is ready to use!**

**Remember the three ways to start:**
1. **Chat directly** - describe what you want to build
2. **Send a snapshot** - iterate on existing models
3. **Attach images** - model from reference photos

