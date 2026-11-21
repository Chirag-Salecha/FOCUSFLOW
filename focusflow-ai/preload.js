const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendTimerState: (isActive) => ipcRenderer.send('timer-state', isActive),
  onAppBlocked: (callback) => {
    const listener = (event, appName) => callback(appName);
    ipcRenderer.on('app-blocked', listener);
    return () => ipcRenderer.removeListener('app-blocked', listener);
  },
  requestKillApp: (appName) => ipcRenderer.send('request-kill-app', appName)
});
