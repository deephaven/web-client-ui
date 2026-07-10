import { useEffect, useMemo } from 'react';
import throttle from 'lodash.throttle';
import {
  type StorageTableViewport,
  type ViewportData,
  type ViewportUpdateCallback,
} from '@deephaven/storage';
import Log from '@deephaven/log';
import {
  type CommandHistoryStorageItem,
  type CommandHistoryTable,
} from './CommandHistoryStorage';

export type CommandHistoryViewportUpdaterProps = {
  table: CommandHistoryTable;
  columns?: string[];
  top?: number;
  bottom?: number;
  search?: string;
  isReversed?: boolean;
  // Whether the command history panel is currently visible. When it's
  // backgrounded (e.g. another tab is active) we don't need to keep a viewport
  // subscribed on the table, as nothing is rendered from it.
  isPanelActive?: boolean;
  onUpdate: ViewportUpdateCallback<CommandHistoryStorageItem>;
};

const UPDATE_DELAY = 150;

const ROW_BUFFER_PAGES = 3;

const log = Log.module('CommandHistoryViewportUpdater');

function CommandHistoryViewportUpdater({
  table,
  columns,
  top = 0,
  bottom = 0,
  search,
  isReversed = false,
  isPanelActive = true,
  onUpdate,
}: CommandHistoryViewportUpdaterProps): null {
  const throttledUpdateViewport = useMemo(
    () =>
      throttle((viewport: StorageTableViewport) => {
        const viewHeight = viewport.bottom - viewport.top;
        const bufferedTop = Math.max(
          0,
          viewport.top - viewHeight * ROW_BUFFER_PAGES
        );
        const bufferedBottom = viewport.bottom + viewHeight * ROW_BUFFER_PAGES;

        table.setViewport({
          top: bufferedTop,
          bottom: bufferedBottom,
          columns: viewport.columns,
        });
      }, UPDATE_DELAY),
    [table]
  );

  useEffect(
    function updateTableAndReturnCleanup() {
      const cleanup = table.onUpdate(
        (viewportData: ViewportData<CommandHistoryStorageItem>) => {
          onUpdate({
            items: viewportData.items ?? [],
            offset: viewportData.offset ?? 0,
          });
        }
      );

      return () => {
        log.debug('onUpdate cleanup');
        cleanup();
      };
    },
    [table, onUpdate]
  );

  useEffect(
    function setSearchText() {
      table.setSearch(search ?? '');
    },
    [table, search]
  );
  useEffect(
    function updateViewport() {
      if (!isPanelActive) {
        // Panel is backgrounded - drop the viewport so the table isn't kept
        // subscribed / re-fetching while nothing is being displayed.
        throttledUpdateViewport.cancel();
        table.setViewport(undefined);
        return;
      }
      throttledUpdateViewport({
        top,
        bottom,
        columns,
      });
    },
    [
      throttledUpdateViewport,
      table,
      top,
      bottom,
      columns,
      search,
      isReversed,
      isPanelActive,
    ]
  );
  useEffect(
    () => () => {
      log.debug2('Cancel throttledUpdateViewport');
      throttledUpdateViewport.cancel();
    },
    [throttledUpdateViewport]
  );

  return null;
}

export default CommandHistoryViewportUpdater;
