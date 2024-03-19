/* eslint-disable import/prefer-default-export */
import JSZip from 'jszip';
import dh from '@deephaven/jsapi-shim';
import { store } from '@deephaven/redux';
import { logHistory } from './LogInit';

const FILENAME_DATE_FORMAT = 'yyyy-MM-dd-HHmmss';

// Blacklist applies to all keys (e.g. blacklist foo will blacklist foo, a.foo, and b.foo)
const KEY_BLACKLIST: string[] = ['client'];
// Blacklist specific paths (e.g. blacklist foo will only blacklist foo but NOT a.foo or b.foo)
const PATH_BLACKLIST: string[] = [];

/**
 * Replacer function for JSON.stringify to remove keys that should not be included in the output
 * @param key
 * @param value
 */
function blacklistReplacer(key: string, value: unknown, path: string) {
  if (!KEY_BLACKLIST.includes(key) && !PATH_BLACKLIST.includes(path)) {
    return value;
  }
}

/**
 * Returns a replacer that has path included
 * @param key
 * @param value
 */
function replacerWithPath(
  r: (key: string, value: unknown, path: string) => unknown
) {
  const m = new Map();
  return function replacer(this: unknown, field: string, value: unknown) {
    const path =
      m.get(this) + (Array.isArray(this) ? `[${field}]` : `.${field}`);
    if (value === Object(value)) m.set(value, path);
    return r.call(this, field, value, path.replace(/undefined\.\.?/, ''));
  };
}

const stringifyReplacer = replacerWithPath(blacklistReplacer);

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
 */
function makeSafeToStringify(
  obj: Record<string, unknown>,
  path = 'root',
  potentiallyCircularValues: Map<Record<string, unknown>, string> = new Map([
    [obj, ''],
  ])
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, val]) => {
    try {
      JSON.stringify(val, stringifyReplacer);
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
          curPath,
          potentiallyCircularValues
        );
      }
    }
  });

  return output;
}

function getReduxDataString(): string {
  const reduxData = store.getState();
  return JSON.stringify(
    makeSafeToStringify(reduxData),
    stringifyReplacer,
    2 // Indent w/ 2 spaces
  );
}

function getMetadata(meta?: Record<string, unknown>): string {
  const metadata = {
    uiVersion: import.meta.env.npm_package_version,
    userAgent: navigator.userAgent,
    ...meta,
  };

  return JSON.stringify(metadata, stringifyReplacer, 2);
}

/**
 * Export support logs with the given name.
 * @param fileNamePrefix The zip file name without the .zip extension. Ex: test will be saved as test.zip
 */
export async function exportLogs(
  fileNamePrefix = `${dh.i18n.DateTimeFormat.format(
    FILENAME_DATE_FORMAT,
    new Date()
  )}_support_logs`,
  metadata?: Record<string, unknown>
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(fileNamePrefix) as JSZip;
  folder.file('console.txt', logHistory.getFormattedHistory());
  folder.file('redux.json', getReduxDataString());
  folder.file('metadata.json', getMetadata(metadata));

  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileNamePrefix}.zip`;
  link.click();
}
