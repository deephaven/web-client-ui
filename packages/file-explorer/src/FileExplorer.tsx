import {
  SingleClickItemList,
  SingleClickRenderItemBase,
} from '@deephaven/components';
import Log from '@deephaven/log';
import { CancelablePromise, PromiseUtils } from '@deephaven/utils';
import React, { useCallback, useEffect, useState } from 'react';
import FileStorage, {
  DirectoryStorageItem,
  FileStorageItem,
  FileStorageTable,
  isDirectory,
} from './FileStorage';
import './FileExplorer.scss';

const log = Log.module('FileExplorer');

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

export interface FileExplorerProps {
  storage: FileStorage;

  onSelect: (file: FileListItem) => void;

  /** Height of each item in the list */
  rowHeight?: number;
}

/**
 * Component that displays and allows interaction with the file system in the provided FileStorage.
 */
export const FileExplorer = ({
  storage,
  onSelect,
  rowHeight = SingleClickItemList.DEFAULT_ROW_HEIGHT,
}: FileExplorerProps): JSX.Element => {
  const [loadedViewport, setLoadedViewport] = useState<LoadedViewport>(() => ({
    items: [],
    offset: 0,
    itemCount: 0,
  }));
  const [table, setTable] = useState<FileStorageTable>();
  const [viewport, setViewport] = useState<ListViewport>({ top: 0, bottom: 0 });

  const handleItemDrop = useCallback(() => {
    log.debug('handleItemDrop');
  }, []);

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

  const handleSelectionChange = useCallback(e => {
    log.debug('handleSelectionChange', e);
  }, []);

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
    let tablePromise: CancelablePromise<FileStorageTable>;
    async function initTable() {
      log.debug('initTable');

      tablePromise = PromiseUtils.makeCancelable(storage.getTable(), t =>
        t.close()
      );

      const t = await tablePromise;

      log.debug('adding listening');

      t.onUpdate(newViewport => {
        log.debug('t.onUpdate');
        setLoadedViewport({
          items: newViewport.items.map(item => ({
            ...item,
            itemName: item.basename,
          })),
          offset: newViewport.offset,
          itemCount: t.size,
        });
      });

      log.debug('initTable end calling setTable');
      setTable(t);
    }
    initTable();
    return () => {
      tablePromise.cancel();
    };
  }, [storage]);

  return (
    <div className="file-explorer">
      <SingleClickItemList
        items={loadedViewport.items}
        itemCount={loadedViewport.itemCount}
        offset={loadedViewport.offset}
        onDrop={handleItemDrop}
        onSelect={handleItemSelect}
        onSelectionChange={handleSelectionChange}
        onViewportChange={handleViewportChange}
        // renderItem={cachedRenderItem}
        rowHeight={rowHeight}
        isDraggable
        isMultiSelect
        validateDropTarget={handleValidateDropTarget}
      />
    </div>
  );
};

export default FileExplorer;
