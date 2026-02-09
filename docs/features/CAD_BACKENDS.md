# Multi-Backend CAD Support

Torrify supports two distinct CAD engines. You can switch between them in **Settings > General**.

## Supported Backends

### 1. OpenSCAD (Default)
*   **Language**: OpenSCAD DSL (C-style syntax).
*   **Extension**: `.scad`
*   **Requirement**: OpenSCAD installed on your system.
*   **Best For**: Traditional declarative modeling, wide community support.

### 2. build123d (Python)
*   **Language**: Python.
*   **Extension**: `.py`
*   **Requirement**: Python 3.10+ with `build123d` installed (`pip install build123d`).
*   **Best For**: Powerful programmatic modeling, Python ecosystem integration.

## Configuration

### OpenSCAD Setup
1.  Install OpenSCAD.
2.  In Torrify **Settings**, set **OpenSCAD Executable Path** (e.g., `C:\Program Files\OpenSCAD\openscad.exe`).

### build123d Setup
1.  Install Python 3.10+.
2.  Install the library: `pip install build123d`.
3.  In Torrify **Settings**, set **Python Interpreter Path** (e.g., `python` or full path to python executable).

## Usage & Behavior

### Switching Backends
> ⚠️ **Important:** Code is **NOT** automatically translated when you switch backends.
> OpenSCAD code (`.scad`) will not work in the build123d engine, and Python code (`.py`) will not work in OpenSCAD.

When you switch backends:
1.  **Editor Language**: Updates syntax highlighting (C-style vs Python).
2.  **File Extension**: Default save extension changes (`.scad` vs `.py`).
3.  **Code Compatibility**: You must write code valid for the selected backend.


### build123d Auto-Export
Torrify automatically detects geometry in your Python script and exports it. You do not need to write explicit export code.
Supported patterns:
*   `result = Box(10, 10, 10)`
*   `part = BuildPart(...)`
*   Variables named: `result`, `part`, `model`, `obj`, `shape`, `solid`, `box`, `cylinder`, `sphere`.
