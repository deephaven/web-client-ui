import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockFileStorage } from '@deephaven/dashboard-core-plugins';
import { TestUtils } from '@deephaven/utils';
import { ContextMenuRoot } from '@deephaven/components';
import { FileStorageItem, FileStorageTable } from './FileStorage';
import FileListContainer, { FileListContainerProps } from './FileListContainer';
import { makeFiles } from './FileTestUtils';

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

  /**
   * Tests that a button's function is called with expected parameters
   * @param functionName Name of the function as a string (should match the prop name e.g. onDelete)
   * @param title Display name of the button
   * @param expectedValue The parameters the function is expected to receive. If there are multiple, pass them in an array. If the expected value is an array, wrap that in an array.
   * @param keyboardText Text you may want to enter after clicking the button
   */
  const testContextMenuAction = async (
    functionName: string,
    title: RegExp,
    expectedValue: unknown,
    keyboardText?: string
  ) => {
    const actionFunction = jest.fn();
    const props = {
      table,
      showContextMenu: true,
      [functionName]: actionFunction,
    };
    renderFileListContainer(props);

    const file = await screen.findByText('testfile1');
    await TestUtils.rightClick(user, file);

    const button = await screen.findByRole('button', { name: title });

    expect(button).toBeInTheDocument();

    await TestUtils.click(user, button);

    if (keyboardText !== undefined) {
      await user.keyboard(keyboardText);
    }

    if (expectedValue === null) {
      expect(actionFunction).not.toHaveBeenCalled();
    } else if (expectedValue === undefined) {
      expect(actionFunction).toHaveBeenCalled();
    } else if (Array.isArray(expectedValue)) {
      expect(actionFunction).toHaveBeenCalledWith(...expectedValue);
    } else {
      expect(actionFunction).toHaveBeenCalledWith(expectedValue);
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
      [
        expect.objectContaining({
          basename: 'testfile1',
          filename: '/testfile1',
          id: '/testfile1',
          itemName: 'testfile1',
          type: 'file',
        }),
      ],
    ]);
  });

  it('renders an option to create a new file in the context menu', async () => {
    await testContextMenuAction('onCreateFile', /new file/i, undefined);
  });

  it('renders an option to create a new folder in the context menu', async () => {
    await testContextMenuAction('onCreateFolder', /new folder/i, '/');
  });

  it('renders an option to rename a file', async () => {
    await testContextMenuAction(
      'onRename',
      /rename/i,
      [
        expect.objectContaining({
          basename: 'testfile1',
          filename: '/testfile1',
          id: '/testfile1',
          itemName: 'testfile1',
          type: 'file',
        }),
        'testfile7',
      ],
      '{Backspace}{7}{Enter}'
    );
  });

  it('it should cancel when pressing escape while renaming a file', async () => {
    await testContextMenuAction(
      'onRename',
      /rename/i,
      null,
      'blahblah243087{Escape}'
    );

    const file = await screen.findByText('testfile1');
    expect(file).toBeInTheDocument();
  });
});
