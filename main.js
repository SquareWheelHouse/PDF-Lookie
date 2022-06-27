const { app, BrowserWindow, ipcMain, shell, dialog } = require("electron")
const path = require("path")
const isDev = require('electron-is-dev')

console.log('💩')

//to manage double opening of app during installation using Squirrel
if (require('electron-squirrel-startup')) {
    app.quit()
    process.exit(0)
}

let mainWindow;

//protocol (external) access

if (isDev && process.platform === 'win32') {
    // Set the path of electron.exe and your app.
    // These two additional parameters are only available on windows.
    // Setting this is required to get this working in dev mode.
    app.setAsDefaultProtocolClient('pdf-lookie', process.execPath, [path.resolve(process.argv[1])])
    console.log("I'm in dev mode lol")
  } else if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('pdf-lookie', process.execPath, [path.resolve(process.argv[1])])
    }
    console.log("default app")
} else {
    app.setAsDefaultProtocolClient('pdf-lookie')
    console.log("normal?")
}

const gotTheLock = app.requestSingleInstanceLock()

const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
}

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
            var myUrl = commandLine[3]
            mainWindow.webContents.send('url-protocol', myUrl)
        }
    })

    // Create mainWindow, load the rest of the app, etc...
    app.whenReady().then(() => {
        ipcMain.on('url-protocol', (_event, value) => {
            console.log(value) 
        })
        createWindow();
    })

    app.on('open-url', (event, url) => {
        dialog.showErrorBox('Welcome Back', `You arrived from: ${url}`)
    })
}

function createWindow () {
    mainWindow = new BrowserWindow({
        width : 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    });

    mainWindow.loadFile("index.html")
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('open-url', (event, url) => {
    replaceText('launch-url', `You arrived from: ${url}`)
})

// Handle window controls via IPC
ipcMain.on('shell:open', () => {
  const pageDirectory = __dirname.replace('app.asar', 'app.asar.unpacked')
  const pagePath = path.join('file://', pageDirectory, 'index.html')
  shell.openExternal(pagePath)
})

ipcMain.on('url-protocol', (_event, value) => {
    console.log(value) // will print value to Node console
})
