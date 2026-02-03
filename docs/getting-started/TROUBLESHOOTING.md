# Troubleshooting Guide

This guide covers common issues you might encounter while using Torrify and provides solutions to resolve them.

## Common Issues

### 1. OpenSCAD Not Found
**Error**: "OpenSCAD executable not found" or render failures.

**Cause**: Torrify cannot locate the OpenSCAD executable on your system.

**Solution**:
1. Ensure OpenSCAD is installed. Download it from [openscad.org](https://openscad.org/).
2. Open Torrify Settings (click the gear icon).
3. In the "General" tab, verify the "OpenSCAD Executable Path".
4. If the path is incorrect, browse and select the correct `openscad.exe` (Windows) or `OpenSCAD.app` (macOS).

### 2. Python Not Found for build123d
**Error**: "Python not found" or build123d render failures.

**Cause**: The build123d backend requires a valid Python installation with the `build123d` package installed.

**Solution**:
1. Ensure Python 3.10+ is installed.
2. Install the required package: `pip install build123d`
3. In Torrify Settings → General, verify the "Python Interpreter Path".
4. Ensure the selected Python interpreter has access to the `build123d` library.

### 3. Ollama Connection Issues
**Error**: "Failed to connect to Ollama" or AI response errors.

**Cause**: Ollama is not running or is not accessible at the default address.

**Solution**:
1. Ensure Ollama is installed and running (`ollama serve`).
2. Verify Ollama is accessible at `http://127.0.0.1:11434`.
3. If running in a container or non-standard port, check your network configuration.
4. Ensure no firewall is blocking the connection.

### 4. API Key Configuration
**Error**: "Invalid API Key" or authentication errors.

**Cause**: The API key for Gemini or OpenRouter is missing or incorrect.

**Solution**:
1. Open Settings -> "AI Configuration".
2. Select your provider (Gemini or OpenRouter).
3. Re-enter your API key carefully.
4. Ensure you have not exceeded your quota for the respective service.

### 5. "Render Failed" Errors
**Error**: The 3D preview does not update or shows an error.

**Cause**: The code generated (or written) contains syntax errors that the CAD backend cannot process.

**Solution**:
1. Check the "Chat Panel" or "Editor" for error messages.
2. Review your code for syntax errors (missing semicolons in OpenSCAD, indentation in Python).
3. Try a simpler model to verify the backend is working.
4. Check the logs if you are running in developer mode.

### 6. Performance with Large Models
**Issue**: The application becomes slow or unresponsive when rendering complex models.

**Cause**: Complex CSG operations (unions, differences of many objects) can be computationally expensive.

**Solution**:
1. Simplify your model geometry where possible.
2. Increase the `$fn` value (resolution) only when necessary.
3. In OpenSCAD, use `render()` module to cache geometry.

## Getting Help

If you continue to experience issues, please contact support:

*   **Email**: hello@torrify.org
*   **Issue Tracker**: [GitHub Issues](https://github.com/caseyhartnett/torrify/issues)

## Logs

If you are reporting a bug, providing logs can be helpful.

*   **Windows**: `%APPDATA%\torrify\logs`
*   **macOS**: `~/Library/Logs/torrify`
*   **Linux**: `~/.config/torrify/logs`
