import { app, BrowserWindow, Menu, View, globalShortcut, dialog} from 'electron';
import crypto from 'crypto';

let mainWindow;

// Remove o menu padrão
Menu.setApplicationMenu(null);

app.on('ready', () => {   

  // Gerar um nonce único
  const nonce = crypto.randomBytes(16).toString('base64');

  mainWindow = new BrowserWindow({    
    webPreferences: {
      nodeIntegration: true,
      // Passar o nonce para o contexto do renderer
      additionalArguments: [`--nonce=${nonce}`]
    },
    show: false 
  });

  // Inicia o aplicativo maximizado
  mainWindow.maximize();

  mainWindow.loadFile('main.html', { query: { nonce } });

  // Registrar um atalho (Ctrl+Shift+I) para abrir/fechar DevTools
  globalShortcut.register('Control+Shift+I', () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

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