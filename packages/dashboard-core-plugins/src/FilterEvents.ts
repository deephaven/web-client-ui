import { makeEventFunctions } from '@deephaven/golden-layout';
import { type dh } from '@deephaven/jsapi-types';
import type { PanelId } from '@deephaven/dashboard';
import { InputFilterEvent } from './events';
import type { WidgetId } from './panels';

export type FilterColumnSourceId = PanelId | WidgetId;

export type FilterColumn = {
  name: string;
  type: string;
};

export type FilterChangeEvent = FilterColumn & {
  value: string;
  timestamp: number;
  excludePanelIds?: string[];
};

const filterColumnsChangedFns = makeEventFunctions<
  [
    sourceId: FilterColumnSourceId,
    columns: readonly { name: string; type: string }[] | null,
  ]
>(InputFilterEvent.COLUMNS_CHANGED);

/**
 * Listen for filter column changes
 * @param eventEmitter The event emitter to emit the event on
 * @param sourceId The source ID for the columns
 * @param columns The columns available for filtering or null to remove the filter for the sourceId
 */
export const listenForFilterColumnsChanged = filterColumnsChangedFns.listen;

/**
 * Emit a filter columns changed event
 * @param eventEmitter The event emitter to emit the event on
 * @param sourceId The source ID for the columns
 * @param columns The columns available for filtering or null to remove the filter for the sourceId
 */
export const emitFilterColumnsChanged = filterColumnsChangedFns.emit;

/**
 * Use a filter columns change event listener
 * @param eventEmitter The event emitter to emit the event on
 * @param sourceId The source ID for the columns
 * @param columns The columns available for filtering or null to remove the filter for the sourceId
 */
export const useFilterColumnsChangedListener =
  filterColumnsChangedFns.useListener;

const filterTableChangedFns = makeEventFunctions<
  [sourceId: FilterColumnSourceId, table: dh.Table | null]
>(InputFilterEvent.TABLE_CHANGED);

/**
 * Listen for filter table changes
 * @param eventEmitter The event emitter to emit the event on
 * @param sourceId The source ID for the table
 * @param table The table available for filtering or null to remove the table for the sourceId
 */
export const listenForFilterTableChanged = filterTableChangedFns.listen;

/**
 * Emit a filter table changed event
 * @param eventEmitter The event emitter to emit the event on
 * @param sourceId The source ID for the table
 * @param table The table available for filtering or null to remove the table for the sourceId
 */
export const emitFilterTableChanged = filterTableChangedFns.emit;

/**
 * Use a filter table change event listener
 * @param eventEmitter The event emitter to emit the event on
 * @param sourceId The source ID for the table
 * @param table The table available for filtering or null to remove the table for the sourceId
 */
export const useFilterTableChangedListener = filterTableChangedFns.useListener;

const filterChangedFns = makeEventFunctions<
  [
    sourceId: FilterColumnSourceId,
    filterChange: FilterChangeEvent | FilterChangeEvent[] | null,
  ]
>(InputFilterEvent.FILTERS_CHANGED);

/**
 * Listen for filter changes
 * @param eventEmitter The event emitter to emit the event on
 * @param sourceId The source ID for the filter
 * @param filterChange The filter change event or null to remove the filter for the sourceId
 */
export const listenForFilterChanged = filterChangedFns.listen;

/**
 * Emit a filter change event
 * @param eventEmitter The event emitter to emit the event on
 * @param sourceId The source ID for the filter
 * @param filterChange The filter change event or null to remove the filter for the sourceId
 */
export const emitFilterChanged = filterChangedFns.emit;

/**
 * Use a filter change event listener
 * @param eventEmitter The event emitter to emit the event on
 * @param sourceId The source ID for the filter
 * @param filterChange The filter change event or null to remove the filter for the sourceId
 */
export const useFilterChangedListener = filterChangedFns.useListener; // A panel or widget can have columns for filters
