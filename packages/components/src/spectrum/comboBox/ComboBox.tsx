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

// `forwardRef`'s inferred prop type incorrectly drops required `children`
// because of upstream Spectrum type issues, so use `any` for the inner
// render function and re-cast the result to expose the correct
// `ComboBoxProps` to consumers.
const ComboBoxInternal = React.forwardRef(function ComboBox(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { UNSAFE_className, ...props }: any,
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
ComboBoxInternal.displayName = 'ComboBox';

export const ComboBox =
  ComboBoxInternal as unknown as React.ForwardRefExoticComponent<
    ComboBoxProps & React.RefAttributes<unknown>
  >;
