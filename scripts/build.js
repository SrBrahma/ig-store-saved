const {exec} = require('pkg')
const Path = require('path')
const packageName = require('../package.json').name
const distDir = require('../package.json').config.distDir
const fse = require('fs-extra')


if (!distDir)
  throw new Error('distName is not set!')

const pathRoot = Path.join(__dirname, '..');
const pathVendor = Path.join(pathRoot, 'node_modules', 'node-notifier', 'vendor')
const exePath = Path.join(pathRoot, distDir);
const pathAll = Path.join(exePath, 'All');

function pathInAll(name = '') { return Path.join(pathAll, distDir, name) }
function pathInWin(name = '') { return Path.join(exePath, 'Windows', distDir, name) }
function pathInLinux(name = '') { return Path.join(exePath, 'Linux', distDir, name) }
function pathInMacOS(name = '') { return Path.join(exePath, 'MacOS', distDir, name) }


(async () => {

  // Ensure cleansing previous build
  fse.remove(exePath)

  // Build the executables. exec is a function from pkg package, not execa!
  await exec([Path.join(__dirname, '..'), '-C', 'Brotli'])

  // Copy contents
  fse.copySync(Path.join(__dirname, '..', 'copyToExe'), pathInExec(''))
  fse.moveSync(pathInAll(packageName + '-win.exe'), pathInWin(distDir + '.exe'));
  fse.moveSync(pathInAll(packageName + '-linux'), pathInLinux(distDir));
  fse.moveSync(pathInAll(packageName + '-macos'), pathInMacOS(distDir));

  // Mac notifier
  fse.copySync(Path.join(
    pathVendor, 'mac.noindex', 'terminal-notifier.app', 'Contents', 'MacOS', 'terminal-notifier'),
    pathInMacOS(Path.join('notifier', 'terminal-notifier'))
  );

  // Win notifier
  fse.copySync(Path.join(pathVendor, 'notifu', 'notifu.exe'), pathInWin(Path.join('notifier', 'notifu.exe')))
  fse.copySync(Path.join(pathVendor, 'notifu', 'notifu64.exe'), pathInWin(Path.join('notifier', 'notifu64.exe')))
  fse.copySync(Path.join(pathVendor, 'snoreToast', 'snoretoast-x86.exe'), pathInWin(Path.join('notifier', 'snoretoast-x86.exe')))
  fse.copySync(Path.join(pathVendor, 'snoreToast', 'snoretoast-x64.exe'), pathInWin(Path.join('notifier', 'snoretoast-x64.exe')))

  // Remove 'All' directory.
  fse.remove(pathAll)

})()