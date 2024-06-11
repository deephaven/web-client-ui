import cl from 'classnames';
import {
  ComboBox as SpectrumComboBox,
  SpectrumComboBoxProps,
} from '@adobe/react-spectrum';
import { ItemKey, NormalizedItem, PickerPropsT } from '../utils';
import usePickerProps from '../picker/usePickerProps';

export type ComboBoxProps = PickerPropsT<
  SpectrumComboBoxProps<NormalizedItem>,
  ItemKey | null
>;

export function ComboBox({
  UNSAFE_className,
  ...props
}: ComboBoxProps): JSX.Element {
  const { defaultSelectedKey, selectedKey, ...comboBoxProps } =
    usePickerProps(props);

  return (
    <SpectrumComboBox
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...comboBoxProps}
      UNSAFE_className={cl('dh-combobox', UNSAFE_className)}
      defaultSelectedKey={
        defaultSelectedKey as SpectrumComboBoxProps<NormalizedItem>['defaultSelectedKey']
      }
      selectedKey={
        selectedKey as SpectrumComboBoxProps<NormalizedItem>['selectedKey']
      }
    />
  );
}
