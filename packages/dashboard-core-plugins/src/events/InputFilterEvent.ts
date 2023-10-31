import { getEmitListenerPair } from '@deephaven/golden-layout';

export const InputFilterEvent = Object.freeze({
  /** table object for a given panel has changed */
  TABLE_CHANGED: 'InputFilterEvent.TABLE_CHANGED',

  /** columns list for a given panel has changed */
  COLUMNS_CHANGED: 'InputFilterEvent.COLUMNS_CHANGED',

  /** The filter values from an filter panel have changed */
  FILTERS_CHANGED: 'InputFilterEvent.FILTERS_CHANGED',

  /** Clear all the values in currently open filter panels */
  CLEAR_ALL_FILTERS: 'InputFilterEvent.CLEAR_ALL_FILTERS',

  /** A column was selected from an input filter panel */
  COLUMN_SELECTED: 'InputFilterEvent.COLUMN_SELECTED',

  /** Open a Dropdown filter panel */
  OPEN_DROPDOWN: 'InputFilterEvent.OPEN_DROPDOWN',

  /** Open an input filter panel */
  OPEN_INPUT: 'InputFilterEvent.OPEN_INPUT',

  /** Open a filter set manager panel */
  OPEN_FILTER_SET_MANAGER: 'InputFilterEvent.OPEN_FILTER_SET_MANAGER',
});

export const { emit: emitClearAllFilters, on: onClearAllFilters } =
  getEmitListenerPair(InputFilterEvent.CLEAR_ALL_FILTERS);

export default InputFilterEvent;
