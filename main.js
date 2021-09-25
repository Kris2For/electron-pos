const { app, BrowserWindow, Menu, shell, globalShortcut, dialog } = require('electron')
const electron = require('electron')
const contextMenu = require('electron-context-menu');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

const APP_VERSION = require('./package.json').version
const server = 'https://hazel-rho-khaki.vercel.app'
const AUTO_UPDATE_URL = `${server}/update/${process.platform}/${APP_VERSION}`

const store = require('electron-json-storage');

if (handleSquirrelEvent(app)) {
    return;
}

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

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })

    app.on('activate', () => {
        if (mainWindow === null) {
            createWindow()
        }
    })
}

function isValidURL(string) {
    var res = string.match(/((http(s)?:\/\/))+([-a-zA-Z0-9@:%._\+~#=]{2,256}\.)?[a-z0-9]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
};

async function createWindow() {

    win = new BrowserWindow({
        width: 1650,
        height: 1000,
        minwidth: 1630,
        minheight: 1000,
        show: false,
        resizable: true,
        icon: 'evoicon.ico'
    })

    win.removeMenu();
    win.webContents.setUserAgent(`${win.webContents.getUserAgent()} POS-App/${APP_VERSION}`)

    if (argv.url) store.set('url', argv.url)
    let url = argv.url || store.getSync('url')

    if (url && typeof (url) === 'string' && isValidURL(url)) {
        win.loadURL(url)
    } else {
        win.loadFile('default-page/index.html')
    }

    win.on('ready-to-show', () => {
        win.show()
        if (app.isPackaged) initAutoUpdater()
    })

    win.webContents.setWindowOpenHandler(url => {
        e.preventDefault();
        shell.openExternal(url);
    });

    win.on('closed', () => {
        win = null
    })

    globalShortcut.register('CommandOrControl+Shift+I', () => {
        win.webContents.openDevTools()
    })

    globalShortcut.register('CommandOrControl+F5', () => {
        win.webContents.reloadIgnoringCache()
    })
}

function handleSquirrelEvent(application) {
    if (process.argv.length === 1) {
        return false;
    }
    const ChildProcess = require('child_process');
    const path = require('path');
    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);
    const spawn = function (command, args) {
        let spawnedProcess, error;
        try {
            spawnedProcess = ChildProcess.spawn(command, args, {
                detached: true
            });
        } catch (error) { }
        return spawnedProcess;
    };
    const spawnUpdate = function (args) {
        return spawn(updateDotExe, args);
    };
    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated':
            // Optionally do things such as:
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus
            // Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName]);
            setTimeout(application.quit, 1000);
            return true;
        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers
            // Remove desktop and start menu shortcuts
            spawnUpdate(['--removeShortcut', exeName]);
            setTimeout(application.quit, 1000);
            return true;
        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated
            application.quit();
            return true;
    }
};

function initAutoUpdater() {
    if (process.platform !== 'linux') {
        // Ask the user if he wants to update if update is available
        electron.autoUpdater.on(
            'update-downloaded',
            (event, releaseNotes, releaseName) => {
                dialog.showMessageBox(win, {
                    type: 'question',
                    buttons: ['Update', 'Cancel'],
                    defaultId: 0,
                    message: `A new version is available, do you want to install it now?`,
                    title: 'Update available'
                }, response => {

                    if (response === 0) {
                        electron.autoUpdater.quitAndInstall()
                    }
                })
            }
        )

        electron.autoUpdater.setFeedURL(AUTO_UPDATE_URL)
        electron.autoUpdater.checkForUpdates()
    }
}