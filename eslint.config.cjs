const eslint = require('@eslint/js')
const tseslint = require('typescript-eslint')
const globals = require('globals')
const reactHooks = require('eslint-plugin-react-hooks')

module.exports = tseslint.config(
  {
    ignores: [
      'node_modules/',
      'dist/',
      'dist-electron/',
      'dist-installer/',
      'coverage/',
      '**/*.d.ts',
      '**/rename-electron.cjs',
      'scripts/**',
      'build/',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ['electron/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
  },
  // Relax rules for test files
  {
    files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/*.test.ts', '**/*.test.tsx', 'src/test/**/*.ts'],
    rules: {
      'no-empty': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-useless-escape': 'off',
    },
  }
)
