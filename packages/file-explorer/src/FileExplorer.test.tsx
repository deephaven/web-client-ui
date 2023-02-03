import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event/';
import { MockFileStorage } from '@deephaven/dashboard-core-plugins';
import FileStorage, {
  DirectoryStorageItem,
  FileStorageItem,
} from './FileStorage';
import FileExplorer from './FileExplorer';

function makeFileName(index = 0): string {
  return `testfile${index}`;
}

function makeDirName(index = 0): string {
  return `testdir${index}`;
}

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

function makeDirectory(basename: string, path = '/'): DirectoryStorageItem {
  const filename = `${path}${basename}`;
  return {
    basename,
    filename,
    type: 'directory',
    id: filename,
    isExpanded: false,
  };
}

function makeDirectories(count = 5) {
  const result: DirectoryStorageItem[] = [];
  for (let i = 0; i < count; i += 1) {
    result.push(makeDirectory(`testdir${i}`));
  }
  return result;
}

function makeNested(directories: number[], fileNum: number): FileStorageItem {
  const basename = `/${directories
    .map(directory => makeDirName(directory))
    .join('/')}/`;
  return makeFile(makeFileName(fileNum), basename);
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

it('mounts properly and shows file list', async () => {
  const files = makeFiles();

  const fileStorage = new MockFileStorage(files);

  renderFileExplorer(fileStorage);

  const foundItems = await screen.findAllByRole('listitem');
  expect(foundItems).toHaveLength(files.length);
});
describe('context menu actions work properly', () => {
  // let user: ReturnType<typeof userEvent.setup>;
  // let dirs: DirectoryStorageItem[] = [];
  let files: FileStorageItem[] = [];
  let items: FileStorageItem[] = [];

  beforeEach(async () => {
    // user = userEvent.setup();
    // dirs = makeDirectories();
    files = makeFiles();
    // files.push(makeNested([2], 2));
    // files.push(makeNested([0, 3], 4));
    // items = dirs.concat(files);
    items = files;

    const fileStorage = new MockFileStorage(items);
    renderFileExplorer(fileStorage);
    const foundItems = await screen.findAllByRole('listitem');
    expect(foundItems).toHaveLength(items.length);
  });

  it('should be able to rename a file', async () => {
    const file = await screen.findByText('testfile0');
    fireEvent.contextMenu(file);
    // user.pointer({ keys: '[MouseRight]', target: file });
    expect(await screen.findByText(/rename/i)).toBeInTheDocument();
  });
});
