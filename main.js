const { app, BrowserWindow, Menu, globalShortcut} = require('electron');

let mainWindow;

app.on('ready', () => {
    // Remove o menu padrão
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({    
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // Inicia o aplicativo maximizado
  mainWindow.maximize();

  mainWindow.loadFile('main.html');

  // Registrar um atalho (Ctrl+Shift+I) para abrir/fechar DevTools
  globalShortcut.register('Control+Shift+I', () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll(); // Limpa os atalhos ao fechar o app
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
