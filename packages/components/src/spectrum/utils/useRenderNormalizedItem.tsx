import { Key, useCallback } from 'react';
import { ItemContent } from '../ItemContent';
import { Item } from '../shared';
import { getItemKey, NormalizedItem, TooltipOptions } from './itemUtils';

export function useRenderNormalizedItem(
  tooltipOptions: TooltipOptions | null
): (normalizedItem: NormalizedItem) => JSX.Element {
  return useCallback(
    (normalizedItem: NormalizedItem) => {
      const key = getItemKey(normalizedItem);
      const content = normalizedItem.item?.content ?? '';
      const textValue = normalizedItem.item?.textValue ?? '';

      return (
        <Item
          // Note that setting the `key` prop explicitly on `Item` elements
          // causes the picker to expect `selectedKey` and `defaultSelectedKey`
          // to be strings. It also passes the stringified value of the key to
          // `onSelectionChange` handlers` regardless of the actual type of the
          // key. We can't really get around setting in order to support Windowed
          // data, so we'll need to do some manual conversion of keys to strings
          // in other places of this component.
          key={key as Key}
          // The `textValue` prop gets used to provide the content of `<option>`
          // elements that back the Spectrum Picker. These are not visible in the UI,
          // but are used for accessibility purposes, so we set to an arbitrary
          // 'Empty' value so that they are not empty strings.
          textValue={textValue === '' ? 'Empty' : textValue}
        >
          <ItemContent tooltipOptions={tooltipOptions}>{content}</ItemContent>
        </Item>
      );
    },
    [tooltipOptions]
  );
}

export default useRenderNormalizedItem;
