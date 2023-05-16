import { FileUtils } from '@deephaven/file-explorer';
import type { ItemDetails, StorageService } from '@deephaven/jsapi-types';
import GrpcFileStorageTable from './GrpcFileStorageTable';

let storageService: StorageService;
function makeTable(baseRoot = '', root = ''): GrpcFileStorageTable {
  return new GrpcFileStorageTable(storageService, baseRoot, root);
}

function makeStorageService(): StorageService {
  return {
    listItems: jest.fn(async () => []),
    loadFile: jest.fn(async () => {
      throw new Error('No file loaded');
    }),
    deleteItem: jest.fn(async () => undefined),
    saveFile: jest.fn(async () => undefined),
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

describe('directory expansion tests', () => {
  function makeFile(name: string, path = ''): ItemDetails {
    return {
      basename: name,
      filename: `${path}/${name}`,
      dirname: path,
      etag: '',
      size: 1,
      type: 'file',
    };
  }

  function makeDirectory(name: string, path = ''): ItemDetails {
    const file = makeFile(name, path);
    file.type = 'directory';
    return file;
  }

  function makeDirectoryContents(
    path = '/',
    numDirs = 3,
    numFiles = 2
  ): Array<ItemDetails> {
    const results = [] as ItemDetails[];

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

  function expectItem(itemDetails: ItemDetails) {
    return expect.objectContaining({
      basename: itemDetails.basename,
      filename: itemDetails.filename,
      type: itemDetails.type,
    });
  }

  beforeEach(() => {
    storageService.listItems = jest.fn(async path => {
      const depth = path.length > 0 ? FileUtils.getDepth(path) + 1 : 1;
      const dirContents = makeDirectoryContents(path, 5 - depth, 10 - depth);
      // console.log('dirContents for ', path, dirContents);
      return dirContents;
    });
  });

  it('expands multiple directories correctly', async () => {
    const table = makeTable();
    const handleUpdate = jest.fn();
    table.onUpdate(handleUpdate);
    table.setViewport({ top: 0, bottom: 5 });

    jest.runAllTimers();

    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: [
        expectItem(makeDirectory('dir0')),
        expectItem(makeDirectory('dir1')),
        expectItem(makeDirectory('dir2')),
        expectItem(makeDirectory('dir3')),
        expectItem(makeFile('file0')),
      ],
    });
    handleUpdate.mockReset();

    table.setExpanded('/dir1/', true);

    jest.runAllTimers();

    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: [
        expectItem(makeDirectory('dir0')),
        expectItem(makeDirectory('dir1')),
        expectItem(makeDirectory('dir0', '/dir1')),
        expectItem(makeDirectory('dir1', '/dir1')),
        expectItem(makeDirectory('dir2', '/dir1')),
      ],
    });
    handleUpdate.mockReset();

    table.setExpanded('/dir1/dir1/', true);

    jest.runAllTimers();

    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: expect.arrayContaining([
        expectItem(makeDirectory('dir0')),
        expectItem(makeDirectory('dir1')),
        expectItem(makeDirectory('dir0', '/dir1')),
        expectItem(makeDirectory('dir1', '/dir1')),
        expectItem(makeDirectory('dir0', '/dir1/dir1')),
      ]),
    });
    handleUpdate.mockReset();

    // Now collapse it all
    table.setExpanded('/dir1/', false);

    jest.runAllTimers();

    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: expect.arrayContaining([
        expectItem(makeDirectory('dir0')),
        expectItem(makeDirectory('dir1')),
        expectItem(makeDirectory('dir2')),
        expectItem(makeDirectory('dir3')),
        expectItem(makeFile('file0')),
      ]),
    });
    handleUpdate.mockReset();
  });
});
