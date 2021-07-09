import { BasicModal, SingleClickItemList } from '@deephaven/components';
import Log from '@deephaven/log';
import { CancelablePromise, PromiseUtils } from '@deephaven/utils';
import React, {
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FileListItem, UpdateableComponent } from './FileList';
import FileStorage, { FileStorageTable, isDirectory } from './FileStorage';
import './FileExplorer.scss';
import FileListContainer from './FileListContainer';
import FileUtils from './FileUtils';
import FileExistsError from './FileExistsError';
import FileNotFoundError from './FileNotFoundError';

const log = Log.module('FileExplorer');

export interface FileExplorerProps {
  storage: FileStorage;

  isMultiSelect?: boolean;

  onDelete?: (files: FileListItem[]) => void;
  onRename?: (oldName: string, newName: string) => void;
  onSelect: (file: FileListItem) => void;

  /** Height of each item in the list */
  rowHeight?: number;
}

/**
 * Component that displays and allows interaction with the file system in the provided FileStorage.
 */
export const FileExplorer = React.forwardRef(
  (props: FileExplorerProps, ref: Ref<UpdateableComponent>) => {
    const {
      storage,
      isMultiSelect = false,
      onDelete = () => undefined,
      onRename = () => undefined,
      onSelect,
      rowHeight = SingleClickItemList.DEFAULT_ROW_HEIGHT,
    } = props;
    const fileListContainer = useRef<UpdateableComponent>(null);
    const [itemsToDelete, setItemsToDelete] = useState<FileListItem[]>([]);
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

    const handleDelete = useCallback((files: FileListItem[]) => {
      log.debug('handleDelete, pending confirmation', files);
      setItemsToDelete(files);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
      log.debug('handleDeleteConfirm', itemsToDelete);
      itemsToDelete.forEach(file =>
        storage.deleteFile(
          isDirectory(file) ? FileUtils.makePath(file.filename) : file.filename
        )
      );
      onDelete(itemsToDelete);
      setItemsToDelete([]);
    }, [itemsToDelete, onDelete, storage]);

    const handleDeleteCancel = useCallback(() => {
      log.debug('handleDeleteCancel');
      setItemsToDelete([]);
    }, []);

    const handleMove = useCallback(
      (files: FileListItem[], path: string) => {
        const filesToMove = FileUtils.reducePaths(
          files.map(file => file.filename)
        );
        const movePromises = filesToMove.map(file =>
          storage.moveFile(file, `${path}${FileUtils.getBaseName(file)}`)
        );
        Promise.all(movePromises).catch(handleError);
      },
      [storage]
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

    const handleValidateRename = useCallback(
      async (renameItem: FileListItem, newName: string): Promise<void> => {
        if (newName === renameItem.basename) {
          // Same name is fine
          return undefined;
        }
        FileUtils.validateName(newName);

        const newValue = `${FileUtils.getPath(renameItem.filename)}${newName}`;
        try {
          const fileInfo = await storage.info(newValue);
          throw new FileExistsError(fileInfo);
        } catch (e) {
          if (!(e instanceof FileNotFoundError)) {
            throw e;
          }
          // The file does not exist, fine to save at that path
        }
      },
      [storage]
    );

    useImperativeHandle(ref, () => ({
      updateDimensions: () => {
        fileListContainer.current?.updateDimensions();
      },
    }));

    const isDeleteConfirmationShown = itemsToDelete.length > 0;
    const deleteConfirmationMessage = useMemo(() => {
      if (itemsToDelete.length === 1) {
        return `Are you sure you want to delete "${itemsToDelete[0].itemName}"?`;
      }
      return `Are you sure you want to delete the selected files?`;
    }, [itemsToDelete]);

    return (
      <div className="file-explorer">
        {table && (
          <FileListContainer
            ref={fileListContainer}
            isMultiSelect={isMultiSelect}
            showContextMenu
            onMove={handleMove}
            onDelete={handleDelete}
            onRename={handleRename}
            onSelect={onSelect}
            rowHeight={rowHeight}
            table={table}
            validateRename={handleValidateRename}
          />
        )}
        <BasicModal
          isOpen={isDeleteConfirmationShown}
          headerText={deleteConfirmationMessage}
          bodyText="You cannot undo this action."
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          confirmButtonText="Delete"
        />
      </div>
    );
  }
);

FileExplorer.displayName = 'FileExplorer';

export default FileExplorer;
