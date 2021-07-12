import {
  ContextAction,
  ContextActions,
  SingleClickItemList,
  SingleClickRenderItemProps,
} from '@deephaven/components';
import React, {
  Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import FileList, {
  renderFileListItem,
  FileListItem,
  UpdateableComponent,
  DEFAULT_ROW_HEIGHT,
} from './FileList';
import { FileStorageTable, isDirectory } from './FileStorage';
import SHORTCUTS from './FileExplorerShortcuts';
import './FileExplorer.scss';
import FileUtils from './FileUtils';
import FileListItemEditor from './FileListItemEditor';

export interface FileListContainerProps {
  showContextMenu?: boolean;
  table: FileStorageTable;

  isMultiSelect?: boolean;

  onCreateFile?: (path?: string) => void;
  onCreateFolder?: (path?: string) => void;
  onCopy?: (file: FileListItem) => void;
  onDelete?: (files: FileListItem[]) => void;
  onMove?: (files: FileListItem[], path: string) => void;
  onRename?: (file: FileListItem, newName: string) => void;
  onSelect: (file: FileListItem) => void;
  validateRename?: (file: FileListItem, newName: string) => Promise<void>;

  /** Height of each item in the list */
  rowHeight?: number;
}

/**
 * Component that displays and allows interaction with the file system in the provided FileStorage.
 */
export const FileListContainer = React.forwardRef(
  (props: FileListContainerProps, ref: Ref<UpdateableComponent>) => {
    const {
      isMultiSelect = false,
      showContextMenu = false,
      onCreateFile,
      onCreateFolder,
      onCopy,
      onDelete,
      onMove = () => undefined,
      onRename,
      onSelect,
      table,
      rowHeight = DEFAULT_ROW_HEIGHT,
      validateRename = () => Promise.resolve(),
    } = props;
    const [renameItem, setRenameItem] = useState<FileListItem>();
    const [selectedItems, setSelectedItems] = useState([] as FileListItem[]);
    const [
      keyboardSelectedItem,
      setKeyboardSelectedItem,
    ] = useState<FileListItem>();
    const fileList = useRef<UpdateableComponent>(null);

    const handleSelectionChange = useCallback(
      (newSelectedItems, newKeyboardSelectedItem) => {
        setSelectedItems(newSelectedItems);
        setKeyboardSelectedItem(newKeyboardSelectedItem);
      },
      []
    );

    const handleCopyAction = useCallback(() => {
      if (keyboardSelectedItem) {
        onCopy?.(keyboardSelectedItem);
      }
    }, [keyboardSelectedItem, onCopy]);

    const handleDeleteAction = useCallback(() => {
      if (selectedItems.length > 0) {
        onDelete?.(selectedItems);
      }
    }, [onDelete, selectedItems]);

    const handleNewFileAction = useCallback(() => {
      onCreateFile?.();
    }, [onCreateFile]);

    const handleNewFolderAction = useCallback(() => {
      if (keyboardSelectedItem) {
        onCreateFolder?.(FileUtils.getPath(keyboardSelectedItem.filename));
      }
    }, [keyboardSelectedItem, onCreateFolder]);

    const handleRenameAction = useCallback(() => {
      if (keyboardSelectedItem) {
        setRenameItem(keyboardSelectedItem);
      }
    }, [keyboardSelectedItem]);

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
          disabled:
            keyboardSelectedItem == null || isDirectory(keyboardSelectedItem),
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
          disabled: keyboardSelectedItem == null,
        });
      }
      return result;
    }, [
      handleCopyAction,
      handleDeleteAction,
      handleNewFileAction,
      handleNewFolderAction,
      handleRenameAction,
      keyboardSelectedItem,
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
        if (renameItem) {
          return validateRename(renameItem, newName);
        }
        return Promise.reject(new Error('No rename item'));
      },
      [renameItem, validateRename]
    );

    const renderItem = useCallback(
      (itemProps: SingleClickRenderItemProps<FileListItem>): JSX.Element => {
        const { item } = itemProps;
        if (renameItem && renameItem.filename === item.filename) {
          return renderFileListItem({
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
        return renderFileListItem(itemProps);
      },
      [handleRenameCancel, handleRenameSubmit, renameItem, validateRenameItem]
    );

    useImperativeHandle(ref, () => ({
      updateDimensions: () => {
        fileList.current?.updateDimensions();
      },
    }));

    return (
      <div className="file-list-container">
        {table && (
          <FileList
            ref={fileList}
            onMove={onMove}
            onSelect={onSelect}
            onSelectionChange={handleSelectionChange}
            renderItem={renderItem}
            rowHeight={rowHeight}
            table={table}
            isMultiSelect={isMultiSelect}
          />
        )}
        {showContextMenu && <ContextActions actions={actions} />}
      </div>
    );
  }
);

FileListContainer.displayName = 'FileListContainer';

export default FileListContainer;
