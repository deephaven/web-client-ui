import { makeEventFunctions } from '@deephaven/golden-layout';
import { type dh } from '@deephaven/jsapi-types';
import { InputFilterEvent } from './events';
import { type FilterColumnSourceId } from './FilterPlugin';

export const {
  listen: listenForFilterColumnsChanged,
  emit: emitFilterColumnsChanged,
  useListener: useFilterColumnsChangedListener,
} = makeEventFunctions<
  [sourceId: FilterColumnSourceId, columns: readonly dh.Column[]]
>(InputFilterEvent.COLUMNS_CHANGED);
