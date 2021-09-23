
var electronInstaller = require('electron-winstaller');

// In this case, we can use relative paths
var settings = {
	appDirectory: 'POS-App-win32-x64',
	outputDirectory: 'installers',
	authors: 'Kris2For',
	exe: 'POS-App.exe',
	setupExe: 'POS-App-Setup.exe',
	noMsi: true,
	description: "POS-App"
};

resultPromise = electronInstaller.createWindowsInstaller(settings);
