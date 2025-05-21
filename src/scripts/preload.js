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
});
console.log('UniForge | Configurando pré-carregamentos de Aplicação.');

contextBridge.exposeInMainWorld('path', {
  join: async (...args) => { 
    const result = await ipcRenderer.invoke('path-join', args);
    console.log(args);
    return result;
  },
  resolve: async (protoPath) => await ipcRenderer.invoke('path-resolve', protoPath)
});
console.log('UniForge | Configurando pré-carregamentos de Templates.');
