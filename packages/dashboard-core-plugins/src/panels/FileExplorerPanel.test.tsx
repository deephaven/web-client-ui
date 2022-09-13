import React from 'react';
import { render, screen } from '@testing-library/react';
import { FileStorageItem } from '@deephaven/file-explorer/src/FileStorage';
import FileExplorerPanel from './FileExplorerPanel';

function makeFile(basename: string, path = '/'): FileStorageItem {
  const filename = `${path}${basename}`;
  return {
    basename,
    filename,
    type: 'file',
    id: filename,
  };
}

function makeDirectory(name: string, path = '/'): FileStorageItem {
  const file = makeFile(name, path);
  file.type = 'directory';
  return file;
}

it('mounts properly', () => {
  return render(
    <FileExplorerPanel></FileExplorerPanel>
  )
})

it('gets the correct file/folder path', () => {
  const directory = makeDirectory('/first/second/third');
  expect(getPath(directory)).toEqual(directory);
});
