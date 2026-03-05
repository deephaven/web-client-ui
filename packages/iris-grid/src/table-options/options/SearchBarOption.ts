import { vsSearch } from '@deephaven/icons';
import type { TableOption } from '../TableOption';
import SHORTCUTS from '../../IrisGridShortcuts';

/**
 * Search Bar toggle option.
 * Shows/hides the cross-column search bar.
 */
export const SearchBarOption: TableOption = {
  type: 'search-bar',

  menuItem: {
    title: 'Search Bar',
    subtitle: SHORTCUTS.TABLE.TOGGLE_SEARCH.getDisplayText(),
    icon: vsSearch,
    // Only available when canToggleSearch is true
    isAvailable: gridState => gridState.canToggleSearch ?? true,
  },

  toggle: {
    getValue: gridState => gridState.showSearchBar ?? false,
    actionType: 'TOGGLE_SEARCH_BAR',
    shortcut: SHORTCUTS.TABLE.TOGGLE_SEARCH,
  },
};

export default SearchBarOption;
