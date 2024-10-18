import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';

import { downloadFromURL, urlToDirectoryName } from './serverUtils';
import { polyfillWs } from './polyfillWs';
import { ensureDirectoriesExist, getDownloadPaths } from './fsUtils';

type NonEmptyArray<T> = [T, ...T[]];

/**
 * Load a list of modules from a server.
 * @param serverUrl The URL of the server to load from.
 * @param serverPaths The paths of the modules on the server.
 * @param download Whether to download the modules from the server. If set to false,
 * it's assumed that the modules have already been downloaded and still exist in
 * the storage directory.
 * @param storageDir The directory to store the downloaded modules.
 * @param sourceModuleType module format from the server.
 * @param targetFormat (optional) format to be exported. Defaults to
 * sourceModuleType.
 * @returns The default export of the first module in `serverPaths`.
 */
export async function loadModules<TMainModule>({
  serverUrl,
  serverPaths,
  download,
  storageDir,
  sourceModuleType,
  targetModuleType = sourceModuleType,
}: {
  serverUrl: URL;
  serverPaths: NonEmptyArray<string>;
  download: boolean;
  storageDir: string;
  sourceModuleType: 'esm' | 'cjs';
  targetModuleType?: 'esm' | 'cjs';
}): Promise<TMainModule> {
  polyfillWs();

  const serverStorageDir = path.join(storageDir, urlToDirectoryName(serverUrl));
  const targetDir = path.join(serverStorageDir, 'target');

  if (download) {
    const needsTranspile = sourceModuleType !== targetModuleType;
    const sourceDir = path.join(serverStorageDir, 'source');

    ensureDirectoriesExist(
      needsTranspile ? [sourceDir, targetDir] : [targetDir]
    );

    // Download from server
    const serverUrls = serverPaths.map(
      serverPath => new URL(serverPath, serverUrl)
    );
    const contents = await Promise.all(
      serverUrls.map(url => downloadFromURL(url))
    );

    // Write to disk
    const downloadPaths = getDownloadPaths(
      needsTranspile ? sourceDir : targetDir,
      serverPaths
    );
    downloadPaths.forEach((downloadPath, i) => {
      fs.writeFileSync(downloadPath, contents[i]);
    });

    // Transpile if source and target module types differ
    if (needsTranspile) {
      await esbuild.build({
        entryPoints: downloadPaths,
        bundle: false,
        format: targetModuleType,
        logLevel: 'error',
        platform: 'node',
        outdir: targetDir,
      });
    }
  }

  // We assume the first module is the main module
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const firstFileName = serverPaths[0].split('/').pop()!;
  const mainModulePath = path.join(targetDir, firstFileName);

  if (targetModuleType === 'esm') {
    return import(mainModulePath);
  }

  // eslint-disable-next-line import/no-dynamic-require, global-require
  return require(mainModulePath);
}

export default loadModules;
