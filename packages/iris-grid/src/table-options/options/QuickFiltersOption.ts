import { vsFilter } from '@deephaven/icons';
import type { TableOption } from '../TableOption';
import SHORTCUTS from '../../IrisGridShortcuts';

/**
 * Quick Filters toggle option.
 * Shows/hides the quick filter bar.
 */
export const QuickFiltersOption: TableOption = {
  type: 'quick-filters',

  menuItem: {
    title: 'Quick Filters',
    subtitle: SHORTCUTS.TABLE.TOGGLE_QUICK_FILTER.getDisplayText(),
    icon: vsFilter,
    // Always available
    isAvailable: () => true,
  },

  toggle: {
    getValue: gridState => gridState.isFilterBarShown ?? false,
    actionType: 'TOGGLE_FILTER_BAR',
    shortcut: SHORTCUTS.TABLE.TOGGLE_QUICK_FILTER,
  },
};

export default QuickFiltersOption;
