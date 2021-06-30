import {
  Range,
  SingleClickItemList,
  SingleClickRenderItemBase,
  SingleClickRenderItemProps,
} from '@deephaven/components';
import { dhPython, vsCode, vsFolder, vsFolderOpened } from '@deephaven/icons';
import Log from '@deephaven/log';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import classNames from 'classnames';
import React, {
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  DirectoryStorageItem,
  FileStorageItem,
  FileStorageTable,
  isDirectory,
} from './FileStorage';
import './FileList.scss';
import FileUtils, { MIME_TYPE } from './FileUtils';

const log = Log.module('FileList');

export type FileListItem = SingleClickRenderItemBase & FileStorageItem;

export type DirectoryListItem = FileListItem & DirectoryStorageItem;

export type LoadedViewport = {
  items: FileListItem[];
  offset: number;
  itemCount: number;
};

export type ListViewport = {
  top: number;
  bottom: number;
};

export interface FileListProps {
  table: FileStorageTable;

  isMultiSelect?: boolean;

  onMove: (files: FileListItem[], path: string) => void;
  onSelect: (file: FileListItem) => void;
  onSelectionChange?: (
    selectedItems: FileListItem[],
    keyboardSelectedItem?: FileListItem
  ) => void;

  renderItem?: (props: SingleClickRenderItemProps<FileListItem>) => JSX.Element;

  /** Height of each item in the list */
  rowHeight?: number;
}

export const DEFAULT_RENDER_ITEM = (
  props: SingleClickRenderItemProps<FileListItem>
): JSX.Element => {
  const { isDragged, isSelected, item } = props;

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
        'is-selected': isSelected,
      })}
    >
      {depthLines}{' '}
      <FontAwesomeIcon icon={icon} className="item-icon" fixedWidth />{' '}
      {item.basename}
    </div>
  );
};

/**
 * Get the icon definition for a file or folder item
 * @param {FileListItem} item Item to get the icon for
 * @returns {IconDefinition} Icon definition to pass in the FontAwesomeIcon icon prop
 */
export function getItemIcon(item: FileListItem): IconDefinition {
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
      onMove,
      onSelect,
      onSelectionChange = () => undefined,
      renderItem = DEFAULT_RENDER_ITEM,
      rowHeight = SingleClickItemList.DEFAULT_ROW_HEIGHT,
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
    const itemList = useRef<SingleClickItemList<FileListItem>>(null);

    const getSelectedItems = useCallback(
      (ranges: Range[]): FileListItem[] => {
        if (ranges.length === 0 || !loadedViewport) {
          return [];
        }

        const items = [] as FileListItem[];
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

    const handleItemDrop = useCallback(
      (ranges: Range[], targetIndex: number) => {
        log.debug2('handleItemDrop', ranges, targetIndex);

        const draggedItems = getSelectedItems(ranges);
        const [targetItem] = getSelectedItems([[targetIndex, targetIndex]]);
        if (draggedItems.length === 0 || !targetItem) {
          return;
        }

        const targetPath = FileUtils.getPath(targetItem.filename);
        if (
          draggedItems.some(({ filename }) => filename.startsWith(targetPath))
        ) {
          // Cannot drop if target is one of the dragged items
          // or at least one of the dragged items is already in the target folder
          return;
        }
        onMove(draggedItems, targetPath);
      },
      [getSelectedItems, onMove]
    );

    const handleItemSelect = useCallback(
      itemIndex => {
        const item = loadedViewport.items[itemIndex];
        if (item !== undefined) {
          log.debug('handleItemSelect', item);

          onSelect(item);
          if (isDirectory(item)) {
            table?.setExpanded(item.filename, !item.isExpanded);
          }
        }
      },
      [loadedViewport, onSelect, table]
    );

    const handleSelectionChange = useCallback(
      (selectedRanges, keyboardIndex) => {
        log.debug2('handleSelectionChange', selectedRanges, keyboardIndex);
        const selectedItems = getSelectedItems(selectedRanges);
        const [keyboardSelectedItem] = getSelectedItems([
          [keyboardIndex, keyboardIndex],
        ]);
        onSelectionChange(selectedItems, keyboardSelectedItem);
      },
      [getSelectedItems, onSelectionChange]
    );

    const handleViewportChange = useCallback((top: number, bottom: number) => {
      log.debug('handleViewportChange', top, bottom);
      setViewport({ top, bottom });
    }, []);

    const handleValidateDropTarget = useCallback(() => {
      log.debug('handleValidateDropTarget');
      return false;
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
          itemList.current?.updateViewport();
        });
      },
    }));

    return (
      <div className="file-list">
        <SingleClickItemList
          ref={itemList}
          items={loadedViewport.items}
          itemCount={loadedViewport.itemCount}
          offset={loadedViewport.offset}
          onDrop={handleItemDrop}
          onSelect={handleItemSelect}
          onSelectionChange={handleSelectionChange}
          onViewportChange={handleViewportChange}
          renderItem={renderItem}
          rowHeight={rowHeight}
          // TODO: web-client-ui#86, re-enable drag and drop to move
          // isDraggable
          isMultiSelect={isMultiSelect}
          validateDropTarget={handleValidateDropTarget}
        />
      </div>
    );
  }
);

export default FileList;
