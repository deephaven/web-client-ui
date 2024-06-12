import { ComboBox as SpectrumComboBox } from '@adobe/react-spectrum';
import { FocusableRef } from '@react-types/shared';
import cl from 'classnames';
import { PickerNormalizedPropsT, usePickerNormalizedProps } from '../picker';
import { ComboBoxProps } from './ComboBox';

export type ComboBoxNormalizedProps = PickerNormalizedPropsT<ComboBoxProps>;

/**
 * ComboBox that takes an array of `NormalizedItem` or `NormalizedSection` items
 * as children and uses a render item function to render the items. `NormalizedItem`
 * and `NormalizedSection` datums always provide a `key` property but have an
 * optional `item` property that can be lazy loaded. This is necessary to support
 * windowed data since we need a representative key for every item in the
 * collection.
 */
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
