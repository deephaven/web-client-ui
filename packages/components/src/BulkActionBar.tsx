import { ActionBar } from '@adobe/react-spectrum';
import type { StyleProps } from '@react-types/shared';
import commonStyles from './SpectrumComponent.module.scss';

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
      {/* */}
    </ActionBar>
  );
}

export default BulkActionBar;
