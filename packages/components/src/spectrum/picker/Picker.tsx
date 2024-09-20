import {
  Picker as SpectrumPicker,
  type SpectrumPickerProps,
} from '@adobe/react-spectrum';
import type { DOMRef } from '@react-types/shared';
import cl from 'classnames';
import React from 'react';
import { useMergeRef } from '@deephaven/react-hooks';
import type { NormalizedItem } from '../utils';
import type { PickerProps } from './PickerProps';
import { usePickerProps } from './usePickerProps';

/**
 * Picker component for selecting items from a list of items. Items can be
 * provided via the `children` prop. Each item can be a string,	number, boolean,
 * or a Spectrum <Item> element. The remaining props are just	pass through props
 * for the Spectrum Picker component.
 * See https://react-spectrum.adobe.com/react-spectrum/Picker.html
 */
export const Picker = React.forwardRef(function Picker(
  { UNSAFE_className, ...props }: PickerProps,
  ref: DOMRef<HTMLDivElement>
): JSX.Element {
  const {
    defaultSelectedKey,
    disabledKeys,
    selectedKey,
    ref: scrollRef,
    ...pickerProps
  } = usePickerProps(props);
  const pickerRef = useMergeRef(ref, scrollRef);
  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pickerProps}
      ref={pickerRef}
      UNSAFE_className={cl('dh-picker', UNSAFE_className)}
      // Type assertions are necessary here since Spectrum types don't account
      // for number and boolean key values even though they are valid runtime
      // values.
      defaultSelectedKey={
        defaultSelectedKey as SpectrumPickerProps<NormalizedItem>['defaultSelectedKey']
      }
      disabledKeys={
        disabledKeys as SpectrumPickerProps<NormalizedItem>['disabledKeys']
      }
      selectedKey={
        selectedKey as SpectrumPickerProps<NormalizedItem>['selectedKey']
      }
    />
  );
});
Picker.displayName = 'Picker';

export default Picker;
