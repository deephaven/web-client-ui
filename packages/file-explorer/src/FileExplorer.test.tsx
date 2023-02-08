import React from 'react';
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event/';
import { MockFileStorage } from '@deephaven/dashboard-core-plugins';
import { ContextMenuRoot } from '@deephaven/components';
import { TestUtils } from '@deephaven/utils';
import FileStorage, {
  DirectoryStorageItem,
  FileStorageItem,
} from './FileStorage';
import FileExplorer, { FileExplorerProps } from './FileExplorer';
import FileTestUtils from './FileTestUtils';

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

it('mounts and unmounts successfully without crashing', () => {
  renderFileExplorer({ storage: makeMockFileStorage() });
});

it('mounts properly and shows file list', async () => {
  const files = FileTestUtils.makeFiles();

  const fileStorage = new MockFileStorage(files);

  renderFileExplorer({ storage: fileStorage as FileStorage });

  const foundItems = await screen.findAllByRole('listitem');
  expect(foundItems).toHaveLength(files.length);
});

describe('context menu actions work properly', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let dirs: DirectoryStorageItem[] = [];
  let files: FileStorageItem[] = [];
  let items: FileStorageItem[] = [];
  const onRename = jest.fn();
  const onDelete = jest.fn();

  const clickContextMenuButton = async (
    itemName: RegExp,
    buttonName: RegExp
  ) => {
    const item = await screen.findByText(itemName);
    await TestUtils.rightClick(user, item);

    const button = await screen.findByRole('button', { name: buttonName });
    expect(button).toBeInTheDocument();

    await TestUtils.click(user, button);
  };

  beforeEach(async () => {
    user = userEvent.setup();
    dirs = FileTestUtils.makeDirectories();
    files = FileTestUtils.makeFiles();
    files.push(FileTestUtils.makeNested([2], 2));
    files.push(FileTestUtils.makeNested([0, 3], 4));
    items = dirs.concat(files);

    const fileStorage = new MockFileStorage(items);
    renderFileExplorer({ storage: fileStorage, onRename, onDelete });
    const foundItems = await screen.findAllByRole('listitem');
    expect(foundItems).toHaveLength(items.length);
  });

  it('should be able to rename a file', async () => {
    await clickContextMenuButton(/testfile0/i, /rename/i);

    await user.keyboard('test{enter}');
    expect(onRename).toBeCalledWith('/testfile0', '/testfile0test');
  });

  it('should be able to rename a directory', async () => {
    await clickContextMenuButton(/testdir0/i, /rename/i);

    await user.keyboard('test{enter}');
    expect(onRename).toBeCalledWith('/testdir0/', '/testdir0test/');
  });

  it('should throw an error when renaming a file as a file that already exists', async () => {
    await clickContextMenuButton(/testfile0/i, /rename/i);

    await user.keyboard('{Backspace}{1}{Enter}');
    expect(
      await screen.findByText('Error: Name already exists')
    ).toBeInTheDocument();
    expect(onRename).not.toBeCalledWith('/testfile0', '/testfile1');
  });

  it('should open a modal when deleting an item', async () => {
    await clickContextMenuButton(/testfile0/i, /delete/i);
    expect(
      await screen.findByText(
        /Are you sure you want to delete "\/testfile0"\?/i
      )
    );
  });

  it('should close the modal on cancelling the delete', async () => {
    await clickContextMenuButton(/testfile0/i, /delete/i);

    const cancelButton = await screen.findByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
    await user.click(cancelButton);

    await waitForElementToBeRemoved(cancelButton);
    expect(cancelButton).not.toBeInTheDocument();
  });

  it('should delete the item upon confirmation', async () => {
    await clickContextMenuButton(/testfile0/i, /delete/i);

    const modalDeleteButton = await screen.findByRole('button', {
      name: /delete/i,
    });
    await user.click(modalDeleteButton);
    await waitForElementToBeRemoved(modalDeleteButton);
    expect(onDelete).toBeCalledTimes(1);
  });
});

// Need to implement tests for drag and drop

/* describe('drag and drop works properly', () => {
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

  it('should drag a file into a directory', async () => {
    const file = await screen.findByText('testfile0');
    const directory = await screen.findByText('testdir0');
    // await user.pointer({ keys: '[MouseLeft>]', target: file });
    fireEvent.mouseDown(file);
    fireEvent.mouseMove(directory);
    fireEvent.mouseUp(directory);
    // await user.pointer({ keys: '[/MouseLeft]' });

    // expect(file).not.toBeInTheDocument();
  });
});
 */
