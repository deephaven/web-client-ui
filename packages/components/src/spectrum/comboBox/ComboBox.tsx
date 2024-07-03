import React from 'react';
import {
  ComboBox as SpectrumComboBox,
  SpectrumComboBoxProps,
} from '@adobe/react-spectrum';
import type { FocusableRef } from '@react-types/shared';
import cl from 'classnames';
import type { NormalizedItem } from '../utils';
import { PickerPropsT, usePickerProps } from '../picker';

export type ComboBoxProps = PickerPropsT<SpectrumComboBoxProps<NormalizedItem>>;

export const ComboBox = React.forwardRef(function ComboBox(
  { UNSAFE_className, ...props }: ComboBoxProps,
  ref: FocusableRef<HTMLElement>
): JSX.Element {
  const { defaultSelectedKey, disabledKeys, selectedKey, ...comboBoxProps } =
    usePickerProps(props);

  return (
    <SpectrumComboBox
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...comboBoxProps}
      UNSAFE_className={cl('dh-combobox', UNSAFE_className)}
      ref={ref}
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
