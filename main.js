import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "PARSER by FRESKO CT",
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: true,
    }
  });

  win.setMenuBarVisibility(false);

  const checkServerAndLoad = () => {
    fetch('http://localhost:3000')
      .then(() => {
        win.loadURL('http://localhost:3000');
      })
      .catch(() => {
        setTimeout(checkServerAndLoad, 500);
      });
  };
  
  checkServerAndLoad();
}

app.whenReady().then(async () => {
    process.env.NODE_ENV = 'production';
    try {
      await import('./dist-server/server.js');
    } catch (e) {
      console.error("Server init error:", e);
      try {
        const { dialog } = require('electron');
        dialog.showErrorBox("Server Error", String(e.stack || e));
      } catch (err) {}
      
      const { spawn } = await import('child_process');
      serverProcess = spawn('npx', ['tsx', 'server.ts'], { shell: true });
    }
  
    createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
