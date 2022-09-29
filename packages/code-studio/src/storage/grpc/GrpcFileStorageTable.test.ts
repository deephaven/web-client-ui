import { FileUtils } from '@deephaven/file-explorer';
import { ItemDetails, StorageService } from '@deephaven/jsapi-shim';
import GrpcFileStorageTable from './GrpcFileStorageTable';

let storageService: StorageService;
function makeTable(path = '/'): GrpcFileStorageTable {
  return new GrpcFileStorageTable(storageService, path);
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
});

it('Does not get contents until a viewport is set', () => {
  const table = makeTable();
  expect(storageService.listItems).not.toHaveBeenCalled();
  table.setViewport({ top: 0, bottom: 10 });
  expect(storageService.listItems).toHaveBeenCalled();
});

describe('directory expansion tests', () => {
  function makeFile(name: string, path = '/'): ItemDetails {
    return {
      basename: name,
      filename: `${path}${name}`,
      dirname: path,
      etag: '',
      size: 1,
      type: 'file',
    };
  }

  function makeDirectory(name: string, path = '/'): ItemDetails {
    const file = makeFile(name, path);
    file.type = 'directory';
    return file;
  }

  function makeDirectoryContents(
    path = '/',
    numDirs = 3,
    numFiles = 3
  ): Array<ItemDetails> {
    const results = [] as ItemDetails[];

    for (let i = 0; i < numDirs; i += 1) {
      const name = `dir${i}`;
      results.push(makeDirectory(name, path));
    }

    for (let i = 0; i < 2; i += 1) {
      const name = `file${i}`;
      results.push(makeFile(name, path));
    }

    return results;
  }

  beforeEach(() => {
    storageService.listItems = jest.fn(async path => {
      const depth = FileUtils.getDepth(path) + 1;
      return makeDirectoryContents(path, 5 - depth, 10 - depth);
    });
  });

  it('expands multiple directories correctly', async () => {
    const table = makeTable();
    const handleUpdate = jest.fn();
    table.onUpdate(handleUpdate);
    table.setViewport({ top: 0, bottom: 5 });
    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: [
        expect.objectContaining(makeDirectory('dir0')),
        expect.objectContaining(makeDirectory('dir1')),
        expect.objectContaining(makeDirectory('dir2')),
        expect.objectContaining(makeDirectory('dir3')),
        expect.objectContaining(makeFile('file0')),
      ],
    });
    handleUpdate.mockReset();

    await table.setExpanded('/dir1/', true);
    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: [
        expect.objectContaining(makeDirectory('dir0')),
        expect.objectContaining(makeDirectory('dir1')),
        expect.objectContaining(makeDirectory('dir0', '/dir1/')),
        expect.objectContaining(makeDirectory('dir1', '/dir1/')),
        expect.objectContaining(makeDirectory('dir2', '/dir1/')),
      ],
    });
    handleUpdate.mockReset();

    await table.setExpanded('/dir1/dir1/', true);
    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: expect.arrayContaining([
        expect.objectContaining(makeDirectory('dir0')),
        expect.objectContaining(makeDirectory('dir1')),
        expect.objectContaining(makeDirectory('dir0', '/dir1/')),
        expect.objectContaining(makeDirectory('dir1', '/dir1/')),
        expect.objectContaining(makeDirectory('dir0', '/dir1/dir1/')),
      ]),
    });
    handleUpdate.mockReset();

    // Now collapse it all
    await table.setExpanded('/dir1/', false);
    await table.getViewportData();
    expect(handleUpdate).toHaveBeenCalledWith({
      offset: 0,
      items: expect.arrayContaining([
        expect.objectContaining(makeDirectory('dir0')),
        expect.objectContaining(makeDirectory('dir1')),
        expect.objectContaining(makeDirectory('dir2')),
        expect.objectContaining(makeDirectory('dir3')),
        expect.objectContaining(makeFile('file0')),
      ]),
    });
    handleUpdate.mockReset();
  });
});
