import fs from 'node:fs';
import path from 'node:path';
import type { dh as DhType } from '@deephaven/jsapi-types';

import { downloadFromURL, urlToDirectoryName } from './serverUtils.js';
import { polyfillWs } from './polyfillWs.js';
import { ensureDirectoriesExist, getDownloadPaths } from './fsUtils.js';
import { HttpError } from './errorUtils.js';

type NonEmptyArray<T> = [T, ...T[]];

const DH_CORE_MODULE = 'jsapi/dh-core.js' as const;
const DH_INTERNAL_MODULE = 'jsapi/dh-internal.js' as const;

/** Transform downloaded content */
export type PostDownloadTransform = (
  serverPath: string,
  content: string,
  error?: unknown
) => string;

export type LoadModuleOptions = {
  serverUrl: URL;
  serverPaths: NonEmptyArray<string>;
  download: boolean | PostDownloadTransform;
  storageDir: string;
  targetModuleType: 'esm' | 'cjs';
  handleErrorsInPostDownload?: boolean;
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
 * @param handleErrorsInPostDownload If set to true, download errors will be
 * caught and passed to the `PostDownloadTransform` function. If false (default),
 * download errors will be thrown.
 * @returns The default export of the first module in `serverPaths`.
 */
export async function loadModules<TMainModule>({
  serverUrl,
  serverPaths,
  download,
  storageDir,
  targetModuleType,
  handleErrorsInPostDownload,
}: LoadModuleOptions): Promise<TMainModule> {
  polyfillWs();

  const serverStorageDir = path.join(storageDir, urlToDirectoryName(serverUrl));

  if (download !== false) {
    ensureDirectoriesExist([serverStorageDir]);

    // Download from server
    const serverUrls = serverPaths.map(
      serverPath => new URL(serverPath, serverUrl)
    );

    const downloadPromises = serverUrls.map(url => downloadFromURL(url));

    let contents: string[];

    if (typeof download !== 'function' || handleErrorsInPostDownload !== true) {
      contents = await Promise.all(downloadPromises);
    } else {
      const results = await Promise.allSettled(downloadPromises);
      contents = results.map((result, i) => {
        if (result.status === 'fulfilled') {
          // Post-download transform
          return download(serverPaths[i], result.value);
        }

        if (handleErrorsInPostDownload === true) {
          // Post-download transform that also handles errors
          return download(serverPaths[i], '', result.reason);
        }

        throw result.reason;
      });
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

/**
 * Load `jsapi/dh-core.js` and `jsapi/dh-internal.js` modules from a Core Server.
 * @param serverUrl The URL of the server to load from.
 * @param storageDir The directory to store the downloaded modules.
 * @param targetModuleType The type of module to load. Can be either 'esm' or 'cjs'.
 * @returns The default export the `jsapi/dh-core.js` module.
 */
export async function loadDhModules({
  serverUrl,
  storageDir,
  targetModuleType,
}: Pick<
  LoadModuleOptions,
  'serverUrl' | 'storageDir' | 'targetModuleType'
>): Promise<typeof DhType> {
  if (targetModuleType === 'esm') {
    // These are needed in `esm` output until JSAPI is updated to not rely on
    // `window` and `self`.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis.self = globalThis;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    globalThis.window = globalThis;
  }

  const coreModule = await loadModules<
    typeof DhType & { default?: typeof DhType }
  >({
    serverUrl,
    serverPaths: [DH_CORE_MODULE, DH_INTERNAL_MODULE],
    storageDir,
    targetModuleType,
    handleErrorsInPostDownload: true,
    download:
      targetModuleType === 'esm'
        ? // ESM does not need any transformation since the server modules are already ESM.
          true
        : // CJS needs a post-download transform to convert the ESM modules to CJS.
          (serverPath, content, error) => {
            if (serverPath === DH_CORE_MODULE) {
              return content
                .replace(
                  `import {dhinternal} from './dh-internal.js';`,
                  `const {dhinternal} = require("./dh-internal.js");`
                )
                .replace(`export default dh;`, `module.exports = dh;`);
            }

            if (serverPath === DH_INTERNAL_MODULE) {
              if (error != null) {
                // `dh-internal.js` module is being removed from future versions
                // of DH core, but there's not a great way for this library to
                // know whether it's present or not. Treat 404s as empty content
                // to make things compatible with both configurations.
                if (error instanceof HttpError && error.statusCode === 404) {
                  return '';
                }

                throw error;
              }

              return content.replace(
                `export{__webpack_exports__dhinternal as dhinternal};`,
                `module.exports={dhinternal:__webpack_exports__dhinternal};`
              );
            }

            return content;
          },
  });

  // ESM uses `default` export. CJS does not.
  return coreModule.default ?? coreModule;
}
