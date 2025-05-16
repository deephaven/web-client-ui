import { makeEventFunctions } from '@deephaven/golden-layout';
import { type dh } from '@deephaven/jsapi-types';
import { InputFilterEvent } from './events';
import {
  type FilterChangeEvent,
  type FilterColumnSourceId,
} from './FilterPlugin';

export const {
  listen: listenForFilterColumnsChanged,
  emit: emitFilterColumnsChanged,
  useListener: useFilterColumnsChangedListener,
} = makeEventFunctions<
  [
    sourceId: FilterColumnSourceId,
    columns: readonly { name: string; type: string }[] | null,
  ]
>(InputFilterEvent.COLUMNS_CHANGED);

export const {
  listen: listenForFilterTableChanged,
  emit: emitFilterTableChanged,
  useListener: useFilterTableChangedListener,
} = makeEventFunctions<
  [sourceId: FilterColumnSourceId, table: dh.Table | null]
>(InputFilterEvent.TABLE_CHANGED);

export const {
  listen: listenForFilterChanged,
  emit: emitFilterChanged,
  useListener: useFilterChangedListener,
} = makeEventFunctions<
  [
    sourceId: FilterColumnSourceId,
    filterChange: FilterChangeEvent | FilterChangeEvent[] | null,
  ]
>(InputFilterEvent.FILTERS_CHANGED);
