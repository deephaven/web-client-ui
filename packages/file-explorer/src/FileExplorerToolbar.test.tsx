import React from 'react';
import { render } from '@testing-library/react';
import FileExplorerToolbar from './FileExplorerToolbar';

function makeFileExplorerToolbar({
  createFile = jest.fn(),
  createFolder = jest.fn(),
  onSearchChange = jest.fn(),
} = {}) {
  return render(
    <FileExplorerToolbar
      createFile={createFile}
      createFolder={createFolder}
      onSearchChange={onSearchChange}
    />
  );
}

it('mounts and unmounts successfully without crashing', () => {
  makeFileExplorerToolbar();
});
