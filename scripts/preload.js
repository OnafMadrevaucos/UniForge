const { contextBridge, ipcRenderer } = require('electron');
console.log('============================= UNIFORGE ============================');  

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // we can also expose variables, not just functions
})

contextBridge.exposeInMainWorld('sql', {
  askForConnect: () => ipcRenderer.invoke('ask-for-connect')
});
console.log('UniForge: Realizando pré-carregamentos...OK');