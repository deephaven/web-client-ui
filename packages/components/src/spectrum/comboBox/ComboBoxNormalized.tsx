import { ComboBox as SpectrumComboBox } from '@adobe/react-spectrum';
import { FocusableRef } from '@react-types/shared';
import cl from 'classnames';
import { PickerNormalizedPropsT, usePickerNormalizedProps } from '../picker';
import { ComboBoxProps } from './ComboBox';

export type ComboBoxNormalizedProps = PickerNormalizedPropsT<ComboBoxProps>;

export function ComboBoxNormalized({
  UNSAFE_className,
  ...props
}: ComboBoxNormalizedProps): JSX.Element {
  const { forceRerenderKey, ref, ...pickerProps } =
    usePickerNormalizedProps<ComboBoxNormalizedProps>(props);

  return (
    <SpectrumComboBox
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pickerProps}
      key={forceRerenderKey}
      ref={ref as FocusableRef<HTMLElement>}
      UNSAFE_className={cl(
        'dh-combobox',
        'dh-combobox-normalized',
        UNSAFE_className
      )}
    />
  );
}

export default ComboBoxNormalized;
