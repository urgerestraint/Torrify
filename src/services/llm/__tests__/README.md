# LLM Code Generation Test Suite

This test suite validates that the LLM can generate runnable code for 25 simple prompts across both OpenSCAD and build123d backends.

## Overview

The test suite includes:
- **25 test prompts** covering basic shapes, parametric designs, operations, and complex shapes
- **Code extraction** from LLM responses (`<openscad>` or `<python>` tags)
- **Syntax validation** to ensure generated code is structurally correct
- **Support for both mocked and real API testing**

## Running Tests

### With Mocked LLM Service (Default)

By default, tests use mocked LLM responses. This is fast and doesn't require API keys:

```bash
npm test -- --run code-generation.test.ts
```

### With Real LLM API

To test against a real LLM service, set environment variables:

```bash
# For Gemini
LLM_TEST_API_KEY=your-gemini-api-key LLM_TEST_PROVIDER=gemini npm test -- --run code-generation.test.ts

# For OpenRouter
LLM_TEST_API_KEY=your-openrouter-api-key LLM_TEST_PROVIDER=openrouter npm test -- --run code-generation.test.ts
```

**Note:** Real API tests have longer timeouts (30 seconds per test) and will make actual API calls.

## Test Prompts

The suite tests 25 prompts organized by category:

### Basic Shapes (5)
1. create a box
2. make a sphere
3. create a cylinder
4. make a cube
5. create a simple box with rounded corners

### Parametric Designs (8)
6. create a box with a hole in the center
7. make a container with walls
8. create a box with corner holes
9. make a parametric box with configurable dimensions
10. create a box with a lid
11. make a container with rounded edges
12. create a box with multiple holes
13. make a hollow box

### Operations (7)
14. create a box and add fillets to the edges
15. make a box with chamfered edges
16. create two boxes and combine them
17. make a box and subtract a cylinder from it
18. create a box and intersect it with a sphere
19. make a box with rounded top edges
20. create a box with a pattern of holes

### Complex Shapes (5)
21. create a heart shaped box
22. make a star shape
23. create a gear shape
24. make a rounded rectangle container
25. create a box with decorative cutouts

## Validation

The test suite validates:

### For OpenSCAD:
- Balanced braces `{}`, parentheses `()`, and brackets `[]`
- Non-empty code
- Presence of recognizable OpenSCAD operations

### For build123d:
- Required `from build123d import` statement
- Balanced parentheses, brackets, and braces
- Non-empty code
- Presence of recognizable build123d operations
- Context managers (`with` statements) for Builder pattern

## Adding New Prompts

To add new test prompts, edit `test-prompts.ts`:

```typescript
export const TEST_PROMPTS = [
  // ... existing prompts
  'your new prompt here',
] as const
```

## Limitations

- **Syntax validation only**: Tests validate code structure, not full execution
- **No rendering**: Tests don't attempt to render/compile the code (too slow)
- **Basic checks**: Validation focuses on common errors, not exhaustive syntax checking

For full execution testing, use the actual application's render functionality.
