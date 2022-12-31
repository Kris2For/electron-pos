var electron = require('electron');
var ipcRenderer = electron.ipcRenderer;

ipcRenderer.on('console-message', function (event, data) {
    console.log.apply(console, data)
});