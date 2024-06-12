import { Picker as SpectrumPicker } from '@adobe/react-spectrum';
import type { DOMRef } from '@react-types/shared';
import cl from 'classnames';
import { NormalizedSpectrumPickerProps } from '../utils/itemUtils';
import type { PickerProps } from './PickerProps';
import { usePickerProps } from './usePickerProps';

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
  const { defaultSelectedKey, selectedKey, scrollRef, ...pickerProps } =
    usePickerProps(props);

  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pickerProps}
      ref={scrollRef as DOMRef<HTMLDivElement>}
      UNSAFE_className={cl('dh-picker', UNSAFE_className)}
      // Type assertions are necessary here since Spectrum types don't account
      // for number and boolean key values even though they are valid runtime
      // values.
      defaultSelectedKey={
        defaultSelectedKey as NormalizedSpectrumPickerProps['defaultSelectedKey']
      }
      selectedKey={selectedKey as NormalizedSpectrumPickerProps['selectedKey']}
    />
  );
}

export default Picker;
