const { app, BrowserWindow } = require("electron");
const path = require("path");

if (require('electron-squirrel-startup')) {
    app.quit();
    process.exit(0);
}

const createWindow = () => {
    const win = new BrowserWindow({
        width : 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})