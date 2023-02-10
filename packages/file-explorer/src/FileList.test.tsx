import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockFileStorage } from '@deephaven/dashboard-core-plugins';
import { ContextMenuRoot } from '@deephaven/components';
import { TestUtils } from '@deephaven/utils';
import {
  DirectoryStorageItem,
  FileStorageItem,
  FileStorageTable,
} from './FileStorage';
import FileList, { FileListProps, getMoveOperation } from './FileList';
import {
  makeDirectories,
  makeDirectory,
  makeFile,
  makeFiles,
  makeNested,
} from './FileTestUtils';

const renderFileList = ({
  table = {} as FileStorageTable,
  onSelect = jest.fn(),
}: Partial<FileListProps>) =>
  render(
    <>
      <FileList table={table} onSelect={onSelect} />
      <ContextMenuRoot />
    </>
  );

describe('getMoveOperation', () => {
  it('succeeds if moving files from root to within a directory', () => {
    const targetPath = '/target/';
    const targetDirectory = makeDirectory('target');
    const targetItem = makeFile('targetItem', targetPath);
    const draggedItems = [makeFile('foo.txt'), makeFile('bar.txt')];
    expect(getMoveOperation(draggedItems, targetItem)).toEqual({
      files: draggedItems,
      targetPath,
    });
    expect(getMoveOperation(draggedItems, targetDirectory)).toEqual({
      files: draggedItems,
      targetPath,
    });
  });

  it('succeeds moving files from directory into root', () => {
    const targetPath = '/';
    const targetItem = makeFile('targetItem', targetPath);
    const path = '/baz/';
    const draggedItems = [makeFile('foo.txt', path), makeFile('bar.txt', path)];
    expect(getMoveOperation(draggedItems, targetItem)).toEqual({
      files: draggedItems,
      targetPath,
    });
  });

  it('fails if no items selected to move', () => {
    expect(() => getMoveOperation([], makeFile('foo.txt'))).toThrow();
  });

  it('fails if trying to move files within same directory', () => {
    const path = '/baz/';
    const targetItem = makeFile('targetItem', path);
    const draggedItems = [makeFile('foo.txt', path), makeFile('bar.txt')];
    expect(() => getMoveOperation(draggedItems, targetItem)).toThrow();
  });

  it('fails to move a directory into a child directory', () => {
    expect(() =>
      getMoveOperation([makeDirectory('foo')], makeDirectory('bar', '/foo/'))
    ).toThrow();
  });
});

it('mounts properly and shows file list', async () => {
  const files = makeFiles();
  const fileStorage = new MockFileStorage(files);
  const table = await fileStorage.getTable();
  renderFileList({ table });

  const foundItems = await screen.findAllByRole('listitem');
  expect(foundItems).toHaveLength(files.length);
});

describe('mouse actions', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let dirs: DirectoryStorageItem[] = [];
  let files: FileStorageItem[] = [];
  let items: FileStorageItem[] = [];

  beforeEach(async () => {
    user = userEvent.setup();
    dirs = makeDirectories();
    files = makeFiles();
    files.push(makeNested([2], 2));
    files.push(makeNested([0, 3], 4));
    items = dirs.concat(files);
  });

  it('selects the item upon left click', async () => {
    const onSelect = jest.fn();
    const fileStorage = new MockFileStorage(items);
    const table = await fileStorage.getTable();
    renderFileList({ table, onSelect });
    const foundItems = await screen.findAllByRole('listitem');
    expect(foundItems).toHaveLength(items.length);

    const file = await screen.findByText('testfile0');
    const dir = await screen.findByText('testdir0');

    // Click file
    await TestUtils.click(user, file);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        basename: 'testfile0',
        filename: '/testfile0',
        id: '/testfile0',
        itemName: 'testfile0',
        type: 'file',
      }),
      expect.anything()
    );

    // Click directory
    await TestUtils.click(user, dir);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        basename: 'testdir0',
        filename: '/testdir0',
        id: '/testdir0',
        itemName: 'testdir0',
        type: 'directory',
        isExpanded: false,
      }),
      expect.anything()
    );
  });

  // TODO #1081 Implement drag and drop tests
});
