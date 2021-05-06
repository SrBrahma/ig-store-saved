declare module 'nodejs-file-downloader' {

  type Config = {
      url: string;
      directory?: string;
      fileName?: string;
      cloneFiles?: boolean;
      proxy?: string;
      onProgress?: (x: any) => void;
      onResponse?: (x: any) => void;
      shouldStop?: (x: any) => void;
      onBeforeSave?: (x: any) => void;
      onError?: (x: any) => void;
      maxAttempts?: number;

    };

  class Downloader {
    constructor(args: Config);
    download: () => Promise<void>;
    cancel: () => void;
  }
}