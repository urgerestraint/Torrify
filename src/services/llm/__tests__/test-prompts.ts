/**
 * Test prompts for LLM code generation validation
 * These are simple, focused prompts designed to test that the LLM
 * can generate runnable code for both OpenSCAD and build123d backends.
 */

export const TEST_PROMPTS = [
  // Basic Shapes (5)
  'create a box',
  'make a sphere',
  'create a cylinder',
  'make a cube',
  'create a simple box with rounded corners',

  // Parametric Designs (8)
  'create a box with a hole in the center',
  'make a container with walls',
  'create a box with corner holes',
  'make a parametric box with configurable dimensions',
  'create a box with a lid',
  'make a container with rounded edges',
  'create a box with multiple holes',
  'make a hollow box',

  // Operations (7)
  'create a box and add fillets to the edges',
  'make a box with chamfered edges',
  'create two boxes and combine them',
  'make a box and subtract a cylinder from it',
  'create a box and intersect it with a sphere',
  'make a box with rounded top edges',
  'create a box with a pattern of holes',

  // Complex Shapes (5)
  'create a heart shaped box',
  'make a star shape',
  'create a gear shape',
  'make a rounded rectangle container',
  'create a box with decorative cutouts',
] as const

export type TestPrompt = typeof TEST_PROMPTS[number]
