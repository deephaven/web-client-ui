import { MultiSelectNormalized } from '@deephaven/components';
import { useCallback, useRef } from 'react';
import { type MultiPickerWithTableProps } from './MultiPickerProps';
import { useMultiPickerProps } from './utils';

export type MultiSelectProps = MultiPickerWithTableProps;

export function MultiSelect(props: MultiSelectProps): JSX.Element {
  const {
    onInputChange: onInputChangeInternal,
    onOpenChange: onOpenChangeOriginal,
    onSearchTextChange,
    ...restPickerProps
  } = useMultiPickerProps(props);

  const isOpenRef = useRef(false);
  const inputValueRef = useRef('');

  const onInputChange = useCallback(
    (value: string) => {
      onInputChangeInternal?.(value);

      // Only apply search text if MultiSelect is open.
      if (isOpenRef.current) {
        onSearchTextChange(value);
      }
      // When closed, clear the search text and store the value so we can
      // re-apply it in `onOpenChange` if opened by user input.
      else {
        onSearchTextChange('');
        inputValueRef.current = value;
      }
    },
    [onInputChangeInternal, onSearchTextChange]
  );

  const onOpenChange = useCallback(
    (isOpen: boolean) => {
      onOpenChangeOriginal?.(isOpen);

      // Reset the search text when closed.
      if (!isOpen) {
        onSearchTextChange('');
      }
      // Restore search text when opened by user input.
      else if (inputValueRef.current !== '') {
        onSearchTextChange(inputValueRef.current);
      }

      isOpenRef.current = isOpen;
    },
    [onSearchTextChange, onOpenChangeOriginal]
  );

  return (
    <MultiSelectNormalized
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...restPickerProps}
      onInputChange={onInputChange}
      onOpenChange={onOpenChange}
      onSearchTextChange={onSearchTextChange}
    />
  );
}

export default MultiSelect;
