import { useCallback } from 'react';
import { Table, TreeTable } from '@deephaven/jsapi-types';
import { getSize, padFirstAndLastRow } from '@deephaven/jsapi-utils';

/**
 * Creates a callback function that will set a Table viewport. The callback has
 * a closure over the Table, a desired viewport size, and additional padding.
 * These will be combined with a first row index passed to the callback to
 * calculate the final viewport.
 * @param table Table to call `setViewport` on.
 * @param viewportSize The desired viewport size.
 * @param viewportPadding Padding to add before and after the viewport.
 * @returns A callback function for setting the viewport.
 */
export default function useSetPaddedViewportCallback(
  table: Table | TreeTable | null,
  viewportSize: number,
  viewportPadding: number
) {
  return useCallback(
    function setPaddedViewport(firstRow: number) {
      const [first, last] = padFirstAndLastRow(
        firstRow,
        viewportSize,
        viewportPadding,
        getSize(table)
      );
      table?.setViewport(first, last);
    },
    [table, viewportPadding, viewportSize]
  );
}
