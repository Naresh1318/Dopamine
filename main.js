let {app, BrowserWindow} = require('electron');
// require('electron-reload')(__dirname);

let win = null;

function createWindow() {
    win = new BrowserWindow({
        width: 1200, 
        height: 800,
        icon: __dirname + "/resources/icons/icon.png"});
    win.setMenuBarVisibility(true);
    win.loadFile("./templates/index.html");
    // win.webContents.openDevTools();
    win.on("closed", () => {
        win = null;
    });
    // win.setMenu(null);
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
