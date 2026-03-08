import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig(() => {
  const isWebTarget = process.env.VITE_RUNTIME_TARGET === 'web'
  const projectRoot = path.dirname(fileURLToPath(import.meta.url))
  const webApiStubPath = path.resolve(projectRoot, 'src/platform/web/electronAPI.stub.ts')

  return {
    define: {
      __WEB_RUNTIME__: JSON.stringify(isWebTarget),
    },
    resolve: {
      alias: isWebTarget
        ? []
        : [
          {
            find: /^\.\/platform\/web\/electronAPI$/,
            replacement: webApiStubPath
          }
        ]
    },
    build: {
      outDir: isWebTarget ? 'dist-web' : 'dist'
    },
    plugins: [
      react(),
      ...(
        isWebTarget
          ? []
          : [
            electron([
              {
                // Main process
                vite: {
                  build: {
                    lib: {
                      entry: 'electron/main.ts',
                      formats: ['cjs'],
                    },
                    rollupOptions: {
                      external: ['electron', ...Object.keys('dependencies' in pkg ? pkg.dependencies : {})],
                      output: {
                        entryFileNames: 'main.cjs',
                        format: 'cjs',
                      }
                    },
                  },
                },
              },
              {
                // Preload scripts
                onstart(options) {
                  options.reload()
                },
                vite: {
                  build: {
                    lib: {
                      entry: 'electron/preload.ts',
                      formats: ['cjs'],
                    },
                    rollupOptions: {
                      external: ['electron'],
                      output: {
                        entryFileNames: 'preload.cjs',
                        format: 'cjs',
                        inlineDynamicImports: true,
                        exports: 'none'
                      }
                    },
                  },
                },
              },
            ]),
            renderer(),
          ]
      ),
    ],
    server: {
      port: 5173,
    },
  }
})
