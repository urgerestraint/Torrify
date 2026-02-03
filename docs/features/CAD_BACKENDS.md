# Multi-Backend CAD Support

**Status**: ✅ Implemented (January 24, 2026)  
**Version**: 0.9.2

---

## Overview

Torrify now supports multiple CAD backends, allowing users to choose between **OpenSCAD** (the traditional approach) and **build123d** (Python-based CAD). This feature enables flexibility for users with different preferences and workflows.

---

## Supported Backends

### OpenSCAD (Default)

- **Language**: OpenSCAD DSL (displayed as C syntax in editor)
- **File Extension**: `.scad`
- **Executable**: Requires OpenSCAD CLI installed
- **Strengths**: Declarative modeling, lightweight, well-documented

### build123d (Python)

- **Language**: Python
- **File Extension**: `.py`
- **Requirements**: Python interpreter + build123d library
- **Strengths**: Full Python ecosystem, Open CASCADE-based, flexible

---

## Configuration

### Settings UI

1. Open Settings (⚙️ button)
2. Go to "General" tab
3. Select "CAD Backend" dropdown:
   - **OpenSCAD** - Traditional OpenSCAD modeling
   - **build123d (Python)** - Python-based CAD with build123d

### Backend-Specific Configuration

#### OpenSCAD

- **OpenSCAD Executable Path**: Path to the OpenSCAD executable
- Validation: Checks if executable exists
- Common paths provided as hints

#### build123d

- **Python Interpreter Path**: Path to Python executable (default: `python`)
- Validation: Checks if Python is available and build123d is installed
- Installation hint: `pip install build123d`

---

## Usage

### Editor Integration

- Editor language automatically switches based on backend:
  - OpenSCAD: C-style syntax highlighting
  - build123d: Python syntax highlighting
- Editor tab size adjusts (2 for OpenSCAD, 4 for Python)

### AI Assistant Integration

- AI prompts automatically adapt to the selected backend
- OpenSCAD backend: AI provides OpenSCAD-specific guidance
- build123d backend: AI provides Python/build123d-specific guidance
- Code extraction handles both `<openscad>` and `<python>` tags

### Rendering

Both backends output STL files for the interactive 3D preview:

#### OpenSCAD Rendering
1. Code saved to temp `.scad` file
2. OpenSCAD CLI generates STL
3. STL loaded into Three.js viewer

#### build123d Rendering
1. Python code wrapped with auto-export script
2. Script executed with Python interpreter
3. Geometry auto-detected and exported to STL
4. STL loaded into Three.js viewer

---

## Backend Switching Quirks (Important)

OpenSCAD and build123d are **not code-compatible**. They have different languages, APIs, and modeling paradigms.

When you switch backends:

- The editor **does not convert** your current code.
- The same file will not run in the other backend without manual translation.
- Rendering failures after switching are expected until the code matches the selected backend.
- The file extension changes (`.scad` vs `.py`), so Save/Save As will use a different default.

**Recommended workflow when switching**:

1. Save your current file in its native backend format.
2. Switch backend in Settings.
3. Start a new file or ask the AI to translate the model.
4. Render and validate before continuing edits.

---

## build123d Auto-Export

The build123d service wraps user code to automatically find and export geometry:

```python
# User code is indented and executed
from build123d import *

# Parameters
width = 10
height = 20

# Create geometry
box = Box(width, height, width)
result = box

# Auto-detection looks for variables: result, part, model, obj, shape, solid, box, cylinder, sphere
# Or any object with build123d geometry properties
```

**Supported Patterns**:
- Algebra mode: Direct object creation (`box = Box(10, 10, 10)`)
- Builder mode: Context managers (`with BuildPart() as part: ...`)
- Named variables: `result`, `part`, `model`, `obj`, `shape`, `solid`, `box`, `cylinder`, `sphere`

---

## Architecture

### Service Layer

```
src/services/cad/
├── types.ts          # CADBackend type, BACKEND_INFO metadata
└── index.ts          # Factory helpers, BACKEND_NAMES

electron/cad/
├── types.ts          # Main process types
├── index.ts          # createCADService() factory
├── OpenSCADService.ts  # OpenSCAD CLI integration
└── Build123dService.ts # Python/build123d execution
```

### CADService Interface

```typescript
interface CADService {
  renderStl(code: string): Promise<CADRenderResult>
  validateSetup(): Promise<CADValidationResult>
  getBackendName(): string
  getFileExtension(): string
  getLanguage(): string
}
```

### Settings Interface

```typescript
interface Settings {
  cadBackend: 'openscad' | 'build123d'
  openscadPath: string
  build123dPythonPath: string
  llm: LLMConfig
  // ... other settings
}
```

---

## IPC Handlers

| Handler | Purpose |
|---------|---------|
| `render-stl` | Renders code using current backend |
| `validate-cad-backend` | Validates backend configuration |
| `check-python-path` | Checks Python interpreter availability |

---

## Troubleshooting

### OpenSCAD Issues

| Problem | Solution |
|---------|----------|
| "OpenSCAD executable not found" | Configure correct path in Settings |
| "Execution timed out" | Simplify model or increase timeout |
| "Render failed" | Check OpenSCAD syntax errors |

### build123d Issues

| Problem | Solution |
|---------|----------|
| "Python not found" | Install Python and configure path |
| "build123d is not installed" | Run `pip install build123d` |
| "No exportable geometry found" | Assign geometry to `result`, `part`, or `model` variable |
| "Python execution timed out" | Simplify model (60s timeout for Python) |

---

## Adding New Backends

To add a new CAD backend:

1. **Create Service Class** in `electron/cad/`:
   ```typescript
   export class NewBackendService implements CADService {
     async renderStl(code: string): Promise<CADRenderResult> { ... }
     async validateSetup(): Promise<CADValidationResult> { ... }
     getBackendName(): string { return 'New Backend' }
     getFileExtension(): string { return 'ext' }
     getLanguage(): string { return 'language' }
   }
   ```

2. **Update Factory** in `electron/cad/index.ts`:
   ```typescript
   case 'newbackend':
     return new NewBackendService(config.newbackendPath)
   ```

3. **Update Types**:
   - Add to `CADBackend` type
   - Add to `BACKEND_INFO` and `BACKEND_NAMES`
   - Update `Settings` interface

4. **Update UI**:
   - Add configuration fields to SettingsModal
   - Add validation logic

5. **Update AI Prompts**:
   - Add backend-specific system prompt
   - Update code extraction patterns

---

## Testing

### Unit Tests

```bash
npm test -- --grep "CAD"
```

Test files:
- `src/services/cad/__tests__/cad.test.ts` - Type and metadata tests
- `src/components/__tests__/EditorPanel.backend.test.tsx` - Language switching
- `src/components/__tests__/SettingsModal.backend.test.tsx` - UI tests

### Manual Testing

1. **OpenSCAD**:
   - Select OpenSCAD backend
   - Write: `cube([10, 10, 10]);`
   - Click Render
   - Verify 3D preview shows cube

2. **build123d**:
   - Install: `pip install build123d`
   - Select build123d backend
   - Write: `from build123d import *\nbox = Box(10, 10, 10)\nresult = box`
   - Click Render
   - Verify 3D preview shows box

---

## Related Documentation

- [Settings Feature](SETTINGS_FEATURE.md) - Configuration system
- [LLM Integration](LLM_INTEGRATION.md) - AI assistant integration
- [Architecture Handoff](../architecture/HANDOFF.md) - Technical details

