import type { JSZipObject, OnUpdateCallback, JSZipStreamHelper } from 'jszip';

/**
 * This is used to help papaparse understand our stream.
 * It uses these fields for feature detection, but never actually calls read()
 * https://github.com/mholt/PapaParse/blob/master/papaparse.js#L244
 */
interface ZipStreamHelper extends JSZipStreamHelper<string> {
  readable: boolean;
  read(): void;
  removeListener(): void;
}

export default function makeZipStreamHelper(
  zipObj: JSZipObject,
  onUpdate: OnUpdateCallback
): ZipStreamHelper {
  const helper: ZipStreamHelper = (
    zipObj as JSZipObject & {
      // The type could be anything except nodebuffer from https://stuk.github.io/jszip/documentation/api_zipobject/internal_stream.html
      // We only need it as a string though
      // JSZip types don't include this method for some reason
      internalStream(type: 'string'): JSZipStreamHelper<string>;
    }
  ).internalStream('string') as ZipStreamHelper;

  helper.readable = true;
  helper.read = () => false;
  helper.removeListener = () => false;
  helper.on('data', (_, metadata) => onUpdate(metadata));

  return helper;
}
