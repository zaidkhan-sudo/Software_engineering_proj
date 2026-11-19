const { contextBridge } = require('electron');

/**
 * Preload script - safely bridges minimal platform metadata
 * contextIsolation: true prevents renderer from accessing Node.js runtime directly.
 */
contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform
});
