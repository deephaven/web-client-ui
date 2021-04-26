import { useEffect, useMemo } from 'react';
import debounce from 'lodash.debounce';
import { CommandHistoryStorageItem } from './CommandHistoryStorage';
import StorageTable, { StorageTableViewport } from './StorageTable';

export type StorageTableViewportUpdaterProps = {
  table: StorageTable<CommandHistoryStorageItem>;
  top?: number;
  bottom?: number;
  search: string;
  onUpdate(viewportUpdate: {
    items: CommandHistoryStorageItem[];
    itemCount: number;
    offset: number;
  }): void;
};

function StorageTableViewportUpdater({
  table,
  top,
  bottom,
  search,
  onUpdate,
}: StorageTableViewportUpdaterProps): null {
  const debouncedUpdateViewport = useMemo(
    () =>
      debounce(
        (viewport: StorageTableViewport | undefined) =>
          table.setViewport(viewport),
        150
      ),
    [table]
  );

  useEffect(() => {
    table.onUpdate(() => {
      onUpdate({
        items: table.data?.items ?? [],
        offset: table.data?.viewport.top ?? 0,
        itemCount: table.size,
      });
    });
  }, [table, onUpdate]);

  useEffect(() => {
    if (top !== undefined && bottom !== undefined) {
      debouncedUpdateViewport({
        top,
        bottom,
        search,
      });
    } else {
      debouncedUpdateViewport(undefined);
    }
  }, [top, bottom, search, debouncedUpdateViewport]);

  return null;
}

export default StorageTableViewportUpdater;
