import { app, BrowserWindow, Menu, globalShortcut, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import crypto, { randomBytes, randomUUID } from 'crypto';
import Database from 'better-sqlite3';


// Para resolver o `__dirname` no modo ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

const db = new Database(path.join(__dirname, './db/database.db')); 

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

  ipcMain.handle('db-query', (event, query, params = []) => dbQuery(query, params));
  ipcMain.handle('db-exec', (event, query, params = []) => dbExec(query, params));

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
}

function dbQuery(query, params = []) {
  try {
    const statement = db.prepare(query);
    const result = statement.all(...params); // Executa a consulta e retorna todos os resultados
    return result;
  } catch (err) {
    console.error('Erro no banco de dados:', err.message);
    throw err;
  }
}

function dbExec(query, params = []){
  try {
    const statement = db.prepare(query);
    const result = statement.run(...params); // Executa um comando (INSERT, UPDATE, DELETE)
    return result;
  } catch (err) {
    console.error('Erro no banco de dados:', err.message);
    throw err;
  }
}