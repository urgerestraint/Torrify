import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: [
      'node_modules',
      'dist',
      'dist-electron',
      'e2e',
      '**/e2e/**',
      '**/dist-electron/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Only collect coverage for files executed in tests (avoids remapping crash on unused/generated code)
      all: false,
      exclude: [
        'node_modules/',
        'src/test/',
        '**/__tests__/**',
        '**/*.{test,spec}.*',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/dist-electron/**',
        'electron/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
