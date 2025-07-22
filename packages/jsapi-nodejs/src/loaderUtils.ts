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
  content: string
) => string;

export type PostDownloadErrorTransform = (
  serverPath: string,
  error: unknown
) => string;

export type LoadModuleOptions = {
  serverUrl: URL;
  serverPaths: NonEmptyArray<string>;
  storageDir: string;
  targetModuleType: 'esm' | 'cjs';
} & (
  | { download: false }
  | {
      download: true | PostDownloadTransform;
      errorTransform?: PostDownloadErrorTransform;
    }
);

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
 * @param errorTransform Optional function to transform errors that occur during
 * the download process. If not provided, errors will be thrown.
 * @param storageDir The directory to store the downloaded modules.
 * @param targetModuleType The type of module to load. Can be either 'esm' or 'cjs'.
 * @returns The default export of the first module in `serverPaths`.
 */
export async function loadModules<TMainModule>(
  options: LoadModuleOptions
): Promise<TMainModule> {
  polyfillWs();

  const { serverUrl, serverPaths, storageDir, targetModuleType } = options;

  const serverStorageDir = path.join(storageDir, urlToDirectoryName(serverUrl));

  if (options.download !== false) {
    ensureDirectoriesExist([serverStorageDir]);

    // Handle rejected Promise from download
    const handleRejected = (reason: unknown, i: number): string => {
      if (typeof options.errorTransform === 'function') {
        return options.errorTransform(serverPaths[i], reason);
      }

      throw reason;
    };

    // Handle resolved Promise from download
    const handleResolved = (value: string, i: number): string => {
      if (typeof options.download === 'function') {
        return options.download(serverPaths[i], value);
      }

      return value;
    };

    // Download from server
    const serverUrls = serverPaths.map(
      serverPath => new URL(serverPath, serverUrl)
    );

    const settledResults = await Promise.allSettled(
      serverUrls.map(url => downloadFromURL(url))
    );

    const contents: string[] = settledResults.map((result, i) =>
      result.status === 'rejected'
        ? handleRejected(result.reason, i)
        : handleResolved(result.value, i)
    );

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

  // If target module type is `cjs`, we need to transform the downloaded content
  // by replaing some ESM specific syntax with CJS syntax.
  const cjsDownloadTransform: PostDownloadTransform = (
    serverPath: string,
    content: string
  ): string => {
    if (serverPath === DH_CORE_MODULE) {
      return content
        .replace(
          `import {dhinternal} from './dh-internal.js';`,
          `const {dhinternal} = require("./dh-internal.js");`
        )
        .replace(`export default dh;`, `module.exports = dh;`);
    }

    if (serverPath === DH_INTERNAL_MODULE) {
      return content.replace(
        `export{__webpack_exports__dhinternal as dhinternal};`,
        `module.exports={dhinternal:__webpack_exports__dhinternal};`
      );
    }

    return content;
  };

  // `dh-internal.js` module is being removed from future versions of DH core,
  // but there's not a great way for this library to know whether it's present
  // or not. Treat 404s as empty content to make things compatible with both
  // configurations.
  const errorTransform: PostDownloadErrorTransform = (
    serverPath: string,
    error: unknown
  ): string => {
    if (
      serverPath === DH_INTERNAL_MODULE &&
      error instanceof HttpError &&
      error.statusCode === 404
    ) {
      return '';
    }

    throw error;
  };

  const coreModule = await loadModules<
    typeof DhType & { default?: typeof DhType }
  >({
    serverUrl,
    serverPaths: [DH_CORE_MODULE, DH_INTERNAL_MODULE],
    storageDir,
    targetModuleType,
    // Download the module and transform it if the target module type is `cjs`.
    download: targetModuleType === 'esm' ? true : cjsDownloadTransform,
    errorTransform,
  });

  // ESM uses `default` export. CJS does not.
  return coreModule.default ?? coreModule;
}
