import { IgApiClient, SavedFeedResponseMedia } from 'instagram-private-api';
import fs from 'fs-extra';
import Path from 'path';



// TODO ignore owned media. Maybe have a file with each downloaded media id?



// import Downloader from 'nodejs-file-downloader';
import { DownloaderHelper } from 'node-downloader-helper';


const ig = new IgApiClient();

const username = 'henrique.bruno.fa';
const password = 'Mariokart#I!N@S#$%';


// maybe use __dirname
const outPath = Path.join(process.cwd(), 'data');


async function saveFile({ code, date, url }: {
  code: string;
  date: Date;
  url: string;
}) {

  // https://stackoverflow.com/a/29774197/10247962
  const offset = date.getTimezoneOffset();
  const offsettedDate = new Date(date.getTime() - (offset*60*1000));
  const YYYYmmDD = offsettedDate.toISOString().split('T')[0]!;

  const HHmmSS = offsettedDate.toISOString().split('T')[1]!.split('.')[0]!;

  const YYYYmm = YYYYmmDD.substr(0, 7); // 2021-05


  const filename = `${YYYYmmDD} ${HHmmSS} ${code}`;

  const outDirPath = Path.join(outPath, YYYYmm);
  // await fs.ensureDir(outDirPath);

  // const outFilePath = Path.join(outDirPath, 'noiceFilename.jpg');

  await fs.ensureDir(outDirPath);
  const download = new DownloaderHelper(url, outDirPath, {
    // override: ?
    fileName: {
      name: filename,
      // ext,
    } as any,
    override: true,
  });

  await download.start();
}


let mediaCounter = 1;


async function parseData(dataArray: SavedFeedResponseMedia[]): Promise<void> {

  for (const data of dataArray) {

    // https://stackoverflow.com/a/55022113/10247962
    const date = new Date(data.taken_at * 1000);
    const code = data.code; // shorter than id

    // const id = data.
    switch (data.media_type) {
    case 1: { // Photo/Image
      // Get first / largest / original image
      const url = data.image_versions2?.candidates[0]?.url;
      if (!url)
        throw `Image without url! Media id = ${data.id}`;

      console.log(`[${String(mediaCounter).padStart(4, '0')}] Salvando imagem... (code = ${code})`);
      await saveFile({ code, url, date });
      mediaCounter++;
    } break;

    case 2: { // Video
      const url = data.video_versions?.[0]?.url;
      if (!url)
        throw `Video without url! Media id = ${data.id}`;

      console.log(`[${String(mediaCounter).padStart(4, '0')}] Salvando vídeo...  (code = ${code})`);
      await saveFile({ code, url, date });
      mediaCounter++;
    } break;

    case 8:
      throw 'Media type is "caroussel", invalid! Contact the developer of this program!';

    default:
      throw `Unknown media type! Contact the developer of this program! (its value is ${data.media_type})`;

    }

  }
}


async function main() {
  console.log('-=- Instagram Saved Media Saver -=-');

  ig.state.generateDevice(username);

  console.log('Fazendo login...');
  await ig.simulate.preLoginFlow();
  /** const loggedInUser = */ await ig.account.login(username, password);
  // Optionally wrap it to process.nextTick so we dont need to wait ending of this bunch of requests
  process.nextTick(async () => await ig.simulate.postLoginFlow());

  console.log('Obtendo lista de mídas salvas...');
  // https://stackoverflow.com/a/58759660/10247962
  const savedFeed = ig.feed.saved();


  // console.log(savedFeed.)
  do {
    const savedPosts = await savedFeed.items();
    //  savedPosts.
    await parseData(savedPosts);
  }
  while (savedFeed.isMoreAvailable());

}


main()
  .then(() => {
    console.log('Concluído!');
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });