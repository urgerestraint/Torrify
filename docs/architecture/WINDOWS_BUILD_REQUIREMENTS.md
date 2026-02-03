# Windows Build Requirements

## Developer Mode Requirement

Building Torrify installers on Windows requires **Developer Mode** to be enabled.

## Why Developer Mode is Required

electron-builder downloads signing tools (`winCodeSign-2.6.0.7z`) that contain symbolic links for macOS compatibility. When extracting these archives on Windows, 7-Zip attempts to create symbolic links, which requires special privileges.

### The Error You'll See Without Developer Mode

```
ERROR: Cannot create symbolic link : A required privilege is not held by the client.
C:\Users\...\electron-builder\Cache\winCodeSign\...\darwin\10.12\lib\libcrypto.dylib
```

## How to Enable Developer Mode

### Step-by-Step Instructions

1. **Open Windows Settings**
   - Press `Win + I` or search for "Settings"

2. **Navigate to Developer Settings**
   - Click **Privacy & Security** (left sidebar)
   - Click **For developers**

3. **Enable Developer Mode**
   - Toggle **Developer Mode** to **ON**
   - Confirm any security prompts

4. **Restart Your Tools**
   - Close and reopen PowerShell/Terminal
   - Restart your IDE (VS Code, Cursor, etc.)

5. **Verify**
   ```powershell
   npm run package:win
   ```

### What Developer Mode Does

Developer Mode enables several features useful for software development:
- Creates symbolic links without admin privileges
- Enables device portal for remote debugging
- Allows app installation from any source
- Enables other development features

**Security Note**: Developer Mode is safe for development machines. It's a standard setting used by developers working with tools that require symlinks (Git, Node.js build tools, etc.).

## Alternative Solution (Not Recommended)

If you cannot enable Developer Mode, you can run PowerShell as Administrator:

1. Right-click **PowerShell** or **Windows Terminal**
2. Select **Run as Administrator**
3. Navigate to project: `cd E:\Torrify`
4. Run: `npm run package:win`

**Drawback**: You'll need to use admin privileges every time you build, which is inconvenient and less secure.

## Why CSC_IDENTITY_AUTO_DISCOVERY=false Doesn't Fix This

The `CSC_IDENTITY_AUTO_DISCOVERY=false` environment variable tells electron-builder:
- ❌ NOT to automatically search for code signing certificates
- ✅ BUT it still downloads signing tools "just in case"

electron-builder version 24.13.3 downloads `winCodeSign` regardless of this setting, which contains the problematic macOS symlinks.

## CI/CD Builds

GitHub Actions builds work fine because:
- Linux runners don't have this issue
- macOS runners support symlinks natively
- Windows runners in GitHub Actions have Developer Mode enabled by default

## Platform Build Matrix

| Platform | Must Build On | Special Requirements |
|----------|---------------|---------------------|
| Windows  | Windows only | Developer Mode or Admin |
| macOS    | macOS only | Native Apple tools |
| Linux    | Linux only (or WSL) | Native Linux tools (mksquashfs) |

**Note**: You cannot cross-compile electron apps. Each platform requires its native build tools.

## Building All Platforms

To create installers for all platforms without owning all three OS types:

1. **Use GitHub Actions CI/CD** (recommended):
   - Push to `main` branch
   - Automatic builds run on: `windows-latest`, `macos-latest`, `ubuntu-latest`
   - Download artifacts from GitHub Actions

2. **Use WSL for Linux builds on Windows**:
   ```bash
   wsl --install -d Ubuntu
   # Then in WSL:
   cd /mnt/e/Torrify
   npm install
   npm run package:linux
   ```

## Verification

After enabling Developer Mode, verify with:

```powershell
# Should complete without symlink errors
npm run package:win

# Check output
dir dist-installer
# Should see: Torrify Setup X.X.X.exe
```

## Related Issues

- [electron-builder #6606](https://github.com/electron-userland/electron-builder/issues/6606) - Similar symlink issues
- [electron-builder #4113](https://github.com/electron-userland/electron-builder/issues/4113) - Windows symlink requirements

## Summary

**Before building on Windows:**
1. Enable Developer Mode (Settings → Privacy & Security → For developers)
2. Restart your terminal
3. Run `npm run package:win`

That's it! This is a one-time setup per Windows machine.
