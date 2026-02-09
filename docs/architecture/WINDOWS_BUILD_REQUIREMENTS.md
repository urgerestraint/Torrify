# Windows Build Requirements

Building Torrify installers on Windows requires **Developer Mode** to be enabled.

## Why?
The build process uses `electron-builder`, which downloads signing tools that contain symbolic links (created on macOS). Windows requires special privileges to extract these symlinks.

Without Developer Mode, you will see:
> `ERROR: Cannot create symbolic link : A required privilege is not held by the client.`

## How to Enable

1.  Open **Windows Settings** > **Privacy & Security** > **For developers**.
2.  Toggle **Developer Mode** to **ON**.
3.  Restart your terminal/IDE.

## Verification
Run `npm run package:win`. It should complete without symlink errors.

## CI/CD
GitHub Actions Windows runners have Developer Mode enabled by default, so CI builds work automatically.
