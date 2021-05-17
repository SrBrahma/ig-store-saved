import Path from 'path';
import { timestampOffsetMinutes } from './consts';

/* Dir structure
  media v1
   |- $username1
   |-|- $YYYY-MM
   |-|-|- $DD $author $mediaCode .ext // .jpg | .mp4
   |-|-|- $DD $author $mediaCode // carousel
   |-|-|-|- $carouselCounter .ext // starts from 1. .jpg | .mp4
    - $username2
      - ...
*/


/* Careful with globby: https://github.com/sindresorhus/globby/issues/155#issuecomment-727533529
 *
 * We are using relative paths and Path.posix due to the issue above. */

/** Naming it media vX so we can change the version for breaking changes without
 * messing existing local data. */
export const mediaDirName = 'media v1';

export function getMediaUserDirRelPath({ username, forcePosix = false }: {
  username: string;
  /** Set forcePosix: true for globby. Else leave false for automatic path joining */
  forcePosix?: boolean;
}): string {
  return forcePosix ? Path.posix.join('media v1', username) : Path.join('media v1', username);
}

export function getMediaUserDateDirRelPath({ username, date, forcePosix = false }: {
  username: string;
  date: Date;
  /** Set forcePosix: true for globby. Else leave false for automatic path joining */
  forcePosix?: boolean;
}): string {
  return forcePosix
    ? Path.posix.join(getMediaUserDirRelPath({ username, forcePosix }), getDirDateName({ date }))
    : Path.join(getMediaUserDirRelPath({ username, forcePosix }), getDirDateName({ date }));
}

/** Returns the YYYY-MM parent directory of the media. */
export function getDirDateName({ date }: {date: Date}): string {
  const offsettedDate = new Date(date.getTime() - (timestampOffsetMinutes * 60 * 1000));
  const YYYY_MM_DD = offsettedDate.toISOString().split('T')[0]!;
  const YYYY_MM = YYYY_MM_DD.substr(0, 7); // 2021-05
  return YYYY_MM;
}

/** Without extension. */
export function getFilename({ date, code, author }: {
  date: Date, code: string, author: string
}): string {
  // https://stackoverflow.com/a/29774197/10247962
  const offsettedDate = new Date(date.getTime() - (timestampOffsetMinutes * 60 * 1000));
  // const YYYYmmDD = offsettedDate.toISOString().split('T')[0]!;
  // const HHmmSS = offsettedDate.toISOString().split('T')[1]!.split('.')[0]!;
  const dd = String(offsettedDate.getDate()).padStart(2, '0');
  const filename = `${dd} [${author}] ${code}`;

  return filename;
}

/** Will call getFilename(). */
export function getCarouselDirName({ date, code, author }: {
  date: Date, code: string; author: string;
}): string {
  return getFilename({ date, code: code, author });
}

/** Will just return the carouselCounter as string. Won't include the file extension. */
export function getCarouselFilename({ carouselCounter }: {carouselCounter: number}): string {
  return String(carouselCounter);
}