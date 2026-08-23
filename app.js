import { app, BrowserWindow, Menu, globalShortcut, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import css from 'css';
import Database from 'better-sqlite3';
import { result } from 'lodash-es';
import fontList from "font-list";
import NodeTiler from './modules/nodetiler/nodeTiler.mjs';

// Para resolver o `__dirname` no modo ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __srcname = path.join(__dirname, 'src');

let mainWindow;

let activeTiler = null;

console.log(__filename);

/**
 * Instância do banco de dados SQLite.
 * @type {Database}
 */
const db = new Database(path.join(__dirname, '/common/backend/database.db'));

const tiler = null;

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

  ipcMain.handle('get-dir', (event) => { return __dirname; });

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
  * Manipulador para carregar um dialog usando a API do Electron.
  * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
  * @param {string} type - O tipo de arquivo a ser selecionado.
  * @returns {Object} - Resultado da execução.
  */
  ipcMain.handle('select-file', (event, type) => selectFile(type));

  /**
  * Manipulador para carregar a lista de fontes usando a API do Electron.
  * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
  * @returns {Object} - Resultado da execução.
  */
  ipcMain.handle('get-fonts', (event) => listFonts());

  /**
   * Manipulador para unir caminhos relativos dentro da pasta `src`.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {Array} [args=[]] - Parâmetros opcionais para o comando.
   * @returns {string} - Caminho unido.
   */
  ipcMain.handle('path-join', (event, args = []) => pathJoin(args));

  /**
   * Manipulador para resolver caminhos relativos dentro da pasta `src`.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} protoPath - O caminho relativo do arquivo a ser resolvido.
   * @returns {string} - Caminho resolvido.
   */
  ipcMain.handle('path-resolve', (event, protoPath) => pathResolve(protoPath));

  /**
   * Manipulador para obter a extensão do arquivo a partir do caminho fornecido.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} filePath - O caminho do arquivo.
   * @returns {string} - Extensão do arquivo informado.
   */
  ipcMain.handle('path-extname', (event, filePath) => pathExtname(filePath));

  /**
   * Manipulador para ler o conteúdo de um arquivo.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} filePath - O caminho do arquivo a ser lido.
   * @returns {Buffer} - O conteúdo do arquivo lido.
   */
  ipcMain.handle('save-pdf', (event, path, name, buffer) => savePDF(path, name, buffer));

  /**
   * Manipulador para ler o conteúdo de um arquivo.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} filePath - O caminho do arquivo a ser lido.
   * @returns {Buffer} - O conteúdo do arquivo lido.
   */
  ipcMain.handle('read-file', (event, filePath) => readFile(filePath));

  /**
   * Manipulador para copiar o conteúdo de um arquivo.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} src - O caminho do arquivo de origem.
   * @param {string} dest - O caminho do arquivo de destino.
   * @returns {Promise<void>} - Uma promessa que é resolvida quando a cópia é concluída.
   */
  ipcMain.handle('copy-file', (event, src, dest) => copyFile(src, dest));

  /**
   * Manipulador para escrever dados em um arquivo em um determinado diretório.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} path - O caminho onde o arquivo será salvo.
   * @param {string} name - O nome do arquivo com a extensão.
   * @param {Buffer} data - O buffer de dados a serem escritos no arquivo.
   */
  ipcMain.handle('write-file', (event, path, name, buffer) => writeFile(path, name, buffer));

  /**
   * Manipulador para ler o conteúdo de um diretório.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} filePath - O caminho do diretório a ser lido.
   * @returns {Buffer} - O conteúdo do diretório lido.
   */
  ipcMain.handle('read-dir', (event, filePath) => readDir(filePath));

  /**
   * Manipulador para listar os arquivos de um diretório.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} filePath - O caminho do diretório a ser lido.
   * @returns {Buffer} - O conteúdo do diretório lido.
   */
  ipcMain.handle('list-files', (event, filePath) => listFiles(filePath));

  /**
   * Manipulador para converter regras CSS para a estrutura JSON.
   * @param {Electron.IpcMainEvent} event - O evento IPC recebido.
   * @param {string} filePath - O caminho do arquivo a ser lido.
   * @returns {Object} - O conteúdo do arquivo lido.
   */
  ipcMain.handle('CSS-to-JSON', (event, filePath) => parseCSStoJSON(filePath));

  /**
   * Manipulador para buscar templates de arquivos.
   * @param {string} fileName - Nome do arquivo do template.
   */
  ipcMain.handle('get-template', async (event, fileName) => getTemplate(fileName));

  /**
   * Manipulador para gerar tiles de mapas.
   * @param {object} config - Opções de configuração da geração de tiles de mapas.
   */
  ipcMain.handle('generate-tiles', async (event, path, config) => generateTiles(path, config));

  /**
   * Manipulador para cancelar a geração de tiles de mapas.
   */
  ipcMain.on('tiler-cancel', () => {
    if (activeTiler) activeTiler.cancel();
  });

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
* Os tipos de arquivos aceitos pelo diálogo de arquivos.
* @type {object}
*/
const FILE_FILTERS = {
  any: [{ name: 'Todos os Arquivos', extensions: ['*'] }],
  font: [{ name: 'Fontes', extensions: ['ttf', 'otf', 'woff', 'woff2'] }],
  image: [{ name: 'Imagens', extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg'] }],
  text: [{ name: 'Texto', extensions: ['csv', 'txt', 'json', 'pdf'] }],
};

/**
 * Cria a janela principal da aplicação.
 */
function CreateWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, '/preload.js'),
      worldSafeExecuteJavaScript: true,
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__srcname, '/ui/icons/icone.png'),
    show: false,
  });

  // Inicia o aplicativo maximizado
  mainWindow.maximize();
  mainWindow.loadFile(path.join(__srcname, '/uniforge.html'));

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

async function selectFile(type) {
  // Abre um dialog para selecionar um arquivo.
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Selecionar arquivo',
    properties: ['openFile'],
    filters: FILE_FILTERS[type],
  });

  // Retorna o caminho do arquivo selecionado.
  return canceled ? null : filePaths[0];
}

/**
 * Junta um ou mais caminhos relativos dentro da pasta `src` em um caminho absoluto.
 * @param {string[]} paths - Os caminhos relativos a serem unidos.
 * @returns {string} - O caminho absoluto resultante.
 */
function pathJoin(paths) {
  const result = path.join(__srcname, ...paths);
  return result;
}

/**
 * Resolve um caminho relativo de um arquivo dentro da pasta `src`.
 * 
 * @param {string} protoPath - O caminho relativo do arquivo a ser resolvido.
 * @returns {string} - O caminho absoluto do arquivo.
 */
function pathResolve(protoPath) {
  const fullPath = path.join(__srcname, protoPath);
  const result = path.resolve(fullPath);
  return result;
}

/**
 * Obtém a extensão do arquivo a partir do caminho fornecido.
 * 
 * @param {string} filePath - O caminho completo do arquivo.
 * @returns {string} - A extensão do arquivo.
 */
function pathExtname(filePath) {
  var result = path.extname(filePath);
  result = result.replace('.', ''); // Remove o ponto inicial da extensão.
  return result;
}

/**
 * Salva um buffer de dados em um arquivo PDF.
 *
 * @param {string} path - O caminho completo do arquivo a ser salvo.
 * @param {string} name - O nome do arquivo sem a extensão.
 * @param {Buffer} buffer - O buffer de dados do PDF.
 */
function savePDF(target, name, buffer) {
  console.log(target);
  const fullPath = path.join(__srcname, target);
  fs.writeFile(fullPath, buffer, (error) => {
    if (error) {
      console.error('Erro ao salvar o PDF:', error);
    } else {
      console.log('PDF salvo com sucesso em:', path);
    }
  });
}

/**
 * Lê o conteúdo de um arquivo em sincronia.
 * @param {string} path - O caminho absoluto do arquivo a ser lido.
 * @returns {Buffer} - O conteúdo do arquivo lido.
 */
function readFile(path) {
  const result = fs.readFileSync(path);
  return result;
}

/**
 * Copia um arquivo em sincronia.
 * @param {string} src - O caminho absoluto do arquivo de origem.
 * @param {string} dest - O caminho absoluto do arquivo de destino.
 * @returns {object} - O resultado da cópia do arquivo.
 */
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    return true;
  } catch {
    return false;
  }
}

/**
 * Escreve dados em um arquivo em sincronia.
 * @param {string} url    - O caminho completo do arquivo a ser salvo.
 * @param {string} name   - O nome do arquivo com a extensão.
 * @param {Buffer} buffer - O buffer de dados do arquivo.
 * @param {object} options - Opções adicionais para a escrita do arquivo.
 */
async function writeFile(url, name, buffer, options = { forceDir: true, encoding: "utf8" }) {
  return new Promise(async (resolve, reject) => {
    // Verifica se o diretório de destino existe, caso contrário, cria-o
    if (options.forceDir && !fs.existsSync(url)) {
      fs.mkdirSync(url);
    }

    // Gera o caminho completo do arquivo a ser salvo.
    const fullPath = path.join(url, name);

    // Escreve o buffer de dados no arquivo.
    const result = await fs.writeFile(fullPath, buffer, (error) => {
      if (!error) {
        console.log('Arquivo salvo com sucesso em:', fullPath);
        resolve({
          sucess: true,
          error: null
        });
      } else {
        console.error('Erro ao salvar o arquivo:', error);
        resolve({
          sucess: false,
          error: error.message
        });
      }
    });
  });
}

/**
 * Lê o conteúdo de um diretório em sincronia.
 * @param {string} dir   - O caminho absoluto do diretório a ser lido.
 * @returns {Buffer}      - O conteúdo do diretório lido.
 */
function readDir(dir) {
  const fullDir = path.join(__srcname, dir);
  const dirData = fs.readdirSync(fullDir);

  const folders = [];
  const files = [];

  dirData.forEach((item) => {
    const filePath = path.join(fullDir, item);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const folder = {
        name: item,
        path: path.join(dir, item),
      };

      folders.push(folder);
    } else {
      const file = {
        name: item,
        path: path.join(dir, item),
      };

      files.push(file);
    }
  });

  return { folders: folders, files: files };
}

/**
 * Lista todos os arquivos de um diretório em sincronia.
 * @param {string} dir    - O caminho absoluto do diretório a ser lido.
 * @returns {Buffer}      - Os arquivos do diretório lido.
 */
function listFiles(dir) {
  const fullDir = path.join(__srcname, dir);
  const dirData = fs.readdirSync(fullDir);
  const files = [];

  dirData.forEach((item) => {
    const filePath = path.join(fullDir, item);
    const stats = fs.statSync(filePath);

    if (!stats.isDirectory()) {
      const file = {
        name: item,
        path: path.join(dir, item),
      };

      files.push(file);
    }
  });

  return files;
}

/**
 * Transforma um arquivo CSS em um objeto JSON.
 * @param {string} filePath - O caminho absoluto do diretório a ser lido.
 * @returns {Object}        - O Objeto JSON construido.
 */
function parseCSStoJSON(filePath) {
  try {
    // 1. Lê o conteúdo do arquivo CSS usando fs
    const cssContent = fs.readFileSync(filePath, 'utf-8');

    // 2. Transforma o texto CSS em AST (Estrutura de Árvore Sintática)
    const parsedCSS = css.parse(cssContent, { source: filePath });

    const resultJSON = {};

    // 3. Varre as regras do CSS e constrói o objeto JSON
    parsedCSS.stylesheet.rules.forEach(rule => {
      // Processa apenas regras comuns de estilo (ignora @import, @keyframes etc se não preciso)
      if (rule.type === 'rule') {
        rule.selectors.forEach(selector => {
          if (!resultJSON[selector]) {
            resultJSON[selector] = {};
          }

          // Adiciona cada propriedade CSS (declarations) ao seletor correspondente
          rule.declarations.forEach(declaration => {
            if (declaration.type === 'declaration') {
              resultJSON[selector][declaration.property] = declaration.value;
            }
          });
        });
      }
    });

    return Object.values(resultJSON)[0] ?? resultJSON;
  } catch (error) {
    console.error('Erro ao ler ou converter o arquivo CSS:', error);
    return null;
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

/**
 * Gera tiles de um mapa baseado em uma imagem.
 * 
 * @param {string} path - Caminho da imagem base.
 * @param {object} config - Opções de configuração da geração de tiles.
 * @param {string} config.imagePath - Caminho da imagem base.
 * @param {number} [config.tileSize=256] - Tamanho dos tiles.
 * @param {number} [config.minSide=4096] - Tamanho mínimo do mapa.
 * @param {number} [config.maxZoom=5] - Nível máximo de zoom.
 * @param {boolean} [config.expand=true] - Ativa expansão de tiles para o tamanho máximo.
 * @param {boolean} [config.metadata=false] - Ativa geração de metadados.
 * @param {boolean} [config.multithread=false] - Ativa multithreading se hardware permitir.
 * @param {string} config.outputFolder - Caminho da pasta onde os tiles serão escritos.
 * @returns {Promise<boolean>} - Uma promessa que se resolve com um booleano indicando se a geração ocorreu com sucesso.
 * */
async function generateTiles(path, config) {
  activeTiler = new NodeTiler(path, config || {});

  // Redireciona a barra de progresso
  activeTiler._emitProgress = (data) => mainWindow.webContents.send("tiler-progress", data);

  let result = null;

  try {
    await activeTiler.generateTiles(config.outputFolder);
  } catch (err) {
    console.error("UniForge | Tiling foi cancelado ou encerrou devido a um erro:", err);
    result = err;
  } finally {
    activeTiler = null;
  }

  return result;
}

