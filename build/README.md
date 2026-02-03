# Build Resources

This directory contains resources needed for building installers.

## Icons

The application uses **logo.png** from the project root to generate app icons.

- **icon.png** – Linux AppImage icon (512×512, letterboxed from logo)
- **icon.ico** – Windows installer icon (multi-size)
- **icon.icns** – macOS installer icon (create separately; see below)

### Rectangular logo

If **logo.png** is not square, the script **letterboxes** it: the logo is centered on a transparent square canvas so app icons (taskbar, dock) look correct. The in-app logo (header, modals) uses the original rectangular image from `public/logo.png`.

### Generate icons from logo.png

1. Put **logo.png** in the project root (same folder as `package.json`).
2. Install dependencies (one-time):
   ```bash
   npm install
   ```
   (The icon script uses `sharp` and `png-to-ico` from devDependencies.)
3. Generate icons:
   ```bash
   npm run generate:icons
   ```
   This creates `build/icon.png`, `build/icon-16.png` … `build/icon-256.png`, and **build/icon.ico**.

### macOS .icns

The script does not create **icon.icns**. To get a macOS icon:

- **On macOS:** Use `iconutil` with a `.iconset` made from the PNGs, or use [png2icons](https://www.npmjs.com/package/png2icons).
- **Elsewhere:** Convert `build/icon.png` to `.icns` at [convertio.co/png-icns](https://convertio.co/png-icns/) and save as `build/icon.icns`.

### Manual icons

To use your own icon files:

1. Place **icon.png** (512×512 or 1024×1024), **icon.ico** (Windows), and optionally **icon.icns** (macOS) in this directory.
2. Skip `npm run generate:icons`; the build will use these files.

### No icons (development)

You can build without icons. The build may warn but will complete; the app will use the default Electron icon.

## Other build resources

You can add other assets here (e.g. DMG background, installer graphics, license files).
