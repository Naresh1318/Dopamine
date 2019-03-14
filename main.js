let {app, BrowserWindow} = require('electron');
require('electron-reload')(__dirname);

let win = null;

function createWindow() {
    win = new BrowserWindow({width: 1250, height: 850});
    win.loadFile("./templates/index.html");
    win.webContents.openDevTools();
    win.on("closed", () => {
        win = null;
    })
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (window === null) {
        createWindow();
    }
});
