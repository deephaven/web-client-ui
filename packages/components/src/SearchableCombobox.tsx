/* eslint-disable react/jsx-props-no-spreading */
import { Key, useCallback } from 'react';
import { ComboBox, Item, SpectrumComboBoxProps } from '@adobe/react-spectrum';
import type { FocusableRef } from '@react-types/shared';
import type { ReactSpectrumComponent } from '@deephaven/react-hooks';
import TextWithTooltip from './TextWithTooltip';

export interface SearchableComboboxProps<TItem, TKey extends Key>
  extends Omit<
    SpectrumComboBoxProps<TItem>,
    'children' | 'menuTrigger' | 'onSelectionChange'
  > {
  getItemDisplayText: (item: TItem | null | undefined) => string | null;
  getKey: (item: TItem | null | undefined) => TKey | null;
  scrollRef: React.RefObject<ReactSpectrumComponent<HTMLElement>>;
  onSelectionChange: (key: TKey | null) => void;
}

export function SearchableCombobox<TItem, TKey extends Key>({
  scrollRef,
  getItemDisplayText,
  getKey,
  ...props
}: SearchableComboboxProps<TItem, TKey>): JSX.Element {
  const renderItem = useCallback(
    item => {
      const key = getKey(item);
      const displayText = getItemDisplayText(item);

      return (
        <Item key={key} textValue={displayText ?? String(key)}>
          <TextWithTooltip text={displayText} />
        </Item>
      );
    },
    [getItemDisplayText, getKey]
  );

  return (
    <ComboBox
      {...props}
      // The `ref`prop type defined by React Spectrum is incorrect here
      ref={scrollRef as unknown as FocusableRef<HTMLElement>}
      menuTrigger="focus"
      // Type assertion is necessary since <ComboBox> types don't recognize the
      // generic key arg
      onSelectionChange={props.onSelectionChange as (key: Key | null) => void}
    >
      {renderItem}
    </ComboBox>
  );
}

export default SearchableCombobox;
