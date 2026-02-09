/**
 * Monaco language configuration for OpenSCAD (.scad files).
 * Defines brackets, comments, auto-closing pairs, and folding.
 */
export const languageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '[', close: ']' },
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
  ],
} as const

/**
 * OpenSCAD control keywords (flow control).
 */
export const controlKeywords = [
  'if',
  'else',
  'for',
  'each',
  'intersection_for',
  'return',
] as const

/**
 * OpenSCAD declaration keywords.
 */
export const keywords = [
  'module',
  'function',
  'let',
  'include',
  'use',
] as const

/**
 * OpenSCAD built-in modules and primitives.
 */
export const builtins = [
  'cube',
  'sphere',
  'cylinder',
  'polyhedron',
  'square',
  'circle',
  'polygon',
  'text',
  'union',
  'difference',
  'intersection',
  'translate',
  'rotate',
  'scale',
  'mirror',
  'color',
  'hull',
  'minkowski',
  'linear_extrude',
  'rotate_extrude',
  'resize',
  'offset',
  'multmatrix',
  'projection',
  'children',
] as const

/**
 * OpenSCAD constants.
 */
export const constants = ['true', 'false', 'undef', 'PI'] as const

/**
 * OpenSCAD special variables.
 */
export const specialVariables = ['$fn', '$fa', '$fs', '$t', '$children', '$preview'] as const

/**
 * OpenSCAD math and utility functions.
 */
export const functions = [
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'atan2',
  'abs',
  'ceil',
  'floor',
  'round',
  'sign',
  'sqrt',
  'pow',
  'exp',
  'len',
  'log',
  'ln',
  'min',
  'max',
  'norm',
  'cross',
  'str',
  'chr',
  'ord',
  'concat',
  'lookup',
  'search',
  'assert',
  'echo',
] as const

/**
 * Monarch tokenizer definition for OpenSCAD syntax highlighting.
 */
export const monarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.scad',
  keywords: [...keywords],
  controlKeywords: [...controlKeywords],
  builtins: [...builtins],
  constants: [...constants],
  functions: [...functions],
  brackets: [
    { token: 'delimiter.curly', open: '{', close: '}' },
    { token: 'delimiter.parenthesis', open: '(', close: ')' },
    { token: 'delimiter.square', open: '[', close: ']' },
  ],
  operators: [
    '=',
    '>',
    '<',
    '!',
    '?',
    ':',
    '==',
    '!=',
    '<=',
    '>=',
    '&&',
    '||',
    '+',
    '-',
    '*',
    '/',
    '%',
  ],
  symbols: /[=><!~?:&|+\-*/%#]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4})/,
  tokenizer: {
    root: [
      // Special variables: $fn, $fa, $fs, $t, $children, $preview
      [/\$[a-zA-Z_]\w*/, 'variable.predefined'],
      // Geometry modifiers at start: * ! # %
      [/^[\s]*[!*#%](?=\s)/, 'keyword.operator.modifier'],
      // identifiers and keywords
      [
        /[a-zA-Z_]\w*/,
        {
          cases: {
            '@controlKeywords': { token: 'keyword.control' },
            '@keywords': { token: 'keyword.$0' },
            '@builtins': { token: 'support.function' },
            '@constants': { token: 'constant.language' },
            '@functions': { token: 'support.function' },
            '@default': 'identifier',
          },
        },
      ],
      // whitespace
      { include: '@whitespace' },
      // brackets
      [/[\]{}()[\]]/, '@brackets'],
      // operators
      [
        /@symbols/,
        {
          cases: {
            '@operators': 'operator',
            '@default': '',
          },
        },
      ],
      // numbers: floats, integers, scientific
      [/\d*\.\d+([eE][+-]?\d+)?/, 'number.float'],
      [/\d+\.\d*([eE][+-]?\d+)?/, 'number.float'],
      [/\d+[eE][+-]?\d+/, 'number.float'],
      [/\d+/, 'number'],
      // delimiter
      [/[;,.]/, 'delimiter'],
      // strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, 'string', '@string'],
    ],
    whitespace: [
      [/[ \t\r\n]+/, ''],
      [/\/\*/, 'comment', '@comment'],
      [/\/\/.*$/, 'comment'],
    ],
    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],
    string: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],
  },
} as const
