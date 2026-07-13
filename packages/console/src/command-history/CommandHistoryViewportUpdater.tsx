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
  onUpdate: ViewportUpdateCallback<CommandHistoryStorageItem>;
};

const UPDATE_DELAY = 150;

const ROW_BUFFER_PAGES = 3;

const log = Log.module('CommandHistoryViewportUpdater');

function getChdbgSeq(): number {
  const root = globalThis as typeof globalThis & { __chdbgSeq?: number };
  root.__chdbgSeq = (root.__chdbgSeq ?? 0) + 1;
  return root.__chdbgSeq;
}

function CommandHistoryViewportUpdater({
  table,
  columns,
  top = 0,
  bottom = 0,
  search,
  isReversed = false,
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

        console.log('[CHDBG][S5]', {
          seq: getChdbgSeq(),
          t: performance.now(),
          cb: 'CHVU.throttle.fire',
          inTop: viewport.top,
          inBottom: viewport.bottom,
          bufferedTop,
          bufferedBottom,
          columns: viewport.columns,
          tableType: (table as unknown as { constructor?: { name?: string } })
            .constructor?.name,
        });

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
          console.log('[CHDBG][S6]', {
            seq: getChdbgSeq(),
            t: performance.now(),
            cb: 'CHVU.onUpdate.fromTable',
            offset: viewportData.offset,
            itemsLength: viewportData.items?.length ?? null,
            firstId: viewportData.items?.[0]?.id ?? null,
            tableSize: table.size,
          });
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
      throttledUpdateViewport({
        top,
        bottom,
        columns,
      });
    },
    [throttledUpdateViewport, top, bottom, columns, search, isReversed]
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
