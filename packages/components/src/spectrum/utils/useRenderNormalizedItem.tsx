import { isElementOfType } from '@deephaven/react-hooks';
import { type Key, type ReactElement, useCallback } from 'react';
import ActionGroup from '../ActionGroup';
import ActionMenu from '../ActionMenu';
import { ItemContent } from '../ItemContent';
import { ListActionGroup, type ListActionGroupProps } from '../ListActionGroup';
import { ListActionMenu, type ListActionMenuProps } from '../ListActionMenu';
import { Item } from '../shared';
import {
  getItemKey,
  ITEM_EMPTY_STRING_TEXT_VALUE,
  type ItemIconSlot,
  type NormalizedItem,
  type TooltipOptions,
} from './itemUtils';
import { wrapIcon, wrapPrimitiveWithText } from './itemWrapperUtils';

export type ListActions<T> =
  | ReactElement<ListActionGroupProps<T>>
  | ReactElement<ListActionMenuProps<T>>;

export interface UseRenderNormalizedItemOptions {
  itemIconSlot: ItemIconSlot;
  showItemDescriptions: boolean;
  showItemIcons: boolean;
  tooltipOptions: TooltipOptions | null;
  actions?: ListActions<unknown>;
}

/**
 * Returns a render function that can be used to render a normalized item in
 * collection components.
 * @param itemIconSlot Slot to use for item icons
 * @param showItemDescriptions Whether to show item descriptions
 * @param showItemIcons Whether to show item icons
 * @param tooltipOptions Tooltip options to use when rendering the item
 * @param actions Optional actions to render with the item
 * @returns Render function for normalized items
 */
export function useRenderNormalizedItem({
  itemIconSlot,
  showItemDescriptions,
  showItemIcons,
  tooltipOptions,
  actions,
}: UseRenderNormalizedItemOptions): (
  normalizedItem: NormalizedItem
) => JSX.Element {
  return useCallback(
    (normalizedItem: NormalizedItem) => {
      const itemKey = getItemKey(normalizedItem);
      const content = wrapPrimitiveWithText(normalizedItem.item?.content);
      const textValue =
        normalizedItem.item?.textValue ??
        (itemKey == null ? undefined : String(itemKey));

      const description = showItemDescriptions
        ? wrapPrimitiveWithText(normalizedItem.item?.description, 'description')
        : null;

      const icon = showItemIcons
        ? wrapIcon(normalizedItem.item?.icon, itemIconSlot)
        : null;

      let action = null;

      if (isElementOfType(actions, ListActionGroup)) {
        action = (
          <ActionGroup
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...actions.props}
            onAction={key => actions.props.onAction(key, itemKey)}
            onChange={keys => actions.props.onChange?.(keys, itemKey)}
          />
        );
      } else if (isElementOfType(actions, ListActionMenu)) {
        action = (
          <ActionMenu
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...actions.props}
            onAction={key => actions.props.onAction(key, itemKey)}
            onOpenChange={isOpen =>
              actions.props.onOpenChange?.(isOpen, itemKey)
            }
          />
        );
      }

      return (
        <Item
          // Note that setting the `key` prop explicitly on `Item` elements
          // causes the picker to expect `selectedKey` and `defaultSelectedKey`
          // to be strings. It also passes the stringified value of the key to
          // `onSelectionChange` handlers` regardless of the actual type of the
          // key. We can't really get around setting in order to support Windowed
          // data, so we'll need to do some manual conversion of keys to strings
          // in other components that use this hook.
          key={itemKey as Key}
          // The `textValue` prop gets used to provide the content of `<option>`
          // elements that back the Spectrum Picker. These are not visible in the UI,
          // but are used for accessibility purposes, so we set to an arbitrary
          // `ITEM_EMPTY_STRING_TEXT_VALUE` value so that they are not empty strings.
          textValue={
            textValue === '' ? ITEM_EMPTY_STRING_TEXT_VALUE : textValue
          }
        >
          <ItemContent tooltipOptions={tooltipOptions}>
            {icon}
            {content}
            {description}
            {action}
          </ItemContent>
        </Item>
      );
    },
    [actions, itemIconSlot, showItemDescriptions, showItemIcons, tooltipOptions]
  );
}

export default useRenderNormalizedItem;
