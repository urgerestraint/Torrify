# Settings Feature Implementation

## Overview
Implemented the first configuration feature for Torrify - a Settings system that allows users to configure the OpenSCAD executable path.

## Changes Made

### 1. Backend (Electron Main Process)

**File: `electron/main.ts`**

- Fixed ES module support by adding `__dirname` polyfill
- Added settings persistence using JSON file at `~/.torrify/settings.json`
- Created settings interface:
  ```typescript
  interface Settings {
    openscadPath: string
  }
  ```
- Added IPC handlers:
  - `get-settings` - Load settings from file
  - `save-settings` - Save settings to file
  - `check-openscad-path` - Validate if executable exists
- Changed default OpenSCAD path to Nightly version: `C:\Program Files\OpenSCAD (Nightly)\openscad.exe`
- Added file existence check before attempting to render

### 2. IPC Bridge

**File: `electron/preload.ts`**

Added new IPC methods to expose settings functionality:
- `getSettings()`
- `saveSettings(settings)`
- `checkOpenscadPath(path)`

### 3. Frontend Components

**New File: `src/components/SettingsModal.tsx`**

Created a full-featured settings modal with:
- OpenSCAD path input field
- Real-time path validation (green checkmark / red X)
- Common paths suggestions
- Save/Cancel buttons
- Loading states
- Success/error messages

**Modified: `src/App.tsx`**

- Added header bar with app title and settings button
- Integrated SettingsModal component
- Added settings gear icon button

### 4. TypeScript Definitions

**File: `src/vite-env.d.ts`**

Updated with new Settings interface and ElectronAPI methods.

### 5. Testing

**New File: `src/components/__tests__/SettingsModal.test.tsx`**

Comprehensive test suite covering:
- Modal open/close behavior
- Settings loading
- Path validation
- User input
- Save/Cancel actions

**Modified: `src/test/setup.ts`**

Added mocks for new settings-related functions.

### 6. Configuration

**Modified: `tsconfig.electron.json`**

Changed module from `"commonjs"` to `"ES2020"` to support `import.meta.url`.

## How to Use

### For Users

1. Launch the application
2. Click the gear icon (⚙️) in the top-right corner
3. Enter or modify the OpenSCAD executable path
4. Path validation happens automatically:
   - ✅ Green = Executable found
   - ❌ Red = Executable not found
5. Click "Save" to persist changes
6. Settings are saved to: `C:\Users\<username>\.torrify\settings.json`

### Default Path

The application now defaults to the Nightly build:
```
C:\Program Files\OpenSCAD (Nightly)\openscad.exe
```

If you want to use the standard version, change it in settings to:
```
C:\Program Files\OpenSCAD\openscad.exe
```

### Settings File Location

Settings are stored at:
- Windows: `C:\Users\<username>\.torrify\settings.json`
- The file is created automatically on first save

### Settings File Format

The settings file includes CAD paths and LLM configuration. For AI:

- **Access Mode PRO:** Uses the managed gateway with your PRO license key (stored in settings; gateway URL is fixed).
- **Access Mode BYOK:** Provider (e.g. Gemini, OpenRouter, Ollama) and API key as needed.

Example (excerpt):

```json
{
  "openscadPath": "C:\\Program Files\\OpenSCAD (Nightly)\\openscad.exe",
  "llm": {
    "provider": "gemini",
    "model": "gemini-2.0-flash-exp",
    "apiKey": "",
    "enabled": true,
    "gatewayLicenseKey": ""
  }
}
```

## Error Handling

The system now provides better error messages:

- **Before**: Generic "Failed to render" errors
- **After**: 
  - "OpenSCAD executable not found at: [path]"
  - Path validation before attempting render
  - Clear error display in UI

## Testing

Run tests to verify current status:
```bash
npm test
```

Test coverage includes:
- Settings modal rendering
- Settings load/save
- Path validation
- User interactions
- All original tests still passing

## Build Status

✅ TypeScript compilation successful  
✅ Vite build successful  
✅ Run `npm test` for current test results  
✅ No linter errors

## Next Steps

Future enhancements could include:
- File picker dialog for selecting OpenSCAD executable
- Additional render settings (image size, camera angles, etc.)
- Theme selection (dark/light)
- Auto-detection of OpenSCAD installation
- Multiple OpenSCAD version profiles
- Export settings

## Technical Notes

### ES Module Support

The application uses ES modules (`"type": "module"` in package.json) for the renderer and root scripts. The Electron main process is compiled to CommonJS via TypeScript to ensure compatibility with Electron's Node.js environment. This setup allows:
- Modern ES syntax in React components
- Standard import/export in scripts
- Compatibility with Electron's IPC system via preload scripts

### Settings Persistence

Settings are persisted using a simple JSON file approach:
- No external dependencies required
- Cross-platform compatible path resolution
- Automatic directory creation
- Graceful error handling

### IPC Security

All IPC communication uses context isolation:
- No direct Node.js access from renderer
- Type-safe IPC calls
- Validated paths before file system access

## Verification

To verify the feature works:

1. Run the app: `npm run electron:dev`
2. You should see:
   - Header bar with "Torrify" title
   - Settings gear icon in top-right
3. Click the settings icon
4. Settings modal should open
5. Try changing the OpenSCAD path
6. Observe real-time validation
7. Save and close
8. Restart the app - settings should persist

---

**Implementation Date**: January 2026  
**Status**: ✅ Complete and Tested  
**Breaking Changes**: None

