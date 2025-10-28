import { useCallback, useEffect, useRef } from 'react';
import type { dh } from '@deephaven/jsapi-types';
import {
  getSize,
  padFirstAndLastRow,
  TableUtils,
} from '@deephaven/jsapi-utils';

/**
 * Creates a callback function that will set a Table viewport. The callback has
 * a closure over the Table, a desired viewport size, and additional padding.
 * These will be combined with a first row index passed to the callback to
 * calculate the final viewport.
 * @param table The `Table` or `TreeTable` to retrieve data from.
 * @param viewportSize The desired viewport size.
 * @param viewportPadding The padding to add before and after the viewport.
 * @param viewportSubscriptionOptions The viewport subscription options to use. If provided and
 * the table is not a `TreeTable`, the data will be requested using a `TableViewportSubscription`.
 * @returns A callback function for setting the viewport.
 */
export function useSetPaddedViewportCallback(
  table: dh.Table | dh.TreeTable | null,
  viewportSize: number,
  viewportPadding: number,
  viewportSubscriptionOptions: dh.ViewportSubscriptionOptions | null = null
): (firstRow: number) => void {
  const subscriptionRef = useRef<dh.TableViewportSubscription | null>(null);

  useEffect(
    () => () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.close();
        subscriptionRef.current = null;
      }
    },
    [table, viewportSubscriptionOptions]
  );

  return useCallback(
    function setPaddedViewport(firstRow: number) {
      const [first, last] = padFirstAndLastRow(
        firstRow,
        viewportSize,
        viewportPadding,
        getSize(table)
      );

      if (
        subscriptionRef.current == null &&
        viewportSubscriptionOptions != null &&
        !TableUtils.isTreeTable(table) &&
        table != null
      ) {
        subscriptionRef.current = table.createViewportSubscription(
          viewportSubscriptionOptions
        );
      }

      if (subscriptionRef.current == null) {
        table?.setViewport(first, last);
        return;
      }

      subscriptionRef.current.update({
        rows: {
          first,
          last,
        },
        columns: table?.columns ?? [],
      });
    },
    [table, viewportPadding, viewportSize, viewportSubscriptionOptions]
  );
}

export default useSetPaddedViewportCallback;
