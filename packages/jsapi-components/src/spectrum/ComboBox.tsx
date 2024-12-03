import {
  ComboBoxNormalized,
  type MenuTriggerAction,
  type NormalizedItem,
  type SpectrumComboBoxProps,
} from '@deephaven/components';
import { useCallback, useRef } from 'react';
import { type PickerWithTableProps } from './PickerProps';
import { usePickerProps } from './utils';

export type ComboBoxProps = PickerWithTableProps<
  SpectrumComboBoxProps<NormalizedItem>
>;

export function ComboBox(props: ComboBoxProps): JSX.Element {
  const {
    onInputChange: onInputChangeInternal,
    onSearchTextChange,
    ...pickerProps
  } = usePickerProps<ComboBoxProps>(props);

  const menuTriggerActionRef = useRef<MenuTriggerAction>();

  const onInputChange = useCallback(
    (value: string) => {
      onInputChangeInternal?.(value);

      onSearchTextChange(value);

      // const searchText = menuTriggerActionRef.current === 'input' ? value : '';

      console.log('[TESTING]', menuTriggerActionRef.current, value);

      // We want the ComboBox to show all items whenever it is initially opened,
      // so keep search text set to empty string while it is closed. This is
      // mostly to handle the intial state, since `onInputChange` gets called
      // before the user has interacted.
      // onSearchTextChange(isOpenRef.current ? value : '');
    },
    [onInputChangeInternal, onSearchTextChange]
  );

  const onOpenChange = useCallback(
    (isOpen: boolean, menuTrigger?: MenuTriggerAction) => {
      console.log('[TESTING] onOpenChange', isOpen, menuTrigger);
      menuTriggerActionRef.current = isOpen ? menuTrigger : undefined;

      pickerProps.onOpenChange?.(isOpen);

      // Clear filtering on close so that all items show on next open
      if (!isOpen) {
        onSearchTextChange('');
      }
    },
    [onSearchTextChange, pickerProps]
  );

  return (
    <ComboBoxNormalized
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pickerProps}
      onInputChange={onInputChange}
      onOpenChange={onOpenChange}
    />
  );
}

export default ComboBox;
