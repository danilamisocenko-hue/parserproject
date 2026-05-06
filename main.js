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
    },
    icon: path.join(__dirname, 'public/icon.ico')
  });

  win.setMenuBarVisibility(false);

  // Даем серверу время на запуск, особенно если ставится Playwright
  setTimeout(() => {
    win.loadURL('http://localhost:3000');
  }, 4000);
}

app.whenReady().then(async () => {
  process.env.NODE_ENV = 'production';
  try {
    // В собранном приложении грузим скомпилированный сервер напрямую
    await import('./dist-server/server.js');
  } catch (e) {
    console.error("Falling back to dev server:", e);
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
