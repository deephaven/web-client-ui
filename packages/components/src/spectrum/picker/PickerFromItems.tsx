import { forwardRef, useCallback } from 'react';
import type { DOMRef, DOMRefValue } from '@react-types/shared';
import { Picker as SpectrumPicker } from '@adobe/react-spectrum';
import cl from 'classnames';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import {
  isNormalizedSection,
  NormalizedSpectrumPickerProps,
  NormalizedItem,
  TooltipOptions,
  ItemKey,
  getItemKey,
  NormalizedSection,
} from '../utils/itemUtils';
import { Section } from '../shared';
import { useRenderNormalizedItem } from '../utils';
import { PickerCommonProps } from './PickerModel';
import usePickerScrollOnOpen from './usePickerScrollOnOpen';

export interface PickerFromItemsProps extends PickerCommonProps {
  items: (NormalizedItem | NormalizedSection)[];
  tooltipOptions: TooltipOptions | null;
  getInitialScrollPosition: () => Promise<number | null | undefined>;
}

export const PickerFromItems = forwardRef<
  DOMRefValue<HTMLElement>,
  PickerFromItemsProps
>(
  (
    {
      items,
      tooltipOptions,
      defaultSelectedKey,
      selectedKey,
      getInitialScrollPosition,
      onChange,
      onOpenChange,
      onScroll = EMPTY_FUNCTION,
      onSelectionChange,
      // eslint-disable-next-line camelcase
      UNSAFE_className,
      ...spectrumPickerProps
    }: PickerFromItemsProps,
    forwardedRef
  ): JSX.Element => {
    const renderNormalizedItem = useRenderNormalizedItem(tooltipOptions);

    const onSelectionChangeInternal = useCallback(
      (key: ItemKey): void => {
        // The `key` arg will always be a string due to us setting the `Item` key
        // prop in `renderItem`. We need to find the matching item to determine
        // the actual key.
        const selectedItem = items.find(
          item => String(getItemKey(item)) === key
        );

        const actualKey = getItemKey(selectedItem) ?? key;

        (onChange ?? onSelectionChange)?.(actualKey);
      },
      [items, onChange, onSelectionChange]
    );

    const { ref: scrollRef, onOpenChange: onOpenChangeInternal } =
      usePickerScrollOnOpen({
        getInitialScrollPosition,
        onScroll,
        onOpenChange,
      });

    return (
      <SpectrumPicker
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...spectrumPickerProps}
        ref={scrollRef as DOMRef<HTMLDivElement>}
        UNSAFE_className={cl('dh-picker', UNSAFE_className)}
        items={items}
        // Spectrum Picker treats keys as strings if the `key` prop is explicitly
        // set on `Item` elements. Since we do this in `renderItem`, we need to
        // ensure that `selectedKey` and `defaultSelectedKey` are strings in order
        // for selection to work.
        selectedKey={selectedKey == null ? selectedKey : selectedKey.toString()}
        defaultSelectedKey={
          defaultSelectedKey == null
            ? defaultSelectedKey
            : defaultSelectedKey.toString()
        }
        // `onChange` is just an alias for `onSelectionChange`
        onSelectionChange={
          onSelectionChangeInternal as NormalizedSpectrumPickerProps['onSelectionChange']
        }
        onOpenChange={onOpenChangeInternal}
      >
        {itemOrSection => {
          if (isNormalizedSection(itemOrSection)) {
            return (
              <Section
                key={getItemKey(itemOrSection)}
                title={itemOrSection.item?.title}
                items={itemOrSection.item?.items}
              >
                {renderNormalizedItem}
              </Section>
            );
          }

          return renderNormalizedItem(itemOrSection);
        }}
      </SpectrumPicker>
    );
  }
);

PickerFromItems.displayName = 'PickerFromItems';

export default PickerFromItems;
