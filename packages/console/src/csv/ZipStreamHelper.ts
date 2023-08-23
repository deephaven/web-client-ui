import type { JSZipObject, OnUpdateCallback, JSZipStreamHelper } from 'jszip';

interface ZipStreamHelper extends JSZipStreamHelper<string> {
  readable: boolean;
  read(): void;
  removeListener(): void;
}

export default function makeZipStreamHelper(
  zipObj: JSZipObject,
  onUpdate: OnUpdateCallback
) {
  const helper: ZipStreamHelper = (
    zipObj as JSZipObject & {
      // The type could be anything except nodebuffer from https://stuk.github.io/jszip/documentation/api_zipobject/internal_stream.html
      // We only need it as a string though
      internalStream(type: 'string'): JSZipStreamHelper<string>;
    }
  ).internalStream('string') as ZipStreamHelper;

  helper.readable = true;
  helper.read = () => false;
  helper.removeListener = () => false;
  helper.on('data', (_, metadata) => onUpdate(metadata));

  return helper;
}
