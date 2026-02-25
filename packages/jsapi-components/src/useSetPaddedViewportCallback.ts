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
 * Rows and columns are filled in when the subscription is created if they are missing.
 * @returns A callback function for setting the viewport.
 */
export function useSetPaddedViewportCallback(
  table: dh.Table | dh.TreeTable | null,
  viewportSize: number,
  viewportPadding: number,
  viewportSubscriptionOptions: Partial<dh.ViewportSubscriptionOptions> | null = null
): (firstRow: number) => void {
  const subscriptionRef = useRef<dh.TableViewportSubscription | null>(null);
  const prevTableRef = useRef<dh.Table | dh.TreeTable | null>(null);
  const prevViewportOptionsRef =
    useRef<Partial<dh.ViewportSubscriptionOptions> | null>(null);

  const cleanupSubscription = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.close();
      subscriptionRef.current = null;
    }
  };

  if (
    prevTableRef.current !== table ||
    prevViewportOptionsRef.current !== viewportSubscriptionOptions
  ) {
    prevTableRef.current = table;
    prevViewportOptionsRef.current = viewportSubscriptionOptions;
    cleanupSubscription();
  }

  useEffect(() => cleanupSubscription, []);

  return useCallback(
    function setPaddedViewport(firstRow: number) {
      if (table == null) {
        return;
      }

      const [first, last] = padFirstAndLastRow(
        firstRow,
        viewportSize,
        viewportPadding,
        getSize(table)
      );

      if (
        subscriptionRef.current == null &&
        viewportSubscriptionOptions != null &&
        !TableUtils.isTreeTable(table)
      ) {
        const subscriptionOptions: dh.ViewportSubscriptionOptions = {
          ...viewportSubscriptionOptions,
          rows: viewportSubscriptionOptions.rows ?? { first, last },
          columns: viewportSubscriptionOptions.columns ?? table.columns,
        };

        subscriptionRef.current =
          table.createViewportSubscription(subscriptionOptions);
      }

      if (subscriptionRef.current == null) {
        table.setViewport(first, last);
        return;
      }

      subscriptionRef.current.update({
        rows: {
          first,
          last,
        },
        columns: table.columns,
      });
    },
    [table, viewportPadding, viewportSize, viewportSubscriptionOptions]
  );
}

export default useSetPaddedViewportCallback;
