import React from 'react';
import { Button, DebouncedSearchInput } from '@deephaven/components';
import { vsNewFile, vsNewFolder } from '@deephaven/icons';
import './FileExplorerToolbar.scss';

type FileExplorerToolbarProps = {
  createFile(): void;
  createFolder(): void;
  onSearchChange?(text: string): void;
  defaultSearchText?: string;
};

export function FileExplorerToolbar({
  createFile,
  createFolder,
  onSearchChange,
  defaultSearchText = '',
}: FileExplorerToolbarProps): JSX.Element {
  return (
    <div className="file-explorer-toolbar">
      <div className="file-explorer-toolbar-buttons">
        <Button
          kind="ghost"
          icon={vsNewFile}
          tooltip="New notebook"
          onClick={createFile}
          aria-label="New notebook"
        />
        <Button
          kind="ghost"
          icon={vsNewFolder}
          tooltip="New folder"
          onClick={createFolder}
          aria-label="New folder"
        />
      </div>
      {onSearchChange && (
        <div className="file-explorer-toolbar-search">
          <DebouncedSearchInput
            value={defaultSearchText}
            onChange={onSearchChange}
            placeholder="Search by name"
          />
        </div>
      )}
    </div>
  );
}

export default FileExplorerToolbar;
