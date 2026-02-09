# Testing Guide

## Overview
Torrify uses **Vitest** for unit and component testing.

*   **Framework**: Vitest
*   **UI Testing**: React Testing Library
*   **Environment**: jsdom

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (recommended)
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Structure

### `src/` (Renderer)
*   **`src/components/__tests__/`**: UI component tests (Chat, Editor, Settings).
*   **`src/services/llm/__tests__/`**: LLM logic and code generation tests.
*   **`src/services/cad/__tests__/`**: Frontend CAD service tests.

### `electron/` (Main)
*   **`electron/__tests__/`**: Backend logic, validation, and CLI wrappers.

## Mocking
The Electron API (`window.electronAPI`) is globally mocked in `src/test/setup.ts`.
To override a mock in a specific test:

```typescript
import { vi } from 'vitest'

it('handles error', async () => {
  window.electronAPI.renderStl = vi.fn().mockRejectedValue(new Error('Failed'))
  // ...
})
```

## Manual Testing Checklist

### Core
- [ ] Launch app (`npm run electron:dev`).
- [ ] Editor loads with default code.
- [ ] Render (`Ctrl+S`) produces a 3D model.

### AI
- [ ] Chat responds (mock or real).
- [ ] Settings > AI Configuration saves correctly.

### File Ops
- [ ] Open/Save file.
- [ ] Verify window title updates.
