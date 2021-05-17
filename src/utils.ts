import readline from 'readline';


/** Resolves on any keypress.
 *
 * https://stackoverflow.com/a/49959557/10247962, but read below:
 *
  https://github.com/terkelg/prompts/issues/312#issuecomment-841560055 */

export const keypress = (): Promise<void> => {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, escapeCodeTimeout: 50 });
    readline.emitKeypressEvents(process.stdin, rl);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const listener = () => {
      // console.log('key', key);
      process.stdin.removeListener('keypress', listener);
      process.stdin.setRawMode(false);
      rl.close();
      resolve();
    };
    process.stdin.on('keypress', listener);
  });
};