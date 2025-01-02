const { contextBridge, ipcRenderer } = require('electron');
console.log('============================= UNIFORGE ============================');  

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})

contextBridge.exposeInMainWorld('sql', {
  query: async (sql, params = []) => ipcRenderer.invoke('db-query', sql, params),
  exec: async (sql, params = []) => ipcRenderer.invoke('db-exec', sql, params)
});
console.log('UniForge: Realizando pré-carregamentos de SQL...OK');