import JSZip from 'jszip';
import dh from '@deephaven/jsapi-shim';
import { store } from '@deephaven/redux';
import type { LogHistory } from '@deephaven/log';

const FILENAME_DATE_FORMAT = 'yyyy-MM-dd-HHmmss';

// List of objects to blacklist
// '' represents the root object
export const DEFAULT_PATH_BLACKLIST: string[][] = [
  ['api'],
  ['client'],
  ['dashboardData', 'default', 'connection'],
  ['dashboardData', 'default', 'sessionWrapper', 'dh'],
  ['layoutStorage'],
  ['storage'],
];

function stringifyReplacer(blacklist: string[][]) {
  // modified from:
  // https://stackoverflow.com/questions/61681176/json-stringify-replacer-how-to-get-full-path
  const pathMap = new Map();
  // replacer function is also called for the initial object, key is ""
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#the_replacer_parameter

  return function replacer(this: unknown, key: string, value: unknown) {
    // get and store path
    const currPath = [...(pathMap.get(this) ?? []), key];
    if (value === Object(value)) pathMap.set(value, [...currPath]);
    currPath.shift();

    // check blacklists
    for (let i = 0; i < blacklist.length; i += 1) {
      if (
        currPath.length === blacklist[i].length &&
        currPath.every((v, index) => v === blacklist[i][index])
      ) {
        // blacklist match
        return undefined;
      }
    }

    // not in blacklist, return value
    return value;
  };
}

/**
 * Returns a new object that is safe to stringify
 * All circular references are replaced by the path to the value creating a circular ref
 * A circular ref will display 'Circular ref to root.someKey' in place of the circular ref
 * All BigInts are replaced with their toString since BigInts error JSON.stringify
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Exceptions
 *
 * This tries to stringify each key of the object as an easy way to determine if it is safe
 * If it fails to stringify, then the values that failed repeat the same steps recursively
 * The unsafe objects are kept in a map with their path (e.g. root.someKey.someOtherKey)
 * Then if the object is seen again, it must be a circular ref since that object could not be stringified safely
 *
 * @param obj Object to make safe to stringify
 * @param blacklist List of JSON paths to blacklist. A JSON path is a list representing the path to that value (e.g. client.data would be `['client', 'data']`)
 */
function makeSafeToStringify(
  obj: Record<string, unknown>,
  blacklist: string[][],
  path = 'root',
  potentiallyCircularValues: Map<Record<string, unknown>, string> = new Map([
    [obj, ''],
  ])
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, val]) => {
    try {
      JSON.stringify(val, stringifyReplacer(blacklist));
      output[key] = val;
    } catch (e) {
      // The value must be a Circular object or BigInt here
      const valRecord = val as Record<string, unknown>;

      if (typeof val === 'bigint') {
        output[key] = val.toString();
      } else if (potentiallyCircularValues.has(valRecord)) {
        // We've seen this object before, so it's a circular ref
        output[key] = `Circular ref to ${potentiallyCircularValues.get(
          valRecord
        )}`;
      } else {
        // Haven't seen the object before, but somewhere in it there is a circular ref
        // The ref could point to this object or just to another child
        const curPath = `${path}.${key}`;
        potentiallyCircularValues.set(valRecord, curPath);
        output[key] = makeSafeToStringify(
          val as Record<string, unknown>,
          blacklist,
          curPath,
          potentiallyCircularValues
        );
      }
    }
  });

  return output;
}

function getReduxDataString(blacklist: string[][]): string {
  const reduxData = store.getState();
  return JSON.stringify(
    makeSafeToStringify(reduxData, blacklist),
    stringifyReplacer(blacklist),
    2 // Indent w/ 2 spaces
  );
}

function getMetadata(metadata?: Record<string, unknown>): string {
  return JSON.stringify(metadata, null, 2);
}

/**
 * Export support logs with the given name.
 * @param fileNamePrefix The zip file name without the .zip extension. Ex: test will be saved as test.zip
 * @param metadata Additional metadata to include in the metadata.json file
 * @param blacklist List of JSON paths to blacklist. A JSON path is a list representing the path to that value (e.g. client.data would be `['client', 'data']`)
 * @returns A promise that resolves successfully if the log archive is created and downloaded successfully, rejected if there's an error
 */
export async function exportLogs(
  logHistory: LogHistory,
  fileNamePrefix = `${dh.i18n.DateTimeFormat.format(
    FILENAME_DATE_FORMAT,
    new Date()
  )}_support_logs`,
  metadata?: Record<string, unknown>,
  blacklist: string[][] = DEFAULT_PATH_BLACKLIST
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(fileNamePrefix) as JSZip;
  folder.file('console.txt', logHistory.getFormattedHistory());
  folder.file('redux.json', getReduxDataString(blacklist));
  if (metadata != null) {
    folder.file('metadata.json', getMetadata(metadata));
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileNamePrefix}.zip`;
  link.click();
}
