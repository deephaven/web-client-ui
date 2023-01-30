import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockFileStorage } from '@deephaven/dashboard-core-plugins';
import FileStorage, { FileStorageItem } from './FileStorage';
import FileExplorer from './FileExplorer';

function makeFileName(index = 0): string {
  return `testfile${index}`;
}

// function makeDirName(index = 0): string {
//   return `testdir${index}`;
// }

function makeFile(basename: string, path = '/'): FileStorageItem {
  const filename = `${path}${basename}`;
  return {
    basename,
    filename,
    type: 'file',
    id: filename,
  };
}

function makeFiles(count = 5) {
  const result: FileStorageItem[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(makeFile(makeFileName(i)));
  }
  return result;
}

function makeMockFileStorage(): FileStorage {
  return {
    getTable: jest.fn(),
    saveFile: jest.fn(),
    loadFile: jest.fn(),
    deleteFile: jest.fn(),
    moveFile: jest.fn(),
    info: jest.fn(),
    createDirectory: jest.fn(),
  };
}

function renderFileExplorer(storage: FileStorage) {
  const onSelect = jest.fn();
  return render(<FileExplorer storage={storage} onSelect={onSelect} />);
}

it('mounts and unmounts successfully without crashing', () => {
  renderFileExplorer(makeMockFileStorage());
});

// it('should cancel when pressing cancel on the context menu for a file', async () => {
//   const files = makeFiles();
//   let fileStorage;

//   // act(() => {
//   //   fileStorage = new MockFileStorage(files);
//   // });

//   fileStorage = new MockFileStorage(files);

//   await renderFileExplorer(fileStorage);
//   const foundItems = await screen.findAllByRole('listitem');
//   expect(foundItems).toHaveLength(files.length);
// });

it('mounts properly and shows file list', async () => {
  const files = makeFiles();

  const fileStorage = new MockFileStorage(files);

  renderFileExplorer(fileStorage);

  const foundItems = await screen.findAllByRole('listitem');
  screen.debug();
  expect(foundItems).toHaveLength(files.length);
});
