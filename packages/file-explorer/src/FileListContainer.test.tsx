import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockFileStorage } from '@deephaven/dashboard-core-plugins';
import { TestUtils } from '@deephaven/utils';
import { ContextMenuRoot } from '@deephaven/components';
import { FileStorageItem, FileStorageTable } from './FileStorage';
import FileListContainer, { FileListContainerProps } from './FileListContainer';

function makeFileName(index = 0): string {
  return `testfile${index}`;
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

const renderFileListContainer = async ({
  table = {} as FileStorageTable,
  onSelect = jest.fn(),
  onCopy = undefined,
  onDelete = undefined,
  onCreateFile = undefined,
  onCreateFolder = undefined,
  onRename = undefined,
  showContextMenu = false,
}: Partial<FileListContainerProps>) =>
  render(
    <>
      <FileListContainer
        table={table}
        onSelect={onSelect}
        onCopy={onCopy}
        onDelete={onDelete}
        onCreateFile={onCreateFile}
        onCreateFolder={onCreateFolder}
        onRename={onRename}
        showContextMenu={showContextMenu}
      />
      <ContextMenuRoot />
    </>
  );

it('mounts properly and shows file list', async () => {
  const files = makeFiles();
  const fileStorage = new MockFileStorage(files);
  const table = await fileStorage.getTable();
  renderFileListContainer({ table });

  const foundItems = await screen.findAllByRole('listitem');
  expect(foundItems).toHaveLength(files.length);
});

describe('renders correct context menu actions', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let files: FileStorageItem[] = [];
  let table: FileStorageTable;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const testContextMenuAction = async (
    functionName: string,
    title: RegExp,
    expectedValue: any
  ) => {
    const actionFunction = jest.fn();
    const props = { table, showContextMenu: true };
    props[functionName] = actionFunction;
    renderFileListContainer(props);

    const file = await screen.findByText('testfile1');
    await TestUtils.rightClick(user, file);

    const button = await screen.findByRole('button', { name: title });

    expect(button).toBeInTheDocument();

    await TestUtils.click(user, button);
    if (expectedValue !== undefined) {
      expect(actionFunction).toHaveBeenCalledWith(expectedValue);
    } else {
      expect(actionFunction).toHaveBeenCalled();
    }
  };

  beforeEach(async () => {
    user = userEvent.setup();
    files = makeFiles();
    const fileStorage = new MockFileStorage(files);
    table = await fileStorage.getTable();
  });

  it('renders copy in the context menu', async () => {
    await testContextMenuAction(
      'onCopy',
      /copy/i,
      expect.objectContaining({
        basename: 'testfile1',
        filename: '/testfile1',
        id: '/testfile1',
        itemName: 'testfile1',
        type: 'file',
      })
    );
  });

  it('renders delete in the context menu', async () => {
    await testContextMenuAction('onDelete', /delete/i, [
      expect.objectContaining({
        basename: 'testfile1',
        filename: '/testfile1',
        id: '/testfile1',
        itemName: 'testfile1',
        type: 'file',
      }),
    ]);
  });

  it('renders an option to create a new file in the context menu', async () => {
    await testContextMenuAction('onCreateFile', /new file/i, undefined);
  });

  it('renders an option to create a new folder in the context menu', async () => {
    await testContextMenuAction('onCreateFolder', /new folder/i, '/');
  });

  it('renders an option to rename a file', async () => {
    const onRename = jest.fn();
    const props = { table, onRename, showContextMenu: true };
    renderFileListContainer(props);

    const file = await screen.findByText('testfile1');
    await TestUtils.rightClick(user, file);

    const button = await screen.findByRole('button', { name: /rename/i });

    expect(button).toBeInTheDocument();
    await TestUtils.click(user, button);

    await user.keyboard('{Backspace}{7}{Enter}');
    expect(onRename).toHaveBeenCalledWith(
      expect.objectContaining({
        basename: 'testfile1',
        filename: '/testfile1',
        id: '/testfile1',
        itemName: 'testfile1',
        type: 'file',
      }),
      'testfile7'
    );
  });

  it('it should cancel when pressing escape while renaming a file', async () => {
    const onRename = jest.fn();
    const props = { table, onRename, showContextMenu: true };
    renderFileListContainer(props);

    const file = await screen.findByText('testfile1');
    await TestUtils.rightClick(user, file);

    const button = await screen.findByRole('button', { name: /rename/i });

    expect(button).toBeInTheDocument();
    await TestUtils.click(user, button);

    await user.keyboard('blahblah243087{Escape}');
    expect(onRename).not.toHaveBeenCalled();
    expect(file).toBeInTheDocument();
  });
});
