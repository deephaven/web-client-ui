import { FileUtils } from '@deephaven/file-explorer';
import { createClient, FileStat, WebDAVClient } from 'webdav/web';
import WebdavFileStorageTable from './WebdavFileStorageTable';

jest.mock('webdav');
jest.mock('webdav/web', () => ({
  createClient: jest.fn(() => ({
    getDirectoryContents: jest.fn(async () => []),
  })),
}));

let client: WebDAVClient;
function makeTable(path = '/'): WebdavFileStorageTable {
  return new WebdavFileStorageTable(client, path);
}

beforeEach(() => {
  client = createClient('TEST');
});

it('Does not get contents until a viewport is set', () => {
  const table = makeTable();
  expect(client.getDirectoryContents).not.toHaveBeenCalled();
  table.setViewport({ top: 0, bottom: 10 });
  expect(client.getDirectoryContents).toHaveBeenCalled();
});

describe('directory expansion tests', () => {
  function makeFile(name: string, path = '/'): FileStat {
    return {
      basename: name,
      filename: `${path}${name}`,
      lastmod: '',
      etag: '',
      size: 1,
      type: 'file',
    };
  }

  function makeDirectory(name: string, path = '/'): FileStat {
    const file = makeFile(name, path);
    file.type = 'directory';
    return file;
  }

  function makeDirectoryContents(
    path = '/',
    numDirs = 3,
    numFiles = 2
  ): Array<FileStat> {
    const results = [] as FileStat[];

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

  beforeEach(() => {
    client.getDirectoryContents = jest.fn(async path => {
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
