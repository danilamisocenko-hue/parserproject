import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

app.disableHardwareAcceleration();

const PORT = app.isPackaged ? 38558 : 3000;
process.env.PORT = PORT.toString();

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

  let retries = 0;
  const checkServerAndLoad = () => {
    fetch(`http://127.0.0.1:${PORT}`)
      .then(() => {
        win.loadURL(`http://127.0.0.1:${PORT}`);
        win.webContents.openDevTools();
      })
      .catch((err) => {
        retries++;
        if (retries > 10) {
          try {
            dialog.showErrorBox("Failed to start interface", `The server at http://127.0.0.1:${PORT} didn't respond. Error: ` + String(err));
            app.quit();
          } catch(e) {}
        } else {
          setTimeout(checkServerAndLoad, 500);
        }
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
      dialog.showErrorBox("Server Error", String(e.stack || e));
      
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
