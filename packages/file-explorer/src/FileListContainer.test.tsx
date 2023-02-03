import React from 'react';
import { MockFileStorage } from '@deephaven/dashboard-core-plugins';
import { FileListContainer } from '../dist';
import FileStorage, { FileStorageItem, FileStorageTable } from './FileStorage';
import { FileListContainerProps } from './FileListContainer';
import { screen } from '@testing-library/react';

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
}: Partial<FileListContainerProps>) => (
  <FileListContainer table={table} onSelect={onSelect} />
);

it('mounts properly and shows file list', async () => {
  const files = makeFiles();
  const fileStorage = new MockFileStorage(files);
  const table = await fileStorage.getTable();
  renderFileListContainer({ table });

  const foundItems = await screen.findAllByRole('listitem');
  expect(foundItems).toHaveLength(files.length);
});
