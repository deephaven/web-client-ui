import { Picker as SpectrumPicker } from '@adobe/react-spectrum';
import cl from 'classnames';
import type { PickerNormalizedProps } from './PickerProps';

import usePickerNormalizedProps from './usePickerNormalizedProps';

/**
 * Picker that takes an array of `NormalizedItem` or `NormalizedSection` items
 * as children and uses a render item function to render the items. This is
 * necessary to support windowed data.
 */
export function PickerNormalized({
  UNSAFE_className,
  ...props
}: PickerNormalizedProps): JSX.Element {
  const { forceRerenderKey, ...pickerProps } = usePickerNormalizedProps<
    PickerNormalizedProps,
    HTMLDivElement
  >(props);

  return (
    <SpectrumPicker
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...pickerProps}
      key={forceRerenderKey}
      UNSAFE_className={cl(
        'dh-picker',
        'dh-picker-normalized',
        UNSAFE_className
      )}
    />
  );
}

export default PickerNormalized;
