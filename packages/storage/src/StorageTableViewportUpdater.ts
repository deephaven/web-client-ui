import { useEffect, useMemo } from 'react';
import Log from '@deephaven/log';
import throttle from 'lodash.throttle';
import {
  FilterConfig,
  SortConfig,
  StorageItem,
  StorageTable,
  StorageTableViewport,
  ViewportData,
  ViewportUpdateCallback,
} from './Storage';

export type StorageTableViewportUpdaterProps = {
  table: StorageTable<StorageItem>;
  columns?: string[];
  top?: number;
  bottom?: number;
  filters?: FilterConfig[];
  sorts?: SortConfig[];
  isReversed?: boolean;
  onUpdate: ViewportUpdateCallback<StorageItem>;
};

const UPDATE_DELAY = 150;

const ROW_BUFFER_PAGES = 3;

const log = Log.module('StorageTableViewportUpdater');

export function StorageTableViewportUpdater({
  table,
  columns,
  top = 0,
  bottom = 0,
  filters,
  sorts,
  isReversed = false,
  onUpdate,
}: StorageTableViewportUpdaterProps): null {
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
    function updateViewportAndReturnClaenup() {
      const cleanup = table.onUpdate(
        (viewportData: ViewportData<StorageItem>) => {
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
    function updateFilters() {
      table.setFilters(filters ?? null);
    },
    [table, filters]
  );

  useEffect(
    function updateSorts() {
      table.setSorts(sorts ?? null);
    },
    [table, sorts]
  );

  useEffect(
    function updateViewport() {
      throttledUpdateViewport({
        top,
        bottom,
        columns,
      });
    },
    [throttledUpdateViewport, top, bottom, columns, filters, sorts, isReversed]
  );

  useEffect(
    function cleanupUpdateViewport() {
      return () => {
        log.debug2('Cancel throttledUpdateViewport');
        throttledUpdateViewport.cancel();
      };
    },
    [throttledUpdateViewport]
  );

  return null;
}

export default StorageTableViewportUpdater;
