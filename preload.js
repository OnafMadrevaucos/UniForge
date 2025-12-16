const { contextBridge, ipcRenderer } = require('electron');
console.log('============================= UNIFORGE ============================');

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})
console.log('UniForge | Configurando pré-carregamentos de Versão.');

contextBridge.exposeInMainWorld('sql', {
  query: async (sql, params = []) => ipcRenderer.invoke('db-query', sql, params),
  exec: async (sql, params = []) => ipcRenderer.invoke('db-exec', sql, params)
});
console.log('UniForge | Configurando pré-carregamentos de SQL.');

contextBridge.exposeInMainWorld('app', {
  refresh: () => ipcRenderer.invoke('window-refresh'),
  fileDialog: (type) => ipcRenderer.invoke('select-file', type),
});
console.log('UniForge | Configurando pré-carregamentos de Aplicação.');

contextBridge.exposeInMainWorld('pdfCtrl', {
  save: async (path, name, buffer) => await ipcRenderer.invoke('save-pdf', path, name, Buffer.from(buffer)),
});
console.log('UniForge | Configurando pré-carregamentos de manipulação de PDF.');

contextBridge.exposeInMainWorld('path', {
  join: async (...args) => {
    const result = await ipcRenderer.invoke('path-join', args);
    return result;
  },
  resolve: async (protoPath) => await ipcRenderer.invoke('path-resolve', protoPath),
  extname: async (filePath) => await ipcRenderer.invoke('path-extname', filePath)
});
console.log('UniForge | Configurando pré-carregamentos de Diretórios.');

contextBridge.exposeInMainWorld('fs', {
  readFile: (path) => {
    const result = ipcRenderer.invoke('read-file', path);
    return result;
  },
  copyFile: (src, dest) => {
    const result = ipcRenderer.invoke('copy-file', src, dest);
    return result;
  },
  readDir: (path) => {
    const result = ipcRenderer.invoke('read-dir', path);
    return result;
  }
});
console.log('UniForge | Configurando pré-carregamentos de Manipulador de Arquivos.');

contextBridge.exposeInMainWorld('tiler', {
  generateTiles: (path, config) => ipcRenderer.invoke("generate-tiles", path, config),
  emitProgress: (callback) => { ipcRenderer.on("tiler-progress", (event, data) => callback(data)); },
  cancel: () => ipcRenderer.sendSync("tiler-cancel")
});
console.log('UniForge | Configurando pré-carregamentos da Ferramenta de Tiler de Mapa.');