import React from 'react';
import {
  ComboBox as SpectrumComboBox,
  type SpectrumComboBoxProps,
} from '@adobe/react-spectrum';
import type { DOMRef } from '@react-types/shared';
import cl from 'classnames';
import { useMergeRef } from '@deephaven/react-hooks';
import type { NormalizedItem } from '../utils';
import { type PickerPropsT, usePickerProps } from '../picker';

export type ComboBoxProps = PickerPropsT<SpectrumComboBoxProps<NormalizedItem>>;
export type { MenuTriggerAction } from '@react-types/combobox';
export { SpectrumComboBox };

export const ComboBox = React.forwardRef(function ComboBox(
  { UNSAFE_className, ...props }: ComboBoxProps,
  ref: DOMRef<HTMLDivElement>
): JSX.Element {
  const {
    defaultSelectedKey,
    disabledKeys,
    selectedKey,
    ref: scrollRef,
    ...comboBoxProps
  } = usePickerProps(props);
  const pickerRef = useMergeRef(ref, scrollRef);
  return (
    <SpectrumComboBox
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...comboBoxProps}
      UNSAFE_className={cl('dh-combobox', UNSAFE_className)}
      ref={pickerRef}
      // Type assertions are necessary here since Spectrum types don't account
      // for number and boolean key values even though they are valid runtime
      // values.
      defaultSelectedKey={
        defaultSelectedKey as SpectrumComboBoxProps<NormalizedItem>['defaultSelectedKey']
      }
      disabledKeys={
        disabledKeys as SpectrumComboBoxProps<NormalizedItem>['disabledKeys']
      }
      selectedKey={
        selectedKey as SpectrumComboBoxProps<NormalizedItem>['selectedKey']
      }
    />
  );
});
ComboBox.displayName = 'ComboBox';
