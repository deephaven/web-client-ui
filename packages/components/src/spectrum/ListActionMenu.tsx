import { type ActionMenuProps } from './ActionMenu';
import { type ItemKey } from './utils';

export interface ListActionMenuProps<T>
  extends Omit<ActionMenuProps<T>, 'onAction' | 'onOpenChange'> {
  /**
   * Handler that is called when an item is pressed.
   */
  onAction: (actionKey: ItemKey, listItemKey: ItemKey) => void;

  /**
   * Handler that is called when the the menu is opened or closed.
   */
  onOpenChange?: (isOpen: boolean, listItemKey: ItemKey) => void;
}

/**
 * This component doesn't actually render anything. It is a prop container that
 * gets passed to `NormalizedListView`. The actual `ActionMenu` elements will
 * be created from this component's props on each item in the list view.
 */
export function ListActionMenu<T>(_props: ListActionMenuProps<T>): null {
  return null;
}
