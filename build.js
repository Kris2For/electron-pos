
var electronInstaller = require('electron-winstaller');

// In this case, we can use relative paths
var settings = {
	appDirectory: 'POS-App-win32-x64',
	outputDirectory: 'installers',
	authors: 'Kris2For',
	exe: 'POS-App.exe',
	setupExe: 'POS-App-Setup.exe',
	noMsi: true,
	description: 'POS-App',
	iconURL: 'https://www.evocycles.co.nz/image/favicon2.png',
	setupIcon: 'evoicon.ico'
};

resultPromise = electronInstaller.createWindowsInstaller(settings);
