const {exec} = require('pkg')
const Path = require('path')
const packageName = require('../package.json').name
const distDir = require('../package.json').config.distDir
const fse = require('fs-extra')


if (!distDir)
  throw new Error('distName is not set!')


const exePath = Path.join(__dirname, '..', distDir);
const pathAll = Path.join(exePath, 'All')

function pathInAll(name = '') { return Path.join(pathAll, distDir, name) }
function pathInWin(name = '') { return Path.join(exePath, 'Windows', distDir, name) }
function pathInLinux(name = '') { return Path.join(exePath, 'Linux', distDir, name) }
function pathInMacOS(name = '') { return Path.join(exePath, 'MacOS', distDir, name) }


(async () => {

  // Ensure we cleaned previous build.
  fse.remove(exePath)

  // Build the executables. exec is a function from pkg package, not execa!
  await exec([Path.join(__dirname, '..'), '-C', 'Brotli'])
    // Path.join(__dirname, '..', 'dist', 'index.js'),
  // '--out-path', execPath


  // Copy contents
  // fse.copySync(Path.join(__dirname, '..', 'copyToExe'), pathInExec(''))
  fse.moveSync(pathInAll(packageName + '-win.exe'), pathInWin(distDir + '.exe'));
  fse.moveSync(pathInAll(packageName + '-linux'), pathInLinux(distDir));
  fse.moveSync(pathInAll(packageName + '-macos'), pathInMacOS(distDir));

  // Remove 'All' directory.
  fse.remove(pathAll)

})()

// // Rename them. pkg still dont allow renaming them individually.
// fse.renameSync( pathInExec('index-linux'), pathInExec(`${distName} Linux`) )
// fse.renameSync( pathInExec('index-win.exe'), pathInExec(`${distName}.exe`) )
// fse.renameSync( pathInExec('index-macos'), pathInExec(`${distName} MacOS`) )