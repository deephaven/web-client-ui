import React from 'react';
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event/';
import { MockFileStorage } from '@deephaven/dashboard-core-plugins';
import { ContextMenuRoot } from '@deephaven/components';
import FileStorage, {
  DirectoryStorageItem,
  FileStorageItem,
} from './FileStorage';
import FileExplorer, { FileExplorerProps } from './FileExplorer';

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

function renderFileExplorer({
  storage,
  onSelect = jest.fn(),
  onRename = jest.fn(),
  onDelete = jest.fn(),
}: Partial<FileExplorerProps>) {
  if (storage !== undefined) {
    return render(
      <>
        <FileExplorer
          storage={storage}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
        />
        <ContextMenuRoot />
      </>
    );
  }
}

// Not working?
it('mounts without onDelete and onRename functions', () => {
  render(<FileExplorer storage={makeMockFileStorage()} onSelect={jest.fn()} />);
});

it('mounts and unmounts successfully without crashing', () => {
  renderFileExplorer({ storage: makeMockFileStorage() });
});

it('mounts properly and shows file list', async () => {
  const files = makeFiles();

  const fileStorage = new MockFileStorage(files);

  renderFileExplorer({ storage: fileStorage as FileStorage });

  const foundItems = await screen.findAllByRole('listitem');
  expect(foundItems).toHaveLength(files.length);
});

// it('logs error when the table does not initialize', () => {
//   const mockFileStorage = makeMockFileStorage();
//   mockFileStorage.getTable = jest.fn(() => {
//     setTimeout(() => {
//       throw new Error("Can't initialize table");
//     }, 3000);
//   });

//   // mockFileStorage.getTable = jest.fn(async () => ({
//   //   setSearch: jest.fn(),
//   //   setExpanded: jest.fn(),
//   //   collapseAll: jest.fn(),
//   //   getViewportData: jest.fn(),
//   //   getSnapshot: jest.fn(),
//   //   setViewport: jest.fn(),
//   //   setFilters: jest.fn(),
//   //   setSorts: jest.fn(),
//   //   setReversed: jest.fn(),
//   //   close: jest.fn(),
//   //   onUpdate: jest.fn(),
//   //   size: 0,
//   // }));
//   expect(() =>
//     renderFileExplorer({ storage: mockFileStorage })
//   ).not.toThrowError();
// });

describe('context menu actions work properly', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let dirs: DirectoryStorageItem[] = [];
  let files: FileStorageItem[] = [];
  let items: FileStorageItem[] = [];
  const onRename = jest.fn();
  const onDelete = jest.fn();

  beforeEach(async () => {
    user = userEvent.setup();
    dirs = makeDirectories();
    files = makeFiles();
    files.push(makeNested([2], 2));
    files.push(makeNested([0, 3], 4));
    items = dirs.concat(files);

    const fileStorage = new MockFileStorage(items);
    renderFileExplorer({ storage: fileStorage, onRename, onDelete });
    const foundItems = await screen.findAllByRole('listitem');
    expect(foundItems).toHaveLength(items.length);
  });

  it('should be able to rename a file', async () => {
    const file = await screen.findByText('testfile0');
    await user.pointer({ keys: '[MouseRight]', target: file });

    const renameButton = await screen.findByText(/rename/i);
    expect(renameButton).toBeInTheDocument();

    await user.click(renameButton);
    await user.keyboard('test{enter}');
    expect(onRename).toBeCalledWith('/testfile0', '/testfile0test');
  });

  it('should be able to rename a directory', async () => {
    const file = await screen.findByText('testdir0');
    await user.pointer({ keys: '[MouseRight]', target: file });

    const renameButton = await screen.findByText(/rename/i);
    expect(renameButton).toBeInTheDocument();

    await user.click(renameButton);
    await user.keyboard('test{enter}');
    expect(onRename).toBeCalledWith('/testdir0/', '/testdir0test/');
  });

  it('should throw an error when renaming a file as a file that already exists', async () => {
    const file = await screen.findByText('testfile0');
    await user.pointer({ keys: '[MouseRight]', target: file });

    const renameButton = await screen.findByText(/rename/i);
    expect(renameButton).toBeInTheDocument();

    await user.click(renameButton);
    await user.keyboard('{Backspace}{1}{Enter}');
    expect(
      await screen.findByText('Error: Name already exists')
    ).toBeInTheDocument();
    expect(onRename).not.toBeCalledWith('/testfile0', '/testfile1');
  });

  it('should open a modal when deleting an item', async () => {
    const file = await screen.findByText('testfile0');
    await user.pointer({ keys: '[MouseRight]', target: file });

    const deleteButton = await screen.findByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton);
    expect(
      await screen.findByText(
        /Are you sure you want to delete "\/testfile0"\?/i
      )
    );
  });

  it('should close the modal on cancelling the delete', async () => {
    const file = await screen.findByText('testfile0');
    await user.pointer({ keys: '[MouseRight]', target: file });

    const deleteButton = await screen.findByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton);

    const cancelButton = await screen.findByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
    await user.click(cancelButton);

    await waitForElementToBeRemoved(cancelButton);
    expect(cancelButton).not.toBeInTheDocument();
  });

  it('should delete the item upon confirmation', async () => {
    const file = await screen.findByText('testfile0');
    await user.pointer({ keys: '[MouseRight]', target: file });

    const deleteButton = await screen.findByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton);

    const modalDeleteButton = await screen.findByRole('button', {
      name: /delete/i,
    });
    await user.click(modalDeleteButton);
    await waitForElementToBeRemoved(modalDeleteButton);
    expect(onDelete).toBeCalledTimes(1);
  });
});

// describe('drag and drop works properly', () => {
//   let user: ReturnType<typeof userEvent.setup>;
//   let dirs: DirectoryStorageItem[] = [];
//   let files: FileStorageItem[] = [];
//   let items: FileStorageItem[] = [];
//   const onRename = jest.fn();
//   const onDelete = jest.fn();

//   beforeEach(async () => {
//     user = userEvent.setup();
//     dirs = makeDirectories();
//     files = makeFiles();
//     files.push(makeNested([2], 2));
//     files.push(makeNested([0, 3], 4));
//     items = dirs.concat(files);

//     const fileStorage = new MockFileStorage(items);
//     renderFileExplorer({ storage: fileStorage, onRename, onDelete });
//     const foundItems = await screen.findAllByRole('listitem');
//     expect(foundItems).toHaveLength(items.length);
//   });

//   // it('should drag a file into a directory', async () => {
//   //   const file = await screen.findByText('testfile0');
//   //   const directory = await screen.findByText('testdir0');
//   //   // await user.pointer({ keys: '[MouseLeft>]', target: file });
//   //   // fireEvent.mouseDown(file);
//   //   // fireEvent.mouseMove(directory);
//   //   // fireEvent.mouseUp(directory);
//   //   // await user.pointer({ keys: '[/MouseLeft]' });

//   //   // expect(file).not.toBeInTheDocument();
//   // });
// });
