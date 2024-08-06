import { FileUtils } from '@deephaven/file-explorer';
import type { dh } from '@deephaven/jsapi-types';
import GrpcFileStorageTable from './GrpcFileStorageTable';

let storageService: dh.storage.StorageService;
function makeTable(
  baseRoot = '',
  root = '',
  separator = '/'
): GrpcFileStorageTable {
  return new GrpcFileStorageTable(storageService, baseRoot, root, separator);
}

function makeStorageService(): dh.storage.StorageService {
  return {
    listItems: jest.fn(async () => []),
    loadFile: jest.fn(async () => {
      throw new Error('No file loaded');
    }),
    deleteItem: jest.fn(async () => undefined),
    saveFile: jest.fn(
      async () => undefined as unknown as dh.storage.FileContents
    ),
    moveItem: jest.fn(async () => undefined),
    createDirectory: jest.fn(async () => undefined),
  };
}

beforeEach(() => {
  storageService = makeStorageService();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('Does not get contents until a viewport is set', () => {
  const table = makeTable();
  expect(storageService.listItems).not.toHaveBeenCalled();
  table.setViewport({ top: 0, bottom: 10 });
  jest.runOnlyPendingTimers();
  expect(storageService.listItems).toHaveBeenCalled();
});

describe.each(['/', `\\`])('directory expansion tests %s', separator => {
  function makeFile(name: string, path = ''): dh.storage.ItemDetails {
    return {
      basename: name,
      filename: `${path}${separator}${name}`,
      dirname: path,
      etag: '',
      size: 1,
      type: 'file',
    };
  }

  function makeDirectory(name: string, path = ''): dh.storage.ItemDetails {
    const file = makeFile(name, path);
    file.type = 'directory';
    return file;
  }

  function makeDirectoryContents(
    path = separator,
    numDirs = 3,
    numFiles = 2
  ): Array<dh.storage.ItemDetails> {
    const results = [] as dh.storage.ItemDetails[];

    for (let i = 0; i < numDirs; i += 1) {
      const name = `dir${i}`;
      results.push(makeDirectory(name, path));
    }

    for (let i = 0; i < numFiles; i += 1) {
      const name = `file${i}`;
      results.push(makeFile(name, path));
    }

    return results;
  }

  function expectItem(itemDetails: dh.storage.ItemDetails) {
    return expect.objectContaining({
      basename: itemDetails.basename,
      filename: itemDetails.filename,
      type: itemDetails.type,
    });
  }

  beforeEach(() => {
    storageService.listItems = jest.fn(async path => {
      const depth =
        path.length > 0 ? FileUtils.getDepth(path, separator) + 1 : 1;
      const dirContents = makeDirectoryContents(path, 5 - depth, 10 - depth);
      return dirContents;
    });
  });

  it(`expands multiple directories correctly`, async () => {
    const table = makeTable('', '', separator);
    const handleUpdate = jest.fn();
    table.onUpdate(handleUpdate);
    table.setViewport({ top: 0, bottom: 5 });

    jest.runAllTimers();

    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: [
        expectItem(makeDirectory('dir0', '')),
        expectItem(makeDirectory('dir1', '')),
        expectItem(makeDirectory('dir2', '')),
        expectItem(makeDirectory('dir3', '')),
        expectItem(makeFile('file0', '')),
      ],
    });
    handleUpdate.mockReset();

    const dirPath = `${separator}dir1${separator}`;
    table.setExpanded(dirPath, true);

    jest.runAllTimers();

    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: [
        expectItem(makeDirectory('dir0', '')),
        expectItem(makeDirectory('dir1', '')),
        expectItem(makeDirectory('dir0', makeDirectory('dir1', '').filename)),
        expectItem(makeDirectory('dir1', makeDirectory('dir1', '').filename)),
        expectItem(makeDirectory('dir2', makeDirectory('dir1', '').filename)),
      ],
    });
    handleUpdate.mockReset();

    table.setExpanded(`${separator}dir1${separator}dir1${separator}`, true);

    jest.runAllTimers();

    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: expect.arrayContaining([
        expectItem(makeDirectory('dir0', '')),
        expectItem(makeDirectory('dir1', '')),
        expectItem(makeDirectory('dir0', makeDirectory('dir1', '').filename)),
        expectItem(makeDirectory('dir1', makeDirectory('dir1', '').filename)),
        expectItem(
          makeDirectory(
            'dir0',
            makeDirectory('dir1', makeDirectory('dir1', '').filename).filename
          )
        ),
      ]),
    });
    handleUpdate.mockReset();

    // Now collapse it all
    table.setExpanded(`${separator}dir1${separator}`, false);

    jest.runAllTimers();

    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: expect.arrayContaining([
        expectItem(makeDirectory('dir0', '')),
        expectItem(makeDirectory('dir1', '')),
        expectItem(makeDirectory('dir2', '')),
        expectItem(makeDirectory('dir3', '')),
        expectItem(makeFile('file0', '')),
      ]),
    });
    table.collapseAll();
    handleUpdate.mockReset();
  });
});
