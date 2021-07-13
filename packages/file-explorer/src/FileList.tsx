import { ItemList, Range, RenderItemProps } from '@deephaven/components';
import { dhPython, vsCode, vsFolder, vsFolderOpened } from '@deephaven/icons';
import Log from '@deephaven/log';
import { RangeUtils } from '@deephaven/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import classNames from 'classnames';
import React, {
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FileStorageItem, FileStorageTable, isDirectory } from './FileStorage';
import './FileList.scss';
import FileUtils, { MIME_TYPE } from './FileUtils';

const log = Log.module('FileList');

export type LoadedViewport = {
  items: FileStorageItem[];
  offset: number;
  itemCount: number;
};

export type ListViewport = {
  top: number;
  bottom: number;
};

export type FileListRenderItemProps = RenderItemProps<FileStorageItem> & {
  children?: JSX.Element;
  dropTargetItem?: FileStorageItem;
  draggedItems?: FileStorageItem[];
  isDragInProgress: boolean;
  isDropTargetValid: boolean;

  onDragStart(index: number, e: React.DragEvent<HTMLDivElement>): void;
  onDragOver(index: number, e: React.DragEvent<HTMLDivElement>): void;
  onDragEnd(index: number, e: React.DragEvent<HTMLDivElement>): void;
  onDrop(index: number, e: React.DragEvent<HTMLDivElement>): void;
};

export interface FileListProps {
  table: FileStorageTable;

  isMultiSelect?: boolean;

  onFocusChange?: (focusedItem?: FileStorageItem) => void;
  onMove: (files: FileStorageItem[], path: string) => void;
  onSelect: (file: FileStorageItem) => void;
  onSelectionChange?: (selectedItems: FileStorageItem[]) => void;

  renderItem?: (props: FileListRenderItemProps) => JSX.Element;

  /** Height of each item in the list */
  rowHeight?: number;

  overscanCount?: number;
}

export const getPathFromItem = (file: FileStorageItem): string =>
  isDirectory(file)
    ? FileUtils.makePath(file.filename)
    : FileUtils.getPath(file.filename);

export const DEFAULT_ROW_HEIGHT = 26;

// How long you need to hover over a directory before it expands
export const DRAG_HOVER_TIMEOUT = 500;

export const renderFileListItem = (
  props: FileListRenderItemProps
): JSX.Element => {
  const {
    children,
    draggedItems,
    isDragInProgress,
    isDropTargetValid,
    isSelected,
    item,
    itemIndex,
    dropTargetItem,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
  } = props;

  const isDragged =
    draggedItems?.some(draggedItem => draggedItem.id === item.id) ?? false;
  const itemPath = getPathFromItem(item);
  const dropTargetPath =
    isDragInProgress && dropTargetItem ? getPathFromItem(dropTargetItem) : null;

  const isExactDropTarget =
    isDragInProgress &&
    isDropTargetValid &&
    isDirectory(item) &&
    dropTargetPath === FileUtils.makePath(item.filename);
  const isInDropTarget =
    isDragInProgress && isDropTargetValid && dropTargetPath === itemPath;
  const isInvalidDropTarget =
    isDragInProgress && !isDropTargetValid && dropTargetPath === itemPath;

  const icon = getItemIcon(item);
  const depth = FileUtils.getDepth(item.filename);
  const depthLines = Array(depth)
    .fill(null)
    .map((value, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <span className="file-list-depth-line" key={index} />
    ));

  return (
    <div
      className={classNames(
        'd-flex w-100 align-items-center',
        'file-list-item',
        {
          'is-dragged': isDragged,
          'is-exact-drop-target': isExactDropTarget,
          'is-in-drop-target': isInDropTarget,
          'is-invalid-drop-target': isInvalidDropTarget,
          'is-selected': isSelected,
        }
      )}
      onDragStart={e => onDragStart(itemIndex, e)}
      onDragOver={e => onDragOver(itemIndex, e)}
      onDragEnd={e => onDragEnd(itemIndex, e)}
      onDrop={e => onDrop(itemIndex, e)}
      draggable
      role="presentation"
    >
      {depthLines}{' '}
      <FontAwesomeIcon icon={icon} className="item-icon" fixedWidth />{' '}
      {children ?? item.basename}
    </div>
  );
};

/**
 * Get the icon definition for a file or folder item
 * @param {FileStorageItem} item Item to get the icon for
 * @returns {IconDefinition} Icon definition to pass in the FontAwesomeIcon icon prop
 */
export function getItemIcon(item: FileStorageItem): IconDefinition {
  if (isDirectory(item)) {
    return item.isExpanded ? vsFolderOpened : vsFolder;
  }
  const mimeType = FileUtils.getMimeType(item.basename);
  switch (mimeType) {
    case MIME_TYPE.PYTHON:
      return dhPython;
    default:
      return vsCode;
  }
}

/**
 * Get the move operation for the current selection and the given target. Throws if the operation is invalid.
 */
export function getMoveOperation(
  draggedItems: FileStorageItem[],
  targetItem: FileStorageItem
): { files: FileStorageItem[]; targetPath: string } {
  if (draggedItems.length === 0 || !targetItem) {
    throw new Error('No items to move');
  }

  const targetPath = isDirectory(targetItem)
    ? FileUtils.makePath(targetItem.filename)
    : FileUtils.getPath(targetItem.filename);
  if (
    draggedItems.some(
      ({ filename }) => FileUtils.getPath(filename) === targetPath
    )
  ) {
    // Cannot drop if target is one of the dragged items is already in the target folder
    throw new Error('File already in the destination folder');
  }
  return { files: draggedItems, targetPath };
}

export type UpdateableComponent = { updateDimensions: () => void };

/**
 * Component that displays and allows interaction with the file system in the provided FileStorageTable.
 */
export const FileList = React.forwardRef(
  (props: FileListProps, ref: Ref<UpdateableComponent>) => {
    const {
      isMultiSelect = false,
      table,
      onFocusChange = () => undefined,
      onMove,
      onSelect,
      onSelectionChange = () => undefined,
      renderItem = renderFileListItem,
      rowHeight = DEFAULT_ROW_HEIGHT,
      overscanCount = ItemList.DEFAULT_OVERSCAN,
    } = props;
    const [loadedViewport, setLoadedViewport] = useState<LoadedViewport>(
      () => ({
        items: [],
        offset: 0,
        itemCount: 0,
      })
    );
    const [viewport, setViewport] = useState<ListViewport>({
      top: 0,
      bottom: 0,
    });

    const [dropTargetItem, setDropTargetItem] = useState<FileStorageItem>();
    const [draggedItems, setDraggedItems] = useState<FileStorageItem[]>();
    const [dragPlaceholder, setDragPlaceholder] = useState<HTMLDivElement>();
    const [selectedRanges, setSelectedRanges] = useState([] as Range[]);
    const itemList = useRef<ItemList<FileStorageItem>>(null);

    const getItems = useCallback(
      (ranges: Range[]): FileStorageItem[] => {
        if (ranges.length === 0 || !loadedViewport) {
          return [];
        }

        const items = [] as FileStorageItem[];
        for (let i = 0; i < ranges.length; i += 1) {
          const range = ranges[i];
          for (let j = range[0]; j <= range[1]; j += 1) {
            if (
              j >= loadedViewport.offset &&
              j < loadedViewport.offset + loadedViewport.items.length
            ) {
              items.push(loadedViewport.items[j - loadedViewport.offset]);
            }
          }
        }
        return items;
      },
      [loadedViewport]
    );

    const getItem = useCallback(
      (itemIndex: number): FileStorageItem | undefined => {
        const items = getItems([[itemIndex, itemIndex]]);
        if (items.length > 0) {
          return items[0];
        }
      },
      [getItems]
    );

    /**
     * Get the placeholder text to show when a drag operation is in progress
     */
    const getDragPlaceholderText = useCallback(() => {
      const count = RangeUtils.count(selectedRanges);
      if (count === 0) {
        return null;
      }

      if (count === 1) {
        const index = selectedRanges[0][0];
        const item = getItem(index);
        if (item != null) {
          return item.filename;
        }
      }
      return `${count} items`;
    }, [getItem, selectedRanges]);

    const handleSelect = useCallback(
      (itemIndex: number) => {
        const item = loadedViewport.items[itemIndex - loadedViewport.offset];
        if (item !== undefined) {
          log.debug('handleItemClick', item);

          onSelect(item);
          if (isDirectory(item)) {
            table?.setExpanded(item.filename, !item.isExpanded);
          }
        }
      },
      [loadedViewport, onSelect, table]
    );

    const handleItemDragStart = useCallback(
      (itemIndex: number, e: React.DragEvent<HTMLDivElement>) => {
        log.debug2('handleItemDragStart', itemIndex, selectedRanges);

        let draggedRanges = selectedRanges;
        if (!RangeUtils.isSelected(selectedRanges, itemIndex)) {
          draggedRanges = [[itemIndex, itemIndex]];
          setSelectedRanges(draggedRanges);
        }

        setDraggedItems(getItems(draggedRanges));

        // We need to reset reset the mouse state since we steal the drag
        itemList.current?.resetMouseState();

        const newDragPlaceholder = document.createElement('div');
        newDragPlaceholder.innerHTML = `<div class="dnd-placeholder-content">${getDragPlaceholderText()}</div>`;
        newDragPlaceholder.className = 'file-list-dnd-placeholder';
        document.body.appendChild(newDragPlaceholder);
        e.dataTransfer.setDragImage(newDragPlaceholder, 0, 0);
        setDragPlaceholder(newDragPlaceholder);
      },
      [getDragPlaceholderText, getItems, selectedRanges]
    );

    const handleItemDragOver = useCallback(
      (itemIndex: number, e: React.DragEvent<HTMLDivElement>) => {
        log.debug2('handleItemDragOver', e);
        setDropTargetItem(getItem(itemIndex));
      },
      [getItem]
    );

    const handleItemDragEnd = useCallback(
      (itemIndex: number, e: React.DragEvent<HTMLDivElement>) => {
        log.debug('handleItemDragEnd', itemIndex);

        dragPlaceholder?.remove();

        // Drag end is triggered after drop
        // Also drop isn't triggered if drag end is outside of the list
        setDraggedItems(undefined);
        setDropTargetItem(undefined);
        setDragPlaceholder(undefined);
      },
      [dragPlaceholder]
    );

    const handleItemDrop = useCallback(
      (itemIndex: number, e: React.DragEvent<HTMLDivElement>) => {
        if (!draggedItems || !dropTargetItem) {
          return;
        }

        log.debug('handleItemDrop', draggedItems, 'to', itemIndex);

        try {
          const { files, targetPath } = getMoveOperation(
            draggedItems,
            dropTargetItem
          );
          onMove(files, targetPath);
          setSelectedRanges([[itemIndex, itemIndex]]);
          itemList.current?.focusItem(itemIndex);
        } catch (err) {
          log.error('Unable to complete move', err);
        }
      },
      [draggedItems, dropTargetItem, onMove]
    );

    const handleSelectionChange = useCallback(
      newSelectedRanges => {
        log.debug2('handleSelectionChange', newSelectedRanges);
        if (newSelectedRanges !== selectedRanges) {
          setSelectedRanges(newSelectedRanges);
          const selectedItems = getItems(newSelectedRanges);
          onSelectionChange(selectedItems);
        }
      },
      [getItems, onSelectionChange, selectedRanges]
    );

    const handleFocusChange = useCallback(
      focusIndex => {
        log.debug2('handleFocusChange', focusIndex);
        if (focusIndex != null) {
          const [focusedItem] = getItems([[focusIndex, focusIndex]]);
          onFocusChange(focusedItem);
        } else {
          onFocusChange();
        }
      },
      [getItems, onFocusChange]
    );

    const handleViewportChange = useCallback(
      (top: number, bottom: number) => {
        log.debug('handleViewportChange', top, bottom);
        if (top !== viewport.top || bottom !== viewport.bottom) {
          setViewport({ top, bottom });
        }
      },
      [viewport]
    );

    const isDropTargetValid = useMemo(() => {
      if (!draggedItems || !dropTargetItem) {
        return false;
      }

      try {
        getMoveOperation(draggedItems, dropTargetItem);
        log.debug('handleValidateDropTarget true');
        return true;
      } catch (e) {
        log.debug('handleValidateDropTarget false');
        return false;
      }
    }, [draggedItems, dropTargetItem]);

    useEffect(() => {
      log.debug('updating table viewport', viewport);
      table?.setViewport({
        top: Math.max(0, viewport.top - overscanCount),
        bottom: viewport.bottom + overscanCount,
      });
    }, [overscanCount, table, viewport]);

    // Listen for table updates
    useEffect(() => {
      const listenerRemover = table.onUpdate(newViewport => {
        setLoadedViewport({
          items: newViewport.items.map(item => ({
            ...item,
            itemName: item.basename,
          })),
          offset: newViewport.offset,
          itemCount: table.size,
        });
      });
      return () => {
        listenerRemover();
      };
    }, [table]);

    // Expand a folder if hovering over it
    useEffect(() => {
      if (dropTargetItem != null && isDirectory(dropTargetItem)) {
        const timeout = setTimeout(() => {
          if (!dropTargetItem.isExpanded) {
            table?.setExpanded(dropTargetItem.filename, true);
          }
        }, DRAG_HOVER_TIMEOUT);
        return () => clearTimeout(timeout);
      }
    }, [dropTargetItem, table]);

    useImperativeHandle(ref, () => ({
      updateDimensions: () => {
        requestAnimationFrame(() => {
          // TODO: still needed??
          // itemList.current?.updateViewport();
        });
      },
    }));

    const renderWrapper = useCallback(
      itemProps =>
        renderItem({
          ...itemProps,
          isDragInProgress: draggedItems != null,
          dropTargetItem,
          draggedItems,
          isDropTargetValid,
          onDragStart: handleItemDragStart,
          onDragEnd: handleItemDragEnd,
          onDragOver: handleItemDragOver,
          onDrop: handleItemDrop,
        }),
      [
        handleItemDragEnd,
        handleItemDragOver,
        handleItemDragStart,
        handleItemDrop,
        draggedItems,
        dropTargetItem,
        isDropTargetValid,
        renderItem,
      ]
    );

    return (
      <div
        className={classNames('file-list', {
          'is-dragging': draggedItems != null,
        })}
      >
        <ItemList
          ref={itemList}
          items={loadedViewport.items}
          itemCount={loadedViewport.itemCount}
          offset={loadedViewport.offset}
          onFocusChange={handleFocusChange}
          onSelect={handleSelect}
          onSelectionChange={handleSelectionChange}
          onViewportChange={handleViewportChange}
          selectedRanges={selectedRanges}
          renderItem={renderWrapper}
          rowHeight={rowHeight}
          isMultiSelect={isMultiSelect}
          isDragSelect={false}
        />
      </div>
    );
  }
);

export default FileList;
