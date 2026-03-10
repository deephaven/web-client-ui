import { vsReply } from '@deephaven/icons';
import type { TableOption } from '../TableOption';
import SHORTCUTS from '../../IrisGridShortcuts';

/**
 * Go To Row toggle option.
 * Shows/hides the Go To row panel.
 */
export const GotoRowOption: TableOption = {
  type: 'goto-row',

  menuItem: {
    title: 'Go to',
    subtitle: SHORTCUTS.TABLE.GOTO_ROW.getDisplayText(),
    icon: vsReply,
    // Always available
    isAvailable: () => true,
  },

  toggle: {
    getValue: gridState => gridState.isGotoShown ?? false,
    actionType: 'TOGGLE_GOTO',
    shortcut: SHORTCUTS.TABLE.GOTO_ROW,
  },
};

export default GotoRowOption;
