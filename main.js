const { app, BrowserWindow, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: primaryDisplay.bounds.width,
    height: primaryDisplay.bounds.height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: false,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });

  mainWindow.loadFile('index.html');

  // Start with mouse events passing through to windows below
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Allow interaction with specific regions
  const { ipcMain } = require('electron');
  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    mainWindow.setIgnoreMouseEvents(ignore, options);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create system tray icon
  createTray();
}

function createTray() {
  // Load the red ball icon for system tray
  const iconPath = path.join(__dirname, 'icon-16x16.png');
  const icon = nativeImage.createFromPath(iconPath);

  // Set proper size for Windows tray
  icon.setTemplateImage(false);

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Desktop Ball',
      enabled: false
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Desktop Ball');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
