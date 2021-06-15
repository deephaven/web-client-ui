import React from 'react';
import { Button, DebouncedSearchInput, Tooltip } from '@deephaven/components';
import { vsNewFile, vsNewFolder } from '@deephaven/icons';
import './FileExplorerToolbar.scss';

type FileExplorerToolbarProps = {
  createFile(): void;
  createFolder(): void;
  onSearchChange?(text: string): void;
  defaultSearchText?: string;
};

export const FileExplorerToolbar = ({
  createFile,
  createFolder,
  onSearchChange,
  defaultSearchText = '',
}: FileExplorerToolbarProps): JSX.Element => (
  <div className="file-explorer-toolbar">
    <div className="file-explorer-toolbar-buttons">
      <Button
        kind="ghost"
        icon={vsNewFile}
        tooltip="New notebook"
        onClick={createFile}
      />
      <Button
        kind="ghost"
        icon={vsNewFolder}
        tooltip="New folder"
        onClick={createFolder}
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

export default FileExplorerToolbar;
