// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron')

// Set up context bridge between the renderer process and the main process
contextBridge.exposeInMainWorld(
  'shell',
  {
    open: () => ipcRenderer.send('shell:open'),
  }
)

contextBridge.exposeInMainWorld(
  'electrontest',
  {
    protocolHandler: (callback) => ipcRenderer.on('url-protocol', callback)
  }
)

contextBridge.exposeInMainWorld('electronAPI',{
  openFile: () => ipcRenderer.invoke('dialog:openFile')
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency]) 
  }
})