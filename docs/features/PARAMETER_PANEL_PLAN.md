# Parameter Panel (PRO Feature) — Implementation Plan

> **Status:** Planned for future implementation. This document captures the design and work items.

## Demo

The demo below shows the Parameter Panel in action: adjusting model parameters via the UI while the 3D preview updates.

<p align="center">
  <img src="../assets/TorrifyDemo.gif" alt="Parameter panel demo" width="800" />
</p>

## Overview

Add a PRO-only "Parameter Panel" as a tab-toggle alternative to the code editor, gated behind gateway provider authentication. Non-coders can adjust model parameters via sliders, toggles, dropdowns, and text inputs — with live two-way sync to the underlying code and debounced auto-render.

## Context

The existing layout is **Chat (30%) | Editor (40%) | Preview (30%)** in `src/App.tsx`. The code editor lives in `src/components/EditorPanel.tsx`. Both OpenSCAD and build123d backends follow a "Configuration First" convention mandated by the LLM prompts in `src/services/llm/prompts.ts`, where every file begins with a clearly delimited `CONFIGURATION (Editable Parameters)` block:

**OpenSCAD format:**

```
// ==========================================
// CONFIGURATION (Editable Parameters)
// ==========================================
width_mm  = 100; // Total width of the box
wall_thickness_mm = 2.0;
smoothness = $preview ? 32 : 128;
// ==========================================
// IMPLEMENTATION
// ==========================================
```

**build123d format:**

```python
# ==========================================
# CONFIGURATION (Editable Parameters)
# ==========================================
WIDTH_MM = 100.0
WALL_THICKNESS_MM = 2.0
# ==========================================
# IMPLEMENTATION
# ==========================================
```

No parameter parsing logic exists today. The goal is to extract these parameters and present them in a mouse-friendly UI.

---

## PRO Gating Strategy

The Parameter Panel is a **PRO-only feature** gated behind the existing authentication system. The PRO state is determined by two conditions from the app settings:

1. `settings.llm.provider === 'gateway'` (user selected PRO mode)
2. `settings.llm.gatewayLicenseKey?.trim()` is truthy (license key is set)

This follows the same pattern used in `src/components/ChatPanel.tsx` and `src/components/settings/AISettings.tsx`.

**Gating behavior:**

- The "Parameters" tab is always **visible** in the tab bar (discoverability)
- The tab shows a small "PRO" badge next to the label
- When not authenticated as PRO, clicking the tab shows a locked overlay with:
  - A lock icon and "PRO Feature" heading
  - Brief description of what the Parameter Panel does
  - A "Configure PRO" button that opens the Settings modal to the AI tab
- When authenticated as PRO, the tab works normally

---

## Architecture

```
Settings (provider + licenseKey)
        │
        ▼
  useProStatus hook ──► isProAuthenticated
        │
        ▼
┌───────────────────────────────────────────────────────┐
│  Editor Area (40% column)                             │
│  Tab Bar: Code | Parameters (PRO)                     │
│                                                       │
│  Code tab ────────► Monaco Editor                     │
│  Parameters (PRO) ► ParameterPanel OR Locked Overlay  │
└───────────────────────────────────────────────────────┘

Code ──► parameterParser ──► ExtractedParameter[]
                    │
                    ▼
         ParameterPanel (sliders, toggles, inputs)
                    │
                    ▼
         parameterUpdater (string replace)
                    │
                    ▼
         Code ──► debounced 500ms ──► handleRender()
```

---

## Implementation Tasks

### 1. Parameter Parser (`src/services/parameters/parameterParser.ts`)

A pure function that takes a code string and backend type, returns an array of extracted parameters.

**Extraction logic:**

- Find the CONFIGURATION block between the two `=====` separator comment lines
- Parse each assignment line within that block using backend-specific regex patterns
- Detect parameter type from the value:
  - **number**: numeric literal (e.g., `100`, `2.0`, `3.14`) → slider
  - **boolean**: `true`/`false` → toggle switch
  - **string**: quoted value (e.g., `"hex"`) → text input
  - **expression**: anything else (e.g., `$preview ? 32 : 128`) → read-only display (non-editable)
- Extract inline comment as description/label

**Output type:** See `ExtractedParameter` interface in section 2.

**Name-to-display conversion:** `wall_thickness_mm` → "Wall Thickness" with unit "mm"; `FILLET_RADIUS_MM` → "Fillet Radius" with unit "mm".

### 2. Parameter Updater (`src/services/parameters/parameterUpdater.ts`)

A pure function that takes the current code string, a parameter name, and a new value, and returns the updated code string. Uses line number and character offsets from extraction for precise string replacement.

### 3. PRO Status Hook (`src/hooks/useProStatus.ts`)

A reusable hook that checks whether the user is authenticated as PRO.

```typescript
interface ProStatus {
  isProAuthenticated: boolean  // true when provider=gateway AND licenseKey is set
  isLoading: boolean           // true during initial settings fetch
}
```

- Fetches settings via `window.electronAPI.getSettings()` on mount and when `settingsVersion` changes
- Returns `isProAuthenticated = provider === 'gateway' && !!gatewayLicenseKey?.trim()`
- Accepts `settingsVersion` as a dependency so it re-checks when the user saves settings

### 4. Parameter Panel Component (`src/components/ParameterPanel.tsx`)

Renders extracted parameters as interactive controls:

| Parameter Type | UI Control |
|----------------|------------|
| number | Slider + numeric input side-by-side |
| boolean | Toggle switch |
| string | Text input |
| expression | Read-only chip/badge (non-editable) |

**Features:**

- Grouped by sections if comments suggest grouping
- Unit labels displayed next to sliders (e.g., "mm", "deg")
- Slider range heuristic: default to `[0, value * 3]` for positive numbers, override from comment hints like `// [0-500]`
- Numeric input allows precise values beyond slider range
- Empty state: "No parameters detected. Use the Code Editor to add a CONFIGURATION block."

### 5. Tab Toggle in Editor Area (`src/components/EditorPanel.tsx`)

- Add tab bar with two tabs: **Code** and **Parameters (PRO)**
- "Parameters" tab shows PRO badge
- When PRO: show ParameterPanel; when not PRO: show locked overlay
- New props: `isProAuthenticated: boolean`, `onOpenSettings: () => void`

### 6. Integration with App (`src/App.tsx`)

- Derive `isProAuthenticated` via `useProStatus(settingsVersion)`
- Pass `isProAuthenticated` and `onOpenSettings` to EditorPanel
- Add debounced (500ms) auto-render when parameters change via the panel

### 7. Testing

- Parser tests: both OpenSCAD and build123d formats, edge cases
- Updater tests: precise replacement without corrupting code
- Component tests: ParameterPanel controls for each type
- PRO gating tests: locked overlay when not PRO, panel works when PRO

---

## ExtractedParameter Interface

```typescript
interface ExtractedParameter {
  name: string           // e.g. "width_mm"
  displayName: string    // e.g. "Width (mm)" - derived from name
  value: number | boolean | string
  type: 'number' | 'boolean' | 'string' | 'expression'
  rawValue: string       // original text for round-tripping
  comment: string        // inline comment text
  line: number           // 1-based line number in source
  charStart: number      // character offset for precise replacement
  charEnd: number        // end offset
  unit: string | null    // extracted from suffix: "_mm" -> "mm", "_deg" -> "deg"
  min?: number           // optional hint from comment like "[0-500]"
  max?: number           // optional hint from comment like "[0-500]"
}
```

---

## File Summary

**Create:**

- `src/services/parameters/types.ts`
- `src/services/parameters/parameterParser.ts`
- `src/services/parameters/parameterUpdater.ts`
- `src/services/parameters/index.ts`
- `src/hooks/useProStatus.ts`
- `src/components/ParameterPanel.tsx`
- `src/services/parameters/__tests__/parameterParser.test.ts`
- `src/services/parameters/__tests__/parameterUpdater.test.ts`

**Modify:**

- `src/components/EditorPanel.tsx` — tab toggle, PRO badge, ParameterPanel, locked overlay
- `src/App.tsx` — PRO status, props, debounced auto-render
