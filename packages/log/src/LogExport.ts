import JSZip from 'jszip';
import { configure } from 'safe-stable-stringify';
import type LogHistory from './LogHistory';

// List of paths to ignore
// '' represents the root object
// * represents a wildcard key
export const DEFAULT_PATH_IGNORE_LIST: string[][] = [
  ['api'],
  ['client'],
  ['dashboardData', '*', 'connection'],
  ['dashboardData', '*', 'sessionWrapper'],
  ['dashboardData', '*', 'openedMap'],
  ['layoutStorage'],
  ['storage'],
];

// The default maximum depth to serialize to in the redux data
const DEFAULT_MAXIMUM_DEPTH = 10;

function stringifyReplacer(ignoreList: string[][]) {
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

    // check ignore list
    if (isOnIgnoreList(currPath, ignoreList)) {
      return undefined;
    }

    if (value instanceof Map) {
      return Array.from(value.entries());
    }

    // not in ignore list, return value
    return value;
  };
}

function isOnIgnoreList(currPath: string[], ignoreList: string[][]): boolean {
  for (let i = 0; i < ignoreList.length; i += 1) {
    if (
      currPath.length === ignoreList[i].length &&
      currPath.every(
        (v, index) => ignoreList[i][index] === '*' || v === ignoreList[i][index]
      )
    ) {
      // ignore list match
      return true;
    }
  }
  return false;
}

export function getReduxDataString(
  reduxData: Record<string, unknown>,
  ignoreList: string[][] = [],
  maximumDepth: number = DEFAULT_MAXIMUM_DEPTH
): string {
  // Limit the maximum depth to prevent linked structures from blowing up the log size
  // All objects at the maximum depth are replaced with "[Object]" or "[Array]"
  const stringify = configure({
    maximumDepth,
  });

  return (
    // Using safe-stable-stringify which handles circular references and BigInt
    // All circular references are replaced with "[Circular]", and BigInt values are converted to a number
    stringify(
      reduxData,
      stringifyReplacer(ignoreList),
      2 // Indent w/ 2 spaces
    ) ?? ''
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
 * @param ignoreList List of JSON paths to ignore in redux data. A JSON path is a list representing the path to that value (e.g. client.data would be `['client', 'data']`). Wildcards (*) are accepted in the path.
 * @param fileNamePrefix The zip file name without the .zip extension. Ex: test will be saved as test.zip
 * @param maximumDepth The maximum depth to serialize the redux data to. Objects at the maximum depth will be replaced with "[Object]" or "[Array]".
 * @returns A promise that resolves successfully if the log archive is created and downloaded successfully, rejected if there's an error
 */
export async function exportLogs(
  logHistory: LogHistory,
  metadata?: Record<string, unknown>,
  reduxData?: Record<string, unknown>,
  ignoreList: string[][] = DEFAULT_PATH_IGNORE_LIST,
  fileNamePrefix = `${formatDate(new Date())}_support_logs`,
  maximumDepth: number = DEFAULT_MAXIMUM_DEPTH
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(fileNamePrefix) as JSZip;
  folder.file('console.txt', logHistory.getFormattedHistory());
  if (metadata != null) {
    folder.file('metadata.json', getFormattedMetadata(metadata));
  }
  if (reduxData != null) {
    folder.file(
      'redux.json',
      getReduxDataString(reduxData, ignoreList, maximumDepth)
    );
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileNamePrefix}.zip`;
  link.click();
}
