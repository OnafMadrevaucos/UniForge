import { app, BrowserWindow, Menu, globalShortcut, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Database from 'better-sqlite3';

// Para resolver o `__dirname` no modo ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Remove o menu padrão
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  console.log('============================= UNIFORGE ============================');  
  CreateWindow();
  console.log('UniForge: Criando a Tela Principal...OK');

  mainWindow.webContents.openDevTools();

  // Registrar um atalho (Ctrl+Shift+I) para abrir/fechar DevTools
  globalShortcut.register('Control+Shift+I', () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  });
  console.log('UniForge: Registrando Atalhos...OK');

  // Lidar com requisições do renderer process via IPC
  ipcMain.handle('ask-for-connect', () => { return getConnection(); });
  console.log('UniForge: Criando requisição de Renders...OK');
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll(); // Limpa os atalhos ao fechar o app
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function CreateWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, './scripts/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: './images/icons/icone.png',
    show: false 
  });

  // Inicia o aplicativo maximizado
  mainWindow.maximize();

  mainWindow.loadFile('./src/main.html');  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })  

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  //sendPackageDataTo(mainWindow);
}

function getConnection() {
  const connection = new Database(path.join(__dirname, './db/database.db'));
  console.log(connection);
  return connection;
}

function sendPackageDataTo(window) {
  // Lendo o arquivo package.json de forma síncrona
  const packagePath = path.join(__dirname, 'package.json');
  const packageData = fs.readFileSync(packagePath, 'utf-8');
  const packageJson = JSON.parse(packageData);

  // Enviar os dados para o renderer
  window.webContents.once('dom-ready', () => {
    window.webContents.send('package-info', packageJson);
  });
}