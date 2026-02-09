# Troubleshooting

## Common Issues

### OpenSCAD Not Found
**Error**: "OpenSCAD executable not found"
**Solution**:
1.  Install OpenSCAD from [openscad.org](https://openscad.org/).
2.  Go to **Settings > General**.
3.  Update **OpenSCAD Executable Path** to point to your installation (e.g., `C:\Program Files\OpenSCAD\openscad.exe`).

### Python Not Found
**Error**: "Python not found" (when using build123d)
**Solution**:
1.  Install Python 3.10+.
2.  Run `pip install build123d`.
3.  Go to **Settings > General** and verify the **Python Interpreter Path**.

### AI Connection Failed
**Error**: "Failed to connect" or authentication errors.
**Solution**:
1.  **Check API Key**: Verify your key in **Settings > AI Configuration**.
2.  **Ollama**: Ensure `ollama serve` is running and accessible at `http://127.0.0.1:11434`.
3.  **Network**: Check for firewalls or proxy settings blocking the connection.

### Render Failed
**Error**: 3D preview does not update.
**Solution**:
1.  Check the **Editor** for syntax errors.
2.  Check the **Chat Panel** for error messages from the backend.
3.  Try a simple model (e.g., `cube([10,10,10]);`) to verify the backend is working.

## Performance
If rendering is slow:
1.  Reduce `$fn` (resolution) in your SCAD code.
2.  Use `render()` to cache complex geometry in OpenSCAD.
3.  Simplify geometry where possible.

## Support
*   **Email**: [hello@torrify.org](mailto:hello@torrify.org)
*   **Issues**: [GitHub Issues](https://github.com/caseyhartnett/torrify/issues)

## Logs
*   **Windows**: `%APPDATA%\torrify\logs`
*   **macOS**: `~/Library/Logs/torrify`
*   **Linux**: `~/.config/torrify/logs`
