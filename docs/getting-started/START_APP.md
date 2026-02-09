# Application Startup Guide

## Running the Installed Application

If you installed Torrify using an installer, follow the platform-specific instructions below.

### Windows (NSIS Installer)

**Launch the Application:**
- **Start Menu**: Search for "Torrify" and click to launch
- **Desktop Shortcut**: Double-click the Torrify icon (if created during install)
- **Direct Path**: Navigate to `C:\Program Files\Torrify\Torrify.exe` (or your custom install location)

**Installation Location:**
- Default: `C:\Program Files\Torrify\`
- User-specified during installation

**Uninstall:**
- Settings → Apps → Torrify → Uninstall
- Or run `C:\Program Files\Torrify\Uninstall Torrify.exe`

**Updates:**
- Download new installer from GitHub Releases
- Run the new installer (it will update the existing installation)

### macOS (DMG)

**Launch the Application:**
- Open **Finder** → **Applications**
- Double-click **Torrify**

**Installation Location:**
- `/Applications/Torrify.app`

**First Launch Security:**
If macOS blocks the app with "cannot be opened because it is from an unidentified developer":
1. Go to **System Preferences** → **Security & Privacy**
2. Click **"Open Anyway"** next to the Torrify message
3. Confirm by clicking **"Open"**

**Uninstall:**
- Drag `Torrify.app` from Applications to Trash
- Delete settings: `rm -rf ~/.torrify`

**Updates:**
- Download new DMG from GitHub Releases
- Replace the old app in Applications with the new one

### Linux (AppImage)

**Launch the Application:**

Option 1 - Direct execution:
```bash
cd ~/Downloads  # or wherever you saved it
chmod +x Torrify-*.AppImage  # First time only
./Torrify-*.AppImage
```

Option 2 - Desktop integration (with AppImageLauncher):
1. Install AppImageLauncher: `sudo apt install appimagelauncher` (Ubuntu/Debian)
2. Double-click the `.AppImage` file
3. Choose "Integrate and run"
4. Torrify will appear in your application menu

**Installation Location:**
- AppImages don't "install" - they run from wherever you place them
- Recommended: `~/Applications/` or `~/bin/`
- With AppImageLauncher: `~/Applications/`

**Uninstall:**
- Delete the `.AppImage` file
- Delete settings: `rm -rf ~/.torrify`

**Updates:**
- Download new AppImage from GitHub Releases
- Replace the old file with the new one
- Make it executable: `chmod +x Torrify-*.AppImage`

### Common Post-Installation Steps (All Platforms)

After launching for the first time:

1. **Configure CAD Backend** (Settings → General):
   - **OpenSCAD**: Point to executable (e.g., `C:\Program Files\OpenSCAD\openscad.exe`)
   - **build123d**: Point to Python executable with build123d installed

2. **Configure AI Provider** (Settings → AI Configuration):
   - Select provider (Gemini, OpenRouter, or Ollama)
   - Enter API key (if using Gemini or OpenRouter)
   - Enable "Enable AI Assistant"

3. **Test the Application**:
   - Try rendering some OpenSCAD code (Ctrl+S)
   - Send a message to the AI assistant
   - Check that the 3D preview works

---

## Running from Source (Development)

If you're developing or building from source, follow these instructions.

### Current Status
✅ Electron files compile to CommonJS (`.cjs`)  
✅ React app files ready  
✅ All dependencies installed  

### Official Startup Sequence

### Method 1: Standard Dev Run (Recommended)

```powershell
cd e:\Torrify
npm run electron:dev
```

This command:
1. Starts Vite
2. Builds Electron main/preload
3. Launches Electron

### Method 2: Manual Step-by-Step (Troubleshooting)

```powershell
cd e:\Torrify

# Step 1: Stop any running instances
# Press Ctrl+C if something is running
# Or close the Electron window

# Step 2: Compile Electron files
npx tsc -p tsconfig.electron.json

# Step 3: Convert to .cjs (required because package.json is type: module)
node rename-electron.cjs

# Step 4: Verify files exist
dir dist-electron

# You should see:
# - main.cjs
# - preload.cjs

# Step 5: Start the app
npm run electron:dev
```

### Method 3: Use NPM Build (Slower but Complete)

```powershell
cd e:\Torrify
npm run build
npm run electron:dev
```

## What to Look For

### 1. In PowerShell/Terminal
You should see:
```
VITE v5.0.10  ready in XXX ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 2. In the UI
- ✅ "AI Assistant" panel (not "AI Not Configured")
- ✅ Code editor works
- ✅ Settings button (⚙️) opens modal
- ✅ Render button works

## If It Still Doesn't Work

### Check 1: Verify File Paths
```powershell
# Check if files exist
Test-Path "e:\Torrify\dist-electron\main.cjs"     # Should be True
Test-Path "e:\Torrify\dist-electron\preload.cjs"  # Should be True

# Check file sizes (should be > 0)
(Get-Item "e:\Torrify\dist-electron\preload.cjs").Length
```

### Check 4: Rebuild from Scratch
```powershell
cd e:\Torrify

# Clean everything
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force dist
Remove-Item -Recurse -Force dist-electron

# Reinstall
npm install

# Rebuild
npm run build

# Start
npm run electron:dev
```

## Common Issues

### Issue: "Cannot find module 'preload.cjs'"

**Cause:** main.cjs is looking for preload.cjs in wrong location

**Fix:** Verify line 91 in `electron/main.ts` says:
```typescript
preload: path.join(__dirname, 'preload.cjs'),
```

### Issue: `window.electronAPI` is undefined

**Cause:** Preload script not executing or not found

**Fix:**
1. Check `tsconfig.electron.json` has correct settings
2. Recompile: `npx tsc -p tsconfig.electron.json`
3. Run: `node rename-electron.cjs`
4. Verify `dist-electron/preload.cjs` exists and has content
4. Restart Electron completely

### Issue: "electronAPI is not defined" in React components

**Cause:** Timing issue - React trying to use API before preload runs

**Fix:** Already handled - App.tsx now checks for electronAPI in useEffect

### Issue: Settings button works but render/chat doesn't

**Cause:** Partial API exposure

**Fix:** Check DevTools console for specific error messages about which functions are missing

## Debug Mode

To see maximum debugging info:

1. Open `electron/main.ts` and add at top of `createWindow()`:
```typescript
mainWindow.webContents.openDevTools({ mode: 'detach' })
```

2. Open `src/App.tsx` - already has debug logging

3. Restart app and watch both:
   - Terminal/PowerShell output
   - DevTools console output

## Success Indicators

✅ Terminal shows Vite server running on port 5173
✅ Electron window opens
✅ No red errors in console
✅ Settings button opens modal
✅ Render button triggers OpenSCAD
✅ AI chat panel shows greeting message

## Next Steps After Successful Start

1. Try rendering: Press Ctrl+S or click "Render" button
2. Try settings: Click ⚙️ icon, verify path shown
3. Try AI: Type "create a sphere" in chat

If all three work, you're good to go! 🎉

---

**Last Updated:** January 24, 2026  
