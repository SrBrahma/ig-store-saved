// Won't rimraf existing data.

const {exec} = require('pkg')
const Path = require('path')
const packageName = require('../package.json').name
const distName = require('../package.json').config.distName ?? 'bin'
const fse = require('fs-extra')

const exePath = Path.join(__dirname, '..', distName);

function pathInAll(name = '') { return Path.join(exePath, 'All', distName, name) }
function pathInWin(name = '') { return Path.join(exePath, 'Windows', distName, name) }
function pathInLinux(name = '') { return Path.join(exePath, 'Linux', distName, name) }
function pathInMacOS(name = '') { return Path.join(exePath, 'MacOS', distName, name) }


(async () => {
  // Build the executables
  await exec([
    Path.join(__dirname, '..'),
    // Path.join(__dirname, '..', 'dist', 'index.js'),
  // '--out-path', execPath
])

  // Copy contents
  // fse.copySync(Path.join(__dirname, '..', 'copyToExe'), pathInExec(''))

  fse.copySync(pathInAll(packageName + '-win.exe'), pathInWin(distName + '.exe'));
  fse.copySync(pathInAll(packageName + '-linux'), pathInLinux(distName));
  fse.copySync(pathInAll(packageName + '-macos'), pathInMacOS(distName));

})()

// // Rename them. pkg still dont allow renaming them individually.
// fse.renameSync( pathInExec('index-linux'), pathInExec(`${distName} Linux`) )
// fse.renameSync( pathInExec('index-win.exe'), pathInExec(`${distName}.exe`) )
// fse.renameSync( pathInExec('index-macos'), pathInExec(`${distName} MacOS`) )