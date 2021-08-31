class InputFilterEvent {
  /** table object for a given panel has changed */
  static TABLE_CHANGED = 'InputFilterEvent.TABLE_CHANGED';

  /** columns list for a given panel has changed */
  static COLUMNS_CHANGED = 'InputFilterEvent.COLUMNS_CHANGED';

  /** The filter values from an filter panel have changed */
  static FILTERS_CHANGED = 'InputFilterEvent.FILTERS_CHANGED';

  /** Clear all the values in currently open filter panels */
  static CLEAR_ALL_FILTERS = 'InputFilterEvent.CLEAR_ALL_FILTERS';

  /** A column was selected from an input filter panel */
  static COLUMN_SELECTED = 'InputFilterEvent.COLUMN_SELECTED';

  /** Open a Dropdown filter panel */
  static OPEN_DROPDOWN = 'InputFilterEvent.OPEN_DROPDOWN';

  /** Open an input filter panel */
  static OPEN_INPUT = 'InputFilterEvent.OPEN_INPUT';
}

export default InputFilterEvent;
