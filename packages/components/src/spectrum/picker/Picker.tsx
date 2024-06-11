import { Picker as SpectrumPicker } from '@adobe/react-spectrum';
import cl from 'classnames';
import {
  NormalizedSpectrumPickerProps,
  PickerPropsT,
} from '../utils/itemUtils';
import { usePickerProps } from './usePickerProps';

export type PickerProps = PickerPropsT<NormalizedSpectrumPickerProps>;

/**
 * Picker component for selecting items from a list of items. Items can be
 * provided via the `children` prop. Each item can be a string,	number, boolean,
 * or a Spectrum <Item> element. The remaining props are just	pass through props
 * for the Spectrum Picker component.
 * See https://react-spectrum.adobe.com/react-spectrum/Picker.html
 */
export function Picker({
  UNSAFE_className,
  ...props
}: PickerProps): JSX.Element {
  const { defaultSelectedKey, selectedKey, ...pickerProps } =
    usePickerProps(props);

  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pickerProps}
      UNSAFE_className={cl('dh-picker', UNSAFE_className)}
      defaultSelectedKey={
        defaultSelectedKey as NormalizedSpectrumPickerProps['defaultSelectedKey']
      }
      selectedKey={selectedKey as NormalizedSpectrumPickerProps['selectedKey']}
    />
  );
}

export default Picker;
