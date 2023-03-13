import { ContextAction, ContextActions } from '@deephaven/components';
import { assertNotNull } from '@deephaven/utils';
import React, { useCallback, useMemo, useState } from 'react';
import FileList, {
  RenderFileListItem,
  FileListRenderItemProps,
} from './FileList';
import { DEFAULT_ROW_HEIGHT } from './FileListUtils';
import { FileStorageItem, FileStorageTable, isDirectory } from './FileStorage';
import SHORTCUTS from './FileExplorerShortcuts';
import './FileExplorer.scss';
import FileUtils from './FileUtils';
import FileListItemEditor from './FileListItemEditor';

export interface FileListContainerProps {
  showContextMenu?: boolean;
  table: FileStorageTable;

  isMultiSelect?: boolean;
  focusedPath?: string;

  onCreateFile?: (path?: string) => void;
  onCreateFolder?: (path?: string) => void;
  onCopy?: (file: FileStorageItem) => void;
  onDelete?: (files: FileStorageItem[]) => void;
  onMove?: (files: FileStorageItem[], path: string) => void;
  onRename?: (file: FileStorageItem, newName: string) => void;
  onSelect: (file: FileStorageItem, event: React.SyntheticEvent) => void;
  validateRename?: (file: FileStorageItem, newName: string) => Promise<void>;
  onSelectionChange?: (selectedItems: FileStorageItem[]) => void;

  /** Height of each item in the list */
  rowHeight?: number;
}

/**
 * Component that displays and allows interaction with the file system in the provided FileStorage.
 */
export function FileListContainer(props: FileListContainerProps): JSX.Element {
  const {
    isMultiSelect = false,
    focusedPath,
    showContextMenu = false,
    onCreateFile,
    onCreateFolder,
    onCopy,
    onDelete,
    onMove,
    onRename,
    onSelect,
    onSelectionChange,
    table,
    rowHeight = DEFAULT_ROW_HEIGHT,
    validateRename = () => Promise.resolve(),
  } = props;
  const [renameItem, setRenameItem] = useState<FileStorageItem>();
  const [selectedItems, setSelectedItems] = useState([] as FileStorageItem[]);
  const [focusedItem, setFocusedItem] = useState<FileStorageItem>();

  const handleSelectionChange = useCallback(
    newSelectedItems => {
      setSelectedItems(newSelectedItems);
      onSelectionChange?.(newSelectedItems);
    },
    [onSelectionChange]
  );

  const handleFocusChange = useCallback(newFocusedItem => {
    setFocusedItem(newFocusedItem);
  }, []);

  const handleCopyAction = useCallback(() => {
    if (focusedItem) {
      onCopy?.(focusedItem);
    }
  }, [focusedItem, onCopy]);

  const handleDeleteAction = useCallback(() => {
    if (selectedItems.length > 0) {
      onDelete?.(selectedItems);
    }
  }, [onDelete, selectedItems]);

  const handleNewFileAction = useCallback(() => {
    onCreateFile?.();
  }, [onCreateFile]);

  const handleNewFolderAction = useCallback(() => {
    if (focusedItem) {
      onCreateFolder?.(FileUtils.getPath(focusedItem.filename));
    }
  }, [focusedItem, onCreateFolder]);

  const handleRenameAction = useCallback(() => {
    if (focusedItem) {
      setRenameItem(focusedItem);
    }
  }, [focusedItem]);

  const handleRenameCancel = useCallback((): void => {
    setRenameItem(undefined);
  }, []);

  const handleRenameSubmit = useCallback(
    (newName: string): void => {
      if (renameItem) {
        onRename?.(renameItem, newName);
        setRenameItem(undefined);
      }
    },
    [onRename, renameItem]
  );

  const actions = useMemo(() => {
    if (renameItem) {
      // While renaming, we don't want to enable any of the context actions or it may interfere with renaming input
      return [];
    }

    const result = [] as ContextAction[];
    if (onCreateFile) {
      result.push({
        title: 'New File',
        description: 'Create new file',
        action: handleNewFileAction,
        group: ContextActions.groups.medium,
      });
    }
    if (onCreateFolder) {
      result.push({
        title: 'New Folder',
        description: 'Create new folder',
        action: handleNewFolderAction,
        group: ContextActions.groups.medium,
      });
    }
    if (onCopy) {
      result.push({
        title: 'Copy',
        description: 'Copy',
        action: handleCopyAction,
        group: ContextActions.groups.low,
        disabled: focusedItem == null || isDirectory(focusedItem),
      });
    }
    if (onDelete && selectedItems.length > 0) {
      result.push({
        title: 'Delete',
        description: 'Delete',
        shortcut: SHORTCUTS.FILE_EXPLORER.DELETE,
        action: handleDeleteAction,
        group: ContextActions.groups.low,
      });
    }
    if (onRename) {
      result.push({
        title: 'Rename',
        description: 'Rename',
        shortcut: SHORTCUTS.FILE_EXPLORER.RENAME,
        action: handleRenameAction,
        group: ContextActions.groups.low,
        disabled: focusedItem == null,
      });
    }
    return result;
  }, [
    handleCopyAction,
    handleDeleteAction,
    handleNewFileAction,
    handleNewFolderAction,
    handleRenameAction,
    focusedItem,
    onCopy,
    onCreateFile,
    onCreateFolder,
    onDelete,
    onRename,
    selectedItems,
    renameItem,
  ]);

  const validateRenameItem = useCallback(
    (newName: string): Promise<void> => {
      assertNotNull(renameItem);
      return validateRename(renameItem, newName);
    },
    [renameItem, validateRename]
  );

  const renderItem = useCallback(
    (itemProps: FileListRenderItemProps): JSX.Element => {
      const { item } = itemProps;
      if (renameItem && renameItem.filename === item.filename) {
        return RenderFileListItem({
          ...itemProps,
          children: (
            <FileListItemEditor
              item={item}
              validate={validateRenameItem}
              onSubmit={handleRenameSubmit}
              onCancel={handleRenameCancel}
            />
          ),
        });
      }
      return RenderFileListItem(itemProps);
    },
    [handleRenameCancel, handleRenameSubmit, renameItem, validateRenameItem]
  );

  return (
    <div className="file-list-container">
      {table != null && (
        <FileList
          onMove={onMove}
          onSelect={onSelect}
          onSelectionChange={handleSelectionChange}
          onFocusChange={handleFocusChange}
          renderItem={renderItem}
          rowHeight={rowHeight}
          table={table}
          isMultiSelect={isMultiSelect}
          focusedPath={focusedPath}
        />
      )}
      {showContextMenu && <ContextActions actions={actions} />}
    </div>
  );
}

FileListContainer.displayName = 'FileListContainer';

export default FileListContainer;
