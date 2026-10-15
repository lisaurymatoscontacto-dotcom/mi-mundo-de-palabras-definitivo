const { app, BrowserWindow, protocol, net, shell, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { localAsset } = require('./paths.cjs');

protocol.registerSchemesAsPrivileged([{
  scheme: 'mmdp', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
}]);

function createWindow() {
  const window = new BrowserWindow({
    width: 1280, height: 900, minWidth: 360, minHeight: 600,
    title: 'Mi Mundo de Palabras', backgroundColor: '#eef2ff',
    autoHideMenuBar: true, icon: path.join(__dirname, 'web/icon-512.png'),
    show: process.env.MMDP_SMOKE !== '1',
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
  });
  window.webContents.setUserAgent(window.webContents.getUserAgent() + ' MMDP-Desktop');
  window.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('mmdp://app/')) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  void window.loadURL('mmdp://app/');
}

app.whenReady().then(() => {
  protocol.handle('mmdp', async (request) => {
    try {
      return await net.fetch(pathToFileURL(localAsset(path.join(__dirname, 'web'), request.url)).href);
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
