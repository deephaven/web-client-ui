import { useCallback, useEffect, useRef } from 'react';
import type { dh } from '@deephaven/jsapi-types';
import {
  getSize,
  padFirstAndLastRow,
  TableUtils,
  type OnTableUpdatedEvent,
} from '@deephaven/jsapi-utils';
import { useApi } from '@deephaven/jsapi-bootstrap';
import useTableListener from './useTableListener';

// Stable no-op used as the useTableListener callback when onTableUpdated is null
const noopUpdatedHandler = (_event: OnTableUpdatedEvent): void => undefined;

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
 * @param onUpdated Optional handler for TABLE_UPDATED events. When provided, it is
 * registered on the table or directly on the subscription
 * @returns A callback function for setting the viewport.
 */
export function useSetPaddedViewportCallback(
  table: dh.Table | dh.TreeTable | null,
  viewportSize: number,
  viewportPadding: number,
  viewportSubscriptionOptions: Partial<dh.ViewportSubscriptionOptions> | null = null,
  onUpdated: (event: OnTableUpdatedEvent) => void = noopUpdatedHandler
): (firstRow: number) => void {
  const dh = useApi();
  const subscriptionRef = useRef<dh.TableViewportSubscription | null>(null);
  const removeSubscriptionListenerRef = useRef<(() => void) | null>(null);
  const prevTableRef = useRef<dh.Table | dh.TreeTable | null>(null);
  const prevViewportOptionsRef =
    useRef<Partial<dh.ViewportSubscriptionOptions> | null>(null);

  const cleanupSubscription = () => {
    removeSubscriptionListenerRef.current?.();
    removeSubscriptionListenerRef.current = null;
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

  // Only use a subscription when options are provided AND the table is not a
  // TreeTable (which does not support createViewportSubscription).
  const needsSubscription =
    viewportSubscriptionOptions != null &&
    table != null &&
    !TableUtils.isTreeTable(table);

  // For the setViewport path (including TreeTable + options), register
  // TABLE_UPDATED on the table directly.
  // For the subscription path the listener is registered on the subscription
  // inside setPaddedViewport when it is first created.
  useTableListener(
    needsSubscription ? null : table,
    dh.Table.EVENT_UPDATED,
    onUpdated
  );

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

      if (subscriptionRef.current == null && needsSubscription) {
        const subscriptionOptions: dh.ViewportSubscriptionOptions = {
          ...viewportSubscriptionOptions,
          rows: viewportSubscriptionOptions.rows ?? { first, last },
          columns: viewportSubscriptionOptions.columns ?? table.columns,
        };

        subscriptionRef.current =
          table.createViewportSubscription(subscriptionOptions);

        // TABLE_UPDATED fires on the subscription rather than
        // the table. Register the listener directly on the subscription.
        removeSubscriptionListenerRef.current =
          subscriptionRef.current.addEventListener(
            dh.Table.EVENT_UPDATED,
            onUpdated
          );
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
    [
      table,
      viewportPadding,
      viewportSize,
      viewportSubscriptionOptions,
      needsSubscription,
      onUpdated,
      dh.Table.EVENT_UPDATED,
    ]
  );
}

export default useSetPaddedViewportCallback;
