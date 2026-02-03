import { app, Menu, type BrowserWindow } from 'electron'

export function buildApplicationMenu(mainWindow: BrowserWindow | null): void {
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu-new-file') },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => mainWindow?.webContents.send('menu-open-file') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow?.webContents.send('menu-save-file') },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu-save-as')
        },
        { type: 'separator' },
        { label: 'Export Source...', click: () => mainWindow?.webContents.send('menu-export-scad') },
        { label: 'Export STL...', click: () => mainWindow?.webContents.send('menu-export-stl') },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Render',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => mainWindow?.webContents.send('menu-render')
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'LLM',
      submenu: [
        { label: 'Toggle AI', click: () => mainWindow?.webContents.send('menu-llm-toggle') },
        { type: 'separator' },
        { label: 'Switch to BYOK', click: () => mainWindow?.webContents.send('menu-llm-byok') },
        { label: 'Switch to PRO', click: () => mainWindow?.webContents.send('menu-llm-pro') },
        { type: 'separator' },
        { label: 'LLM Settings...', click: () => mainWindow?.webContents.send('menu-llm-settings') }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Help Bot', click: () => mainWindow?.webContents.send('menu-help-bot') },
        { label: 'Show Demo', click: () => mainWindow?.webContents.send('menu-show-demo') },
        { type: 'separator' },
        { label: 'Settings...', click: () => mainWindow?.webContents.send('menu-settings') }
      ]
    }
  ]

  if (process.platform === 'darwin') {
    menuTemplate.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
}
