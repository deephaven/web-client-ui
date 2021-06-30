import { SingleClickItemList } from '@deephaven/components';
import Log from '@deephaven/log';
import { CancelablePromise, PromiseUtils } from '@deephaven/utils';
import React, { useCallback, useEffect, useState } from 'react';
import { FileListItem } from './FileList';
import FileStorage, { FileStorageTable, isDirectory } from './FileStorage';
import './FileExplorer.scss';
import FileListContainer from './FileListContainer';
import FileUtils from './FileUtils';

const log = Log.module('FileExplorer');

export interface FileExplorerProps {
  storage: FileStorage;

  onDelete?: (files: FileListItem[]) => void;
  onRename?: (oldName: string, newName: string) => void;
  onSelect: (file: FileListItem) => void;

  /** Height of each item in the list */
  rowHeight?: number;
}

/**
 * Component that displays and allows interaction with the file system in the provided FileStorage.
 */
export const FileExplorer = ({
  storage,
  onDelete = () => undefined,
  onRename = () => undefined,
  onSelect,
  rowHeight = SingleClickItemList.DEFAULT_ROW_HEIGHT,
}: FileExplorerProps): JSX.Element => {
  const [table, setTable] = useState<FileStorageTable>();

  useEffect(() => {
    let tablePromise: CancelablePromise<FileStorageTable>;
    async function initTable() {
      log.debug('initTable');

      tablePromise = PromiseUtils.makeCancelable(storage.getTable(), t =>
        t.close()
      );

      try {
        setTable(await tablePromise);
      } catch (e) {
        if (!PromiseUtils.isCanceled(e)) {
          log.error('Unable to initialize table', e);
        }
      }
    }
    initTable();
    return () => {
      tablePromise.cancel();
    };
  }, [storage]);

  const handleError = useCallback((e: Error) => {
    if (!PromiseUtils.isCanceled(e)) {
      log.error(e);
    }
  }, []);

  const handleDelete = useCallback(
    (files: FileListItem[]) => {
      files.forEach(file =>
        storage.deleteFile(
          isDirectory(file) ? FileUtils.makePath(file.filename) : file.filename
        )
      );
      onDelete(files);
    },
    [onDelete, storage]
  );

  const handleRename = useCallback(
    (item: FileListItem, newName: string) => {
      let name = item.filename;
      const isDir = isDirectory(item);
      if (isDir && !name.endsWith('/')) {
        name = `${name}/`;
      }
      let destination = `${FileUtils.getParent(name)}${newName}`;
      if (isDir && !destination.endsWith('/')) {
        destination = `${destination}/`;
      }
      log.debug2('handleRename', name, destination);
      storage.moveFile(name, destination).catch(handleError);
      onRename(name, destination);
    },
    [handleError, onRename, storage]
  );

  return (
    <div className="file-explorer">
      {table && (
        <FileListContainer
          isMultiSelect
          showContextMenu
          onDelete={handleDelete}
          onRename={handleRename}
          onSelect={onSelect}
          rowHeight={rowHeight}
          table={table}
        />
      )}
    </div>
  );
};

export default FileExplorer;
