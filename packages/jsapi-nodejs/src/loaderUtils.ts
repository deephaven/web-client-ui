import fs from 'node:fs';
import path from 'node:path';

import { downloadFromURL, urlToDirectoryName } from './serverUtils.js';
import { polyfillWs } from './polyfillWs.js';
import { ensureDirectoriesExist, getDownloadPaths } from './fsUtils.js';

type NonEmptyArray<T> = [T, ...T[]];

/** Transform downloaded content */
export type PostDownloadTransform = (
  serverPath: string,
  content: string
) => string;

export type LoadModuleOptions = {
  serverUrl: URL;
  serverPaths: NonEmptyArray<string>;
  download: boolean | PostDownloadTransform;
  storageDir: string;
  targetModuleType: 'esm' | 'cjs';
};

/**
 * Load a list of modules from a server.
 * @param serverUrl The URL of the server to load from.
 * @param serverPaths The paths of the modules on the server.
 * @param download Whether to download the modules from the server. If set to false,
 * it's assumed that the modules have already been downloaded and still exist in
 * the storage directory. If set to `true` or a `PostDownloadTransform` function,
 * the modules will be downloaded and stored. If set to a `PostDownloadTransform`
 * function, the downloaded content will be passed to the function and the result
 * saved to disk.
 * @param storageDir The directory to store the downloaded modules.
 * @param targetModuleType The type of module to load. Can be either 'esm' or 'cjs'.
 * @returns The default export of the first module in `serverPaths`.
 */
export async function loadModules<TMainModule>({
  serverUrl,
  serverPaths,
  download,
  storageDir,
  targetModuleType,
}: LoadModuleOptions): Promise<TMainModule> {
  polyfillWs();

  const serverStorageDir = path.join(storageDir, urlToDirectoryName(serverUrl));

  if (download !== false) {
    ensureDirectoriesExist([serverStorageDir]);

    // Download from server
    const serverUrls = serverPaths.map(
      serverPath => new URL(serverPath, serverUrl)
    );
    let contents = await Promise.all(
      serverUrls.map(url => downloadFromURL(url))
    );

    // Post-download transform
    if (typeof download === 'function') {
      contents = contents.map((content, i) =>
        download(serverPaths[i], content)
      );
    }

    // Write to disk
    const downloadPaths = getDownloadPaths(serverStorageDir, serverPaths);
    downloadPaths.forEach((downloadPath, i) => {
      fs.writeFileSync(downloadPath, contents[i]);
    });
  }

  // We assume the first module is the main module
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const firstFileName = serverPaths[0].split('/').pop()!;
  const mainModulePath = path.join(serverStorageDir, firstFileName);

  if (targetModuleType === 'esm') {
    return import(mainModulePath);
  }

  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(mainModulePath);
}

export default loadModules;
