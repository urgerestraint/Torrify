# Testing Guide for Torrify

This document provides comprehensive testing information for the Torrify application.

## Table of Contents

1. [Test Setup](#test-setup)
2. [Running Tests](#running-tests)
3. [Test Structure](#test-structure)
4. [Writing Tests](#writing-tests)
5. [Manual Testing](#manual-testing)
6. [Continuous Integration](#continuous-integration)

## Test Setup

The project uses the following testing stack:

- **Vitest**: Fast unit test framework (Vite-native)
- **React Testing Library**: Component testing utilities
- **jsdom**: Browser environment simulation
- **@testing-library/user-event**: User interaction simulation
- **@vitest/coverage-v8**: Code coverage reporting

### Installation

All testing dependencies are included in `package.json`. Install them with:

```bash
npm install
```

## Running Tests

### Run all tests once

```bash
npm test
```

Or run once without watch (CI-friendly):

```bash
npm test -- --run
```

LLM tests include the gateway (PRO) and OpenRouter (BYOK) providers; see `src/services/llm/__tests__/`.

### Run tests in watch mode (recommended for development)

```bash
npm run test:watch
```

This will:
- Re-run tests automatically when files change
- Show only failed tests after initial run
- Provide an interactive CLI for filtering tests

### Generate coverage report

```bash
npm run test:coverage
```

Coverage reports are generated in:
- Terminal output (summary)
- `coverage/` directory (detailed HTML report)

Open `coverage/index.html` in a browser to view the detailed report.

## Test Structure

```
electron/
├── __tests__/
│   ├── pathValidator.test.ts
│   ├── validation.test.ts
│   ├── projectValidation.test.ts   # Project save/load structure validation
│   ├── OpenSCADService.test.ts     # CAD service (mocked spawn/fs)
│   ├── Build123dService.test.ts    # CAD service (mocked spawn/fs)
│   └── cadFactory.test.ts          # createCADService, BACKEND_NAMES
src/
├── test/
│   └── setup.ts              # Test configuration and global mocks
├── hooks/
│   └── __tests__/
│       ├── useFileOperations.test.ts
│       ├── useRecentFiles.test.ts
│       ├── useDemo.test.ts
│       └── useMenuHandlers.test.ts
├── components/
│   ├── __tests__/
│   │   ├── ChatPanel.test.tsx
│   │   ├── DemoDialog.test.tsx
│   │   ├── EditorPanel.test.tsx
│   │   ├── EditorPanel.backend.test.tsx
│   │   ├── HelpBot.test.tsx
│   │   ├── PreviewPanel.test.tsx
│   │   ├── SettingsModal.test.tsx
│   │   ├── SettingsModal.backend.test.tsx
│   │   ├── StlViewer.test.tsx
│   │   ├── WelcomeModal.test.tsx
│   │   ├── ErrorBoundary.test.tsx
│   │   └── ConfirmDialog.test.tsx
│   ├── settings/
│   │   └── __tests__/
│   │       ├── GeneralSettings.test.tsx
│   │       ├── AISettings.test.tsx
│   │       └── KnowledgeSettings.test.tsx
├── services/
│   ├── cad/__tests__/cad.test.ts
│   │   └── backend-connectivity.test.ts
│   └── llm/__tests__/
│       ├── code-generation.test.ts
│       ├── prompts.test.ts
│       ├── GatewayService.test.ts
│       ├── GeminiService.test.ts
│       ├── OpenRouterService.test.ts
│       ├── OllamaService.test.ts
│       ├── utils.test.ts
│       └── index.test.ts
└── App.test.tsx
```

## Test Coverage

Current test coverage includes:

### App.test.tsx
- ✅ All three panels render correctly
- ✅ Initial state is displayed
- ✅ Component integration

### ChatPanel.test.tsx
- ✅ Chat interface renders
- ✅ Initial welcome message displays
- ✅ User can type messages
- ✅ Messages send on button click
- ✅ Messages send on Enter key
- ✅ Mocked AI responses appear (test environment)
- ✅ Empty messages are rejected

### EditorPanel.test.tsx
- ✅ Editor panel renders
- ✅ Render button is displayed
- ✅ Render button triggers callback
- ✅ Ctrl+S keyboard shortcut works

### PreviewPanel.test.tsx
- ✅ Preview panel renders
- ✅ "No preview" state displays
- ✅ Loading state displays
- ✅ Error messages display
- ✅ Rendered images display
- ✅ Refresh button behavior
- ✅ Button disable state during render

### LLM Code Generation Suite

See `src/services/llm/__tests__/README.md` for prompt coverage and real API testing options.

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event'

it('handles button click', async () => {
  const user = userEvent.setup()
  const mockFn = vi.fn()
  
  render(<MyComponent onClick={mockFn} />)
  
  const button = screen.getByRole('button')
  await user.click(button)
  
  expect(mockFn).toHaveBeenCalled()
})
```

### Testing Async Behavior

```typescript
import { waitFor } from '@testing-library/react'

it('displays data after loading', async () => {
  render(<MyComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument()
  })
})
```

### Mocking Electron API

The Electron API is globally mocked in `src/test/setup.ts`:

```typescript
global.window.electronAPI = {
  renderScad: vi.fn().mockResolvedValue({
    success: true,
    image: 'data:image/png;base64,mockData',
    timestamp: Date.now(),
  }),
  getTempDir: vi.fn().mockResolvedValue('C:\\temp\\torrify'),
}
```

You can override mocks in specific tests:

```typescript
import { vi } from 'vitest'

it('handles render error', async () => {
  window.electronAPI.renderScad = vi.fn().mockRejectedValue(
    new Error('OpenSCAD not found')
  )
  
  // ... test error handling
})
```

## Manual Testing

### Manual Release Testing Checklist

#### Installation & Startup
- [ ] Fresh install completes without errors
- [ ] Application launches successfully
- [ ] All dependencies are correctly loaded
- [ ] No console errors on startup

#### User Interface
- [ ] All three panels are visible and properly sized
- [ ] Panel borders and dividers render correctly
- [ ] Dark theme is applied consistently
- [ ] Text is readable in all panels
- [ ] Scrollbars work correctly

#### Code Editor
- [ ] Monaco editor loads successfully
- [ ] Default code is displayed: `cube([10, 10, 10]);`
- [ ] User can type and edit code
- [ ] Syntax highlighting works (using C language)
- [ ] Line numbers are displayed
- [ ] Render button is visible and clickable
- [ ] Ctrl+S shortcut triggers render

#### Rendering
- [ ] Render button starts the render process
- [ ] Loading state displays during render
- [ ] Rendered image appears in preview panel
- [ ] Multiple renders work consecutively
- [ ] Invalid OpenSCAD code shows error message
- [ ] Error message includes helpful information

#### Preview Panel
- [ ] "No preview yet" message shows initially
- [ ] Refresh button works correctly
- [ ] Images scale properly to fit panel
- [ ] Button disables during rendering
- [ ] Error states display with icon

#### Chat Interface
- [ ] Welcome message displays on load
- [ ] User can type in input field
- [ ] Send button sends message
- [ ] Enter key sends message
- [ ] Shift+Enter creates new line (doesn't send)
- [ ] Empty messages are not sent
- [ ] AI response appears (streaming if enabled)
- [ ] Stop streaming button cancels response
- [ ] Image attachments display in chat
- [ ] Messages scroll to bottom automatically
- [ ] Timestamps display correctly

#### OpenSCAD Integration
- [ ] OpenSCAD executable is found
- [ ] Temporary files are created correctly
- [ ] Renders complete successfully
- [ ] Error messages are descriptive

### Test Scenarios

#### Scenario 1: First Time User
1. Launch application
2. Observe default code in editor
3. Click "Render" or press Ctrl+S
4. Verify cube renders in preview
5. Type message in chat
6. Verify AI response appears (streaming if enabled)

#### Scenario 2: Code Editing
1. Clear default code
2. Type: `sphere(r=10, $fn=100);`
3. Render the code
4. Verify sphere appears
5. Edit radius to 20
6. Re-render
7. Verify larger sphere

#### Scenario 3: Error Handling
1. Type invalid code: `this is not valid code`
2. Attempt to render
3. Verify error message displays
4. Verify error message is helpful
5. Fix the code
6. Verify render works again

#### Scenario 4: Chat Interaction
1. Type several messages rapidly
2. Verify all messages appear
3. Verify all bot responses appear
4. Verify messages maintain correct order
5. Scroll to verify history works

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: windows-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Generate coverage
      run: npm run test:coverage
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## Troubleshooting Tests

### Monaco Editor Not Loading
Monaco editor is not fully tested in unit tests as it requires complex setup. Focus on testing the component's props and callbacks instead.

### Timeouts in Async Tests
Increase the timeout in `waitFor`:

```typescript
await waitFor(() => {
  expect(screen.getByText('...')).toBeInTheDocument()
}, { timeout: 3000 })
```

### Coverage Not Generated
Ensure you have the coverage package installed:

```bash
npm install -D @vitest/coverage-v8
```

### Tests Pass Locally but Fail in CI
- Check Node.js version matches
- Verify all dependencies are installed
- Look for timing issues in async tests
- Check for environment-specific code

## Future Testing Goals

- [ ] Add E2E tests with Playwright or Spectron
- [ ] Add visual regression testing
- [ ] Test Electron IPC communication
- [ ] Add performance benchmarks
- [ ] Test keyboard shortcuts comprehensively
- [ ] Add accessibility (a11y) tests
- [ ] Test with different OpenSCAD versions
- [ ] Add integration tests for file operations
- [ ] Test memory leaks in long sessions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/automated-testing)

