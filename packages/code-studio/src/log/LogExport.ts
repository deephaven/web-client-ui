/* eslint-disable import/prefer-default-export */
import JSZip from 'jszip';
import dh from '@deephaven/jsapi-shim';
import { store } from '@deephaven/redux';
import { logHistory } from './LogInit';

const FILENAME_DATE_FORMAT = 'yyyy-MM-dd-HHmmss';

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
      JSON.stringify(val);
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
    null,
    2 // Indent w/ 2 spaces
  );
}

/**
 * Export support logs with the given name.
 * @param metadata Any extra metadata to be written to a metadata file
 * @param fileNamePrefix The zip file name without the .zip extension. Ex: test will be saved as test.zip
 */
export async function exportLogs(
  metadata = {},
  fileNamePrefix = `${dh.i18n.DateTimeFormat.format(
    FILENAME_DATE_FORMAT,
    new Date()
  )}_support_logs`
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder(fileNamePrefix) as JSZip;
  folder.file('console.txt', logHistory.getFormattedHistory());
  folder.file('redux.json', getReduxDataString());
  folder.file('metadata', JSON.stringify(metadata));

  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileNamePrefix}.zip`;
  link.click();
}
