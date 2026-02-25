import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
                  entry: 'electron/main.ts',
                },
                {
                  // Preload scripts
                  entry: 'electron/preload.ts',
                  onstart(options) {
                    options.reload()
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
