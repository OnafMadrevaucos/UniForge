import { app, BrowserWindow, Menu, globalShortcut, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Database from 'better-sqlite3';

// Para resolver o `__dirname` no modo ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __srcname = path.join(__dirname, 'src');

let mainWindow;

/**
 * Instância do banco de dados SQLite.
 * @type {Database}
 */
const db = new Database(path.join(__dirname, './src/db/database.db'));

// Remove o menu padrão
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  console.log('============================= UNIFORGE ============================');
  CreateWindow();
  console.log('UniForge | Criando a Tela Principal.');

  mainWindow.webContents.openDevTools();

  /**
   * Atalho global para abrir/fechar DevTools.
   * Combinado: Ctrl+Shift+I.
   */
  globalShortcut.register('Control+Shift+I', () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  });

  /**
   * Atalho global para abrir/fechar DevTools.
   * Combinado: F12.
   */
  globalShortcut.register('F12', () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  });
  console.log('UniForge | Registrando Atalhos.');

  /**
   * Manipulador para consultas ao banco de dados.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} query - A consulta SQL.
   * @param {Array} [params=[]] - Parâmetros opcionais para a consulta.
   * @returns {Array<Object>} - Resultado da consulta.
   */
  ipcMain.handle('db-query', (event, query, params = []) => dbQuery(query, params));

  /**
   * Manipulador para executar comandos no banco de dados.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} query - O comando SQL.
   * @param {Array} [params=[]] - Parâmetros opcionais para o comando.
   * @returns {Object} - Resultado da execução.
   */
  ipcMain.handle('db-exec', (event, query, params = []) => dbExec(query, params));

   /**
   * Manipulador para recarregar a Janela Principal.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} query - O comando SQL.
   * @param {Array} [params=[]] - Parâmetros opcionais para o comando.
   * @returns {Object} - Resultado da execução.
   */
   ipcMain.handle('window-refresh', (event) => refreshWindow());  

  /**
   * Manipulador para buscar templates de arquivos.
   * @param {string} fileName - Nome do arquivo do template.
   */
  ipcMain.handle('get-template', async (event, fileName) => getTemplate(fileName));

  console.log('UniForge | Criando requisição de Renders.');
});

app.on('will-quit', () => {  
  globalShortcut.unregisterAll(); // Limpa os atalhos ao fechar o app
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Cria a janela principal da aplicação.
 */
function CreateWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, './src/scripts/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: './src/ui/icons/icone.png',
    show: false,
  });

  // Inicia o aplicativo maximizado
  mainWindow.maximize();
  mainWindow.loadFile('./src/uniforge.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    // Adiciona um event listener para a tecla F5
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F5') {
        // Recarrega a janela principal
        mainWindow.reload()
      }
    })
  })

  mainWindow.on('closed', () => {    
    mainWindow = null;
  });
}

// ------------------ FUNÇÕES RENDERER ------------------

/**
 * Realiza uma consulta ao banco de dados.
 * 
 * @param {string} query - A consulta SQL a ser executada.
 * @param {Array} [params=[]] - Parâmetros opcionais para a consulta.
 * @returns {Array<Object>} - Resultado da consulta.
 * @throws {Error} - Caso ocorra algum erro no banco de dados.
 */
function dbQuery(query, params = []) {
  try {
    const statement = db.prepare(query);
    const result = statement.all(...params); // Executa a consulta e retorna todos os resultados
    return result;
  } catch (err) {
    console.error('UniForge | Erro no banco de dados:', err.message);
    throw err;
  }
}

/**
 * Executa um comando no banco de dados (INSERT, UPDATE, DELETE).
 * 
 * @param {string} query - O comando SQL a ser executado.
 * @param {Array} [params=[]] - Parâmetros opcionais para o comando.
 * @returns {Object} - Resultado da execução.
 * @throws {Error} - Caso ocorra algum erro no banco de dados.
 */
function dbExec(query, params = []) {
  try {
    const statement = db.prepare(query);
    const result = statement.run(...params); // Executa um comando (INSERT, UPDATE, DELETE)
    return result;
  } catch (err) {
    console.error('UniForge | Erro no banco de dados:', err.message);
    throw err;
  }
}

function refreshWindow() {  
  if (mainWindow) {    
    console.log('UniForge | Recarregando a Janela Principal.');    
    mainWindow.reload();
  } 
}

/**
 * Obtém um template de Handlebars.
 * 
 * @async
 * @param {string} fileName       - O nome do arquivo Handlebars.
 * @param {string} [id]           - Um ID para registrar o partial.
 * @returns {Promise<Function>}   - Uma Promise que se resolve com o template de Handlebars compilado.
 */
async function getTemplate(fileName, id) {
  try {
    console.log(fileName);
    const filePath = path.join(__srcname, 'templates', fileName);
    if (filePath in Handlebars.partials) return Handlebars.partials[filePath];
    const htmlString = await new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });
    const compiled = Handlebars.compile(htmlString);
    Handlebars.registerPartial(id ?? filePath, compiled);
    console.log(`UniForge | Template '${filePath}' obtido e compilado com sucesso.`);
    console.log(compiled);
    return compiled;    
  } catch (err) {
    console.error('UniForge | Erro ao carregar template: ', err.message);
    throw err;
  }
}
