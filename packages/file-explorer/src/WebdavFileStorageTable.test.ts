import { createClient, WebDAVClient } from 'webdav/web';
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
