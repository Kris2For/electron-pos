const { app, BrowserWindow, Menu, shell, globalShortcut } = require('electron')
const path = require('path')
const contextMenu = require('electron-context-menu');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const updater = require('./updater')


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
        updater.init()
        createWindow()

        globalShortcut.register('CommandOrControl+Shift+I', () => {
            win.webContents.openDevTools()
        })

        globalShortcut.register('CommandOrControl+F5', () => {
            win.webContents.reloadIgnoringCache()
        })
    });
}

function isValidURL(string) {
    var res = string.match(/((http(s)?:\/\/))+([-a-zA-Z0-9@:%._\+~#=]{2,256}\.)?[a-z0-9]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    return (res !== null)
};

function createWindow() {

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
    win.webContents.setUserAgent(`${win.webContents.getUserAgent()} POS-App/1.0`)

    if (argv.url && isValidURL(argv.url)) {
        win.loadURL(argv.url)
    } else {
        win.loadFile('index.html')
    }

    win.on('ready-to-show', () => {
        win.show()
    })

    win.webContents.on('new-window', function (e, url) {
        e.preventDefault();
        shell.openExternal(url);
    });

    win.on('close', function (e) {
        app.quit()
    });
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