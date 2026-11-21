const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');

let mainWindow;
let backendProcess;
let frontendProcess;
let timerActive = false;
let checkInterval = null;

const blockedApps = [
  { processName: 'discord.exe', displayName: 'Discord' },
  { processName: 'spotify.exe', displayName: 'Spotify' },
  { processName: 'steam.exe', displayName: 'Steam' },
  { processName: 'epicgames.exe', displayName: 'Epic Games' },
  { processName: 'battle.net.exe', displayName: 'Battle.net' }
];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'FocusFlow AI - Academic Compliance Edition',
    backgroundColor: '#070a13',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Remove default menu for clean aesthetics
  mainWindow.removeMenu();

  // Retry loading URL in case Vite is still booting
  const loadURLWithRetry = (url) => {
    mainWindow.loadURL(url).catch(() => {
      setTimeout(() => loadURLWithRetry(url), 500);
    });
  };

  loadURLWithRetry('http://localhost:5173');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Start backend and frontend servers
function startServers() {
  console.log('Starting FocusFlow AI services...');

  // 1. Spawn backend server
  backendProcess = spawn('node', [path.join(__dirname, 'backend', 'src', 'index.js')], {
    env: { ...process.env, PORT: 5000 },
    stdio: 'inherit'
  });

  // 2. Spawn frontend vite server
  frontendProcess = spawn('npx', ['vite', '--port', '5173'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  backendProcess.on('error', (err) => console.error('Backend process failed to start:', err));
  frontendProcess.on('error', (err) => console.error('Vite dev server failed to start:', err));
}

// Monitor running tasks
function monitorProcesses() {
  if (!timerActive) {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    // Clear any blocked state on UI when timer stops
    if (mainWindow) {
      mainWindow.webContents.send('app-blocked', '');
    }
    return;
  }

  if (checkInterval) return;

  checkInterval = setInterval(() => {
    if (!mainWindow) return;

    exec('tasklist /FO CSV /NH', (err, stdout) => {
      if (err) {
        console.error('Error running tasklist:', err);
        return;
      }

      const lines = stdout.toString().split('\n');
      let detectedApp = null;

      for (const line of lines) {
        if (!line.trim()) continue;
        const columns = line.split(',');
        if (columns.length > 0) {
          const processName = columns[0].replace(/"/g, '').toLowerCase();
          const match = blockedApps.find(app => app.processName === processName);
          if (match) {
            detectedApp = match;
            break;
          }
        }
      }

      if (detectedApp) {
        mainWindow.webContents.send('app-blocked', detectedApp.displayName);
      } else {
        mainWindow.webContents.send('app-blocked', '');
      }
    });
  }, 3000);
}

// Electron IPC routing
ipcMain.on('timer-state', (event, isActive) => {
  console.log(`Study Timer Active State Update: ${isActive}`);
  timerActive = isActive;
  monitorProcesses();
});

ipcMain.on('request-kill-app', (event, displayName) => {
  const match = blockedApps.find(app => app.displayName === displayName);
  if (match) {
    console.log(`Killing blacklisted process: ${match.processName}`);
    exec(`taskkill /F /IM ${match.processName}`, (err) => {
      if (err) {
        console.error(`Failed to execute taskkill for ${match.processName}:`, err);
      } else {
        // Run check again immediately
        setTimeout(() => {
          if (timerActive) monitorProcesses();
        }, 500);
      }
    });
  }
});

app.whenReady().then(() => {
  startServers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Graceful cleanup of child servers on exit
app.on('will-quit', () => {
  console.log('Shutting down FocusFlow AI services...');
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();
  if (checkInterval) clearInterval(checkInterval);
});
