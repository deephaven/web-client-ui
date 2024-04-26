import { ActionGroupProps } from '../ActionGroup';
import { ItemKey, ItemSelection } from '../utils';

export interface ListActionGroupProps<T>
  extends Omit<ActionGroupProps<T>, 'onAction' | 'onChange'> {
  /**
   * Handler that is called when an item is pressed.
   */
  onAction: (actionKey: ItemKey, listItemKey: ItemKey) => void;

  /**
   * Handler that is called when the selection change.
   */
  onChange?: (selection: ItemSelection, listItemKey: ItemKey) => void;
}

/**
 * This component doesn't actually render anything. It is a prop container that
 * gets passed to `NormalizedListView`. The actual `ActionGroup` elements will
 * be created from this component's props on each item in the list view.
 */
export function ListActionGroup<T>(_props: ListActionGroupProps<T>): null {
  return null;
}
