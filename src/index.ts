import globby from 'globby';
import { IgApiClient, SavedFeedResponseMedia } from 'instagram-private-api';
// import fs from 'fs-extra'; // error with pkg, using mkdirp.
import mkdirp from 'mkdirp';
import { DownloaderHelper } from 'node-downloader-helper';
import nodeNotifier from 'node-notifier';
import prompts from 'prompts';
import { getDateDirName, getFilename, getMediaUserDateDirRelPath } from './pathsAndNames';
import { keypress } from './utils';


const programName = 'Instagram Saver - by SrBrahma';

// TODO add https://github.com/Teamwork/node-auto-launch ?

const ig = new IgApiClient();


let newMediaCount = 0;
let totalMediaCount = 0;

const prettyMediaCounterZeroPads = 4;
/** COf0dN0M8pU = 11 chars
 *
 * We add 1 to be prettier for common users.
*/
function getPrettyMediaCounter(code: string) {
  return `[${String(newMediaCount + 1).padStart(prettyMediaCounterZeroPads, '0')}, ${code}]`;
}


const previousUserFiles: Record<string, string[] | undefined> = {};



async function alreadyExists({ code, date, username, carouselCounter, author }: {
  author: string;
  code: string;
  date: Date;
  carouselCounter?: number;
  username: string;
}): Promise<boolean> {

  const dirName = getDateDirName({ date });

  if (!previousUserFiles[dirName])
    previousUserFiles[dirName] = await globby('*', {
      cwd: getMediaUserDateDirRelPath({ username, date }),
    });

  const filename = getFilename({ author, code, date, carouselCounter });

  // Note that the filename doesn't include the extension.
  /** -1 if no match is found, the file is new. */
  const index: number = previousUserFiles[dirName]?.findIndex((existingFilename) => existingFilename.includes(filename))
    ?? -1;

  if (index !== -1) {
    previousUserFiles[dirName]!.splice(index, 1); // Remove it for faster finding of next items
    return true;
  }
  return false;
}



/** Will store on the local machine the media. */
async function saveMediaFile({ code, date, url, username, carouselCounter, author }: {
  author: string;
  code: string;
  date: Date;
  url: string;
  carouselCounter?: number;
  username: string;
}) {
  // If we need, we can fetch the file extension from the url with the regex "/\.\w+\?/". This will output for ex ".mp4"
  const outDirPath = getMediaUserDateDirRelPath({ username, date });

  await mkdirp(outDirPath);

  const filename = getFilename({ author, code, date, carouselCounter });

  const download = new DownloaderHelper(url, outDirPath, {
    fileName: { name: filename } as any,
    override: true,
  });

  await download.start();
}


// Using if/elseif instead of switches because they were looking ugly.
async function parseData({ data, username }: {
  data: SavedFeedResponseMedia;
  username: string;
}): Promise<void> {

  /** Stores the file if not already stored. */
  async function saveIfDontExist({ url, storingMessage, carouselCounter }: {
    url: string;
    /** If file doesn't exist, will print this before storing the file. The media counter
     * will be appended to the beggining of the string. */
    storingMessage: string;
    carouselCounter?: number;
  }): Promise<void> {
    if (!(await alreadyExists({ code, date, username, author, carouselCounter }))) {
      console.log(`${getPrettyMediaCounter(code)} ${storingMessage}`);
      await saveMediaFile({ code, url, date, username, author, carouselCounter });
      newMediaCount++; // New file!
    }
    totalMediaCount++;
  }

  // https://stackoverflow.com/a/55022113/10247962
  const date = new Date(data.taken_at * 1000);
  const code = data.code; // shorter than data.id
  const author = data.user.username;

  if (data.media_type === 1) { // Photo/Image
    // Get first / largest / original image
    const url = data.image_versions2?.candidates[0]?.url;
    if (!url)
      throw `Image without url! Media code = ${code}`;
    await saveIfDontExist({ url, storingMessage: 'Salvando imagem...' });
  } else if (data.media_type === 2) { // Video
    const url = data.video_versions?.[0]?.url;
    if (!url)
      throw `Video without url! Media code = ${code}`;
    await saveIfDontExist({ url, storingMessage: 'Salvando v??deo...' });
  } else if (data.media_type === 8) { // Caroussel
    const carousel_media = data.carousel_media ?? [];
    let carouselCounter = 1;

    for (const media of carousel_media) {

      if (media.media_type === 1) { // Photo/Image
        const url = media.image_versions2.candidates[0]?.url;
        if (!url)
          throw `Image without URL! Carousel code = ${code}, counter = ${carouselCounter}`;
        await saveIfDontExist({
          url, carouselCounter,
          storingMessage: `Salvando imagem do carrossel (${carouselCounter++})...`,
        });
      } else if (media.media_type === 2) { // Video
        const url = media.video_versions?.[0]?.url;
        if (!url)
          throw `Video without url! Carousel code = ${code}, counter = ${carouselCounter}`;

        await saveIfDontExist({
          url, carouselCounter,
          storingMessage: `Salvando v??deo do carrossel (${carouselCounter++})...`,
        });
      } else {
        throw `Unknown media_type = ${media.media_type} inside the carousel of code =${code}`;
      }

    } // End of carousel for

  } // End of carousel if

  else {
    throw `Unknown media_type = ${data.media_type}), media code = ${code}`;
  }

}





async function main() {
  console.log(`-=- ${programName} -=-`);

  let logged = false;
  let username: string = '';
  let password: string = '';

  do {
    try {

      // https://flaviocopes.com/javascript-destructure-object-to-existing-variable/
      ({ username, password } = await prompts([
        {
          message: 'Digite o nome do usu??rio',
          type: 'text',
          name: 'username',
        }, {
          message: 'Digite a senha',
          type: 'password',
          name: 'password',
        },
      ]));

      ig.state.generateDevice(username);

      console.log('Fazendo login...');
      await ig.simulate.preLoginFlow();
      /** const loggedInUser = */ await ig.account.login(username, password);

      logged = true;

    } catch (err) {
      console.error(err.message ?? err);
    }
  } while (!logged);


  // Optionally wrap it to process.nextTick so we dont need to wait ending of this bunch of requests
  process.nextTick(async () => await ig.simulate.postLoginFlow());


  console.log('Obtendo lista de m??das salvas...');
  // https://stackoverflow.com/a/58759660/10247962
  const savedFeed = ig.feed.saved();

  // Parse all medias
  do {
    const savedPosts = await savedFeed.items();
    for (const data of savedPosts)
      await parseData({ data, username });
  }
  while (savedFeed.isMoreAvailable());


  // Create the final text
  let finalText;

  if (newMediaCount === 0)
    finalText = `Conclu??do! N??o h?? m??dias novas para serem armazenadas. O total de m??dias salvas ?? ${totalMediaCount}.`;
  else {
    const newText = newMediaCount === 1
      ? `Foi armazenada 1 m??dia nova`
      : `Foram armazenadas ${newMediaCount} m??dias novas`;
    const totalText = totalMediaCount === 1 // no need to check 0, 0 would also fall in `newMediaCount === 0`
      ? `1 m??dia salva`
      : `${totalMediaCount} m??dias salvas`;
    finalText = `Conclu??do! ${newText} de um total de ${totalText}.`;
  }

  // Print the final text
  console.log(finalText);

  // Notify the user beyond just the terminal
  // error in widnows. not using it.
  nodeNotifier.notify({
    title: programName,
    message: finalText, // Same as the print. I didn't have any better idea for the text.
  });

  // Press key to exit. Useful for windows, that will autoclose the terminal
  console.log('Pressione qualquer tecla para fechar o programa.');
  await keypress();
}


main()
  .catch(async (err) => {
    console.error(err.message ?? err);
    nodeNotifier.notify({
      title: programName,
      message: 'Erro! Leia o terminal.',
    });

    // Press key to exit. Useful for windows, that will autoclose the terminal
    console.log('Pressione qualquer tecla para fechar o programa.');
    await keypress();

    process.exit(1);
  });