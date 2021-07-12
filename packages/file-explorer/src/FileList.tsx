import {
  DraggableItemList,
  DraggableRenderItemProps,
  Range,
} from '@deephaven/components';
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
import {
  DragDropContext,
  DragStart,
  DragUpdate,
  DropResult,
} from 'react-beautiful-dnd';
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

export type FileListRenderItemProps = DraggableRenderItemProps<FileStorageItem> & {
  children?: JSX.Element;
  dropTargetItem?: FileStorageItem;
  isDragged: boolean;
  isDragInProgress: boolean;
  isDropTargetValid: boolean;
  onClick(index: number, e: React.MouseEvent<HTMLDivElement>): void;
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
}

export const getPathFromItem = (file: FileStorageItem): string =>
  isDirectory(file)
    ? FileUtils.makePath(file.filename)
    : FileUtils.getPath(file.filename);

export const DEFAULT_ROW_HEIGHT = 26;

export const renderFileListItem = (
  props: FileListRenderItemProps
): JSX.Element => {
  const {
    children,
    isDragged,
    isDragInProgress,
    isDropTargetValid,
    isSelected,
    item,
    itemIndex,
    dropTargetItem,
    onClick,
  } = props;
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
      className={classNames('d-flex w-100 align-items-center', {
        'is-dragged': isDragged,
        'is-exact-drop-target': isExactDropTarget,
        'is-in-drop-target': isInDropTarget,
        'is-invalid-drop-target': isInvalidDropTarget,
        'is-selected': isSelected,
      })}
      onClick={e => onClick(itemIndex, e)}
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

    const [dropTargetIndex, setDropTargetIndex] = useState<number>();
    const [isDragging, setIsDragging] = useState(false);
    const [selectedRanges, setSelectedRanges] = useState([] as Range[]);
    const itemList = useRef<DraggableItemList<FileStorageItem>>(null);

    const getSelectedItems = useCallback(
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

    const getSelectedItem = useCallback(
      (itemIndex: number): FileStorageItem | undefined => {
        const items = getSelectedItems([[itemIndex, itemIndex]]);
        if (items.length > 0) {
          return items[0];
        }
      },
      [getSelectedItems]
    );

    const getMoveOperation = useCallback(
      (
        ranges: Range[],
        targetIndex: number
      ): { files: FileStorageItem[]; targetPath: string } => {
        const draggedItems = getSelectedItems(ranges);
        const [targetItem] = getSelectedItems([[targetIndex, targetIndex]]);
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
      },
      [getSelectedItems]
    );

    const handleDragStart = useCallback(
      (e: DragStart) => {
        log.debug('handleDragStart', e);
        setIsDragging(true);

        const startIndex = e.source.index;
        if (!RangeUtils.isSelected(selectedRanges, startIndex)) {
          setSelectedRanges([[startIndex, startIndex]]);
        }
      },
      [selectedRanges]
    );

    const handleDragUpdate = useCallback((e: DragUpdate) => {
      log.debug('handleDragUpdate', e);
      setDropTargetIndex(e.destination?.index);
    }, []);

    const handleDragEnd = useCallback(
      (e: DropResult) => {
        log.debug('handleDragEnd', e);
        setIsDragging(false);
        const targetIndex = e.destination?.index;
        if (e.reason === 'CANCEL' || targetIndex == null) {
          return;
        }

        log.debug('Dropping items', selectedRanges, 'to', targetIndex);

        try {
          const { files, targetPath } = getMoveOperation(
            selectedRanges,
            targetIndex
          );
          onMove(files, targetPath);
          setSelectedRanges([[targetIndex, targetIndex]]);
          itemList.current?.focusItem(targetIndex);
        } catch (err) {
          log.error('Unable to complete move', err);
        }
      },
      [getMoveOperation, onMove, selectedRanges]
    );

    const handleItemClick = useCallback(
      (itemIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0 || e.shiftKey || e.metaKey || e.altKey) {
          return;
        }

        e.stopPropagation();

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

    const handleSelectionChange = useCallback(
      newSelectedRanges => {
        log.debug2('handleSelectionChange', newSelectedRanges);
        setSelectedRanges(newSelectedRanges);
        const selectedItems = getSelectedItems(newSelectedRanges);
        onSelectionChange(selectedItems);
      },
      [getSelectedItems, onSelectionChange]
    );

    const handleFocusChange = useCallback(
      focusIndex => {
        log.debug2('handleFocusChange', focusIndex);
        const [focusedItem] = getSelectedItems([[focusIndex, focusIndex]]);
        onFocusChange(focusedItem);
      },
      [getSelectedItems, onFocusChange]
    );

    const handleViewportChange = useCallback((top: number, bottom: number) => {
      log.debug('handleViewportChange', top, bottom);
      setViewport({ top, bottom });
    }, []);

    useEffect(() => {
      log.debug('updating table viewport', viewport);
      table?.setViewport(viewport);
    }, [table, viewport]);

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

    useImperativeHandle(ref, () => ({
      updateDimensions: () => {
        requestAnimationFrame(() => {
          // TODO: still needed??
          // itemList.current?.updateViewport();
        });
      },
    }));

    const dropTargetItem = useMemo(
      () =>
        dropTargetIndex != null ? getSelectedItem(dropTargetIndex) : undefined,
      [getSelectedItem, dropTargetIndex]
    );

    const isDropTargetValid = useMemo(() => {
      if (dropTargetIndex == null) {
        return false;
      }

      try {
        getMoveOperation(selectedRanges, dropTargetIndex);
        log.debug('handleValidateDropTarget true');
        return true;
      } catch (e) {
        log.debug('handleValidateDropTarget false');
        return false;
      }
    }, [dropTargetIndex, getMoveOperation, selectedRanges]);

    return (
      <div className="file-list">
        <DragDropContext
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
          onDragEnd={handleDragEnd}
        >
          <DraggableItemList
            ref={itemList}
            items={loadedViewport.items}
            itemCount={loadedViewport.itemCount}
            offset={loadedViewport.offset}
            onFocusChange={handleFocusChange}
            onSelectionChange={handleSelectionChange}
            onViewportChange={handleViewportChange}
            renderItem={itemProps =>
              renderItem({
                ...itemProps,
                isDragInProgress: isDragging,
                dropTargetItem,
                isDragged: RangeUtils.isSelected(
                  selectedRanges,
                  itemProps.itemIndex
                ),
                isDropTargetValid,
                onClick: handleItemClick,
              })
            }
            rowHeight={rowHeight}
            isMultiSelect={isMultiSelect}
          />
        </DragDropContext>
      </div>
    );
  }
);

export default FileList;
