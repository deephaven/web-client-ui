import JSZip from 'jszip';
import type LogHistory from './LogHistory';

// List of objects to blacklist
// '' represents the root object
// * represents a wildcard key
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
    if (isOnBlackList(currPath, blacklist)) {
      return undefined;
    }

    if (value instanceof Map) {
      return Array.from(value.entries());
    }

    // not in blacklist, return value
    return value;
  };
}

function isOnBlackList(currPath: string[], blacklist: string[][]): boolean {
  for (let i = 0; i < blacklist.length; i += 1) {
    if (
      currPath.length === blacklist[i].length &&
      currPath.every(
        (v, index) => blacklist[i][index] === '*' || v === blacklist[i][index]
      )
    ) {
      // blacklist match
      return true;
    }
  }
  return false;
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
    [obj, 'root'],
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
        // Convert the path to an array and remove the root
        const curPathArray = curPath.split('.').slice(1);
        // If the path is on the blacklist, it will eventually be replaced by undefined, so avoid the recursive call
        if (!isOnBlackList(curPathArray, blacklist)) {
          output[key] = makeSafeToStringify(
            val as Record<string, unknown>,
            blacklist,
            curPath,
            potentiallyCircularValues
          );
        }
      }
    }
  });

  return output;
}

export function getReduxDataString(
  reduxData: Record<string, unknown>,
  blacklist: string[][] = []
): string {
  return JSON.stringify(
    makeSafeToStringify(reduxData, blacklist),
    stringifyReplacer(blacklist),
    2 // Indent w/ 2 spaces
  );
}

function getFormattedMetadata(metadata?: Record<string, unknown>): string {
  return JSON.stringify(metadata, null, 2);
}

/** Format a date to a string that can be used as a file name
 * @param date Date to format
 * @returns A string formatted as YYYY-MM-DD-HHMMSS
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}-${h}${m}${s}`;
}

/**
 * Export support logs with the given name.
 * @param logHistory Log history to include in the console.txt file
 * @param metadata Additional metadata to include in the metadata.json file
 * @param reduxData Redux data to include in the redux.json file
 * @param blacklist List of JSON paths to blacklist in redux data. A JSON path is a list representing the path to that value (e.g. client.data would be `['client', 'data']`). Wildcards (*) are accepted in the path.
 * @param fileNamePrefix The zip file name without the .zip extension. Ex: test will be saved as test.zip
 * @returns A promise that resolves successfully if the log archive is created and downloaded successfully, rejected if there's an error
 */
export async function exportLogs(
  logHistory: LogHistory,
  metadata?: Record<string, unknown>,
  reduxData?: Record<string, unknown>,
  blacklist: string[][] = DEFAULT_PATH_BLACKLIST,
  fileNamePrefix = `${formatDate(new Date())}_support_logs`
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(fileNamePrefix) as JSZip;
  folder.file('console.txt', logHistory.getFormattedHistory());
  if (metadata != null) {
    folder.file('metadata.json', getFormattedMetadata(metadata));
  }
  if (reduxData != null) {
    folder.file('redux.json', getReduxDataString(reduxData, blacklist));
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileNamePrefix}.zip`;
  link.click();
}
