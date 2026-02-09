import { ipcMain, type BrowserWindow } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { WindowTitleSchema } from '../validation/schemas'
import { getErrorMessage } from '../utils/error'
import { logger } from '../utils/logger'

const DOC_FILES = [
  'README.md',
  'docs/README.md',
  'docs/getting-started/QUICKSTART.md',
  'docs/getting-started/START_HERE.md',
  'docs/getting-started/START_APP.md',
  'docs/developer/DEV_README.md',
  'docs/developer/TESTING.md',
  'docs/architecture/PROJECT_SUMMARY.md',
  'docs/features/LLM_INTEGRATION.md',
  'docs/features/SETTINGS_FEATURE.md',
  'docs/features/WHATS_NEW.md',
  'docs/reference/QUICK_REFERENCE.md',
  'docs/reference/DOCUMENTATION_INDEX.md',
  'docs/NEXT_STEPS.md'
]

export function registerWindowDocHandlers(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('set-window-title', (_event, titleInput: unknown) => {
    const parseResult = WindowTitleSchema.safeParse(titleInput)
    if (!parseResult.success) {
      return
    }
    const win = getMainWindow()
    if (win) {
      win.setTitle(parseResult.data)
    }
  })

  ipcMain.handle('load-documentation', async () => {
    try {
      const docs: Record<string, string> = {}
      const projectRoot = process.env.VITE_DEV_SERVER_URL
        ? path.join(__dirname, '../../')
        : path.join(__dirname, '../')

      for (const docFile of DOC_FILES) {
        const filePath = path.join(projectRoot, docFile)
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8')
            docs[docFile] = content
          } catch (error) {
            logger.error(`Failed to read ${docFile}`, error)
          }
        }
      }

      return { success: true, docs }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  })
}
