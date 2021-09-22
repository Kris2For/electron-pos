const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')
const contextMenu = require('electron-context-menu');

contextMenu({
    showInspectElement: false,
    showSearchWithGoogle: false,
    prepend: (defaultActions, parameters, browserWindow) => [{
        label: 'Search Google for “{selection}”',
        // Only show it when right-clicking text
        visible: parameters.selectionText.trim().length > 0,
        click: () => {
            shell.openExternal(`https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`);
        }
    }]
});

Menu.setApplicationMenu(false)

let win = null

const singleton = app.requestSingleInstanceLock()
if (!singleton) {
    app.quit()
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (win) {
            if (win.isMinimized()) {
                win.restore()
            }
            win.focus()
        }
    })
    app.on("ready", () => {
        createWindow()
    });
}

function createWindow() {

    win = new BrowserWindow({
        width: 1650,
        height: 1000,
        minwidth: 1630,
        minheight: 1000,
        show: false,
        resizable: false
    })

    win.removeMenu();
    win.webContents.setUserAgent(`${win.webContents.getUserAgent()} POS-App/1.0`)

    win.loadURL(`https://google.com`)

    win.on('ready-to-show', () => {
        win.show()
    })

    win.webContents.on('new-window', function (e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });
}