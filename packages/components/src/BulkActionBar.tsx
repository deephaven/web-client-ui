import type { ItemElement, StyleProps } from '@react-types/shared';
import { ActionBar } from './spectrum';
import commonStyles from './SpectrumComponent.module.scss';

// The action bar will still show the item count + a clear selection button
// even if there are no actions. Our only consumer is currently the ACL Editor,
// but group action functionality has not yet been prioritized (see DH-15221).
// For now we'll just pass it an empty action items array.
const noActions: ItemElement<unknown>[] = [];

export interface BulkActionBarProps {
  styleProps?: StyleProps;
  selectedItemCount: 'all' | number;
  onClearSelection: () => void;
}

export function BulkActionBar({
  styleProps,
  selectedItemCount,
  onClearSelection,
}: BulkActionBarProps): JSX.Element {
  return (
    <ActionBar
      UNSAFE_className={commonStyles.spectrumActionBar}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...styleProps}
      isEmphasized
      selectedItemCount={selectedItemCount}
      onClearSelection={onClearSelection}
    >
      {noActions}
    </ActionBar>
  );
}

export default BulkActionBar;
