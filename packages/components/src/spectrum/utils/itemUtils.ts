import { Key, ReactElement, ReactNode } from 'react';
import { SpectrumPickerProps } from '@adobe/react-spectrum';
import type { ItemRenderer } from '@react-types/shared';
import { isElementOfType } from '@deephaven/react-hooks';
import { KeyedItem, SelectionT } from '@deephaven/utils';
import {
  Item,
  ItemElementOrPrimitive,
  ItemProps,
  Section,
  SectionProps,
} from '../shared';
import { PopperOptions } from '../../popper';
import { Text } from '../Text';
import ItemContent from '../ItemContent';

/**
 * `Item.textValue` prop needs to be a non-empty string for accessibility
 * purposes. This is not displayed in the UI.
 */
export const ITEM_EMPTY_STRING_TEXT_VALUE = 'Empty';

/**
 * React Spectrum <Section> supports an `ItemRenderer` function as a child. The
 * DH picker makes use of this internally, but we don't want to support it as
 * an incoming prop.
 */
type SectionPropsNoItemRenderer<T> = Omit<SectionProps<T>, 'children'> & {
  children:
    | Exclude<SectionProps<T>['children'], ItemRenderer<T>>
    | ItemElementOrPrimitive<T>
    | ItemElementOrPrimitive<T>[];
};

export type ItemElement<T = unknown> = ReactElement<ItemProps<T>>;
export type SectionElement<T = unknown> = ReactElement<
  SectionPropsNoItemRenderer<T>
>;

export type ItemOrSection<T = unknown> =
  | ItemElementOrPrimitive<T>
  | SectionElement<T>;

// Picker uses `icon` slot. ListView can use `image` or `illustration` slots.
// https://github.com/adobe/react-spectrum/blob/main/packages/%40react-spectrum/picker/src/Picker.tsx#L194
// https://github.com/adobe/react-spectrum/blob/main/packages/%40react-spectrum/list/src/ListViewItem.tsx#L266-L267
export type ItemIconSlot = 'icon' | 'image' | 'illustration';

/**
 * Augment the Spectrum selection key type to include boolean values.
 * Spectrum collection components already supports this, but the built in types
 * don't reflect it.
 */
export type ItemKey = Key | boolean;

export type ItemSelection = SelectionT<ItemKey>;

/**
 * Augment the Spectrum selection change handler type to include boolean keys.
 * Spectrum components already supports this, but the built in types don't
 * reflect it.
 */
export type ItemSelectionChangeHandler = (key: ItemKey) => void;

export interface NormalizedItemData {
  key?: ItemKey;
  content: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  textValue: string | undefined;
}

export interface NormalizedSectionData {
  key?: Key;
  title?: ReactNode;
  items: NormalizedItem[];
}

/**
 * Spectrum collection components support a variety of item types, including
 * strings, numbers, booleans, and more complex React elements. This type
 * represents a normalized form to make rendering items simpler and keep the
 * logic of transformation in separate util methods. It also adheres to the
 * `KeyedItem` interface to be compatible with Windowed data utils
 * (e.g. `useViewportData`).
 */
export type NormalizedItem = KeyedItem<NormalizedItemData, ItemKey | undefined>;

export type NormalizedSection = KeyedItem<
  NormalizedSectionData,
  Key | undefined
>;

export type NormalizedItemOrSection<TItemOrSection extends ItemOrSection> =
  TItemOrSection extends SectionElement ? NormalizedSection : NormalizedItem;

export type NormalizedSpectrumPickerProps = SpectrumPickerProps<NormalizedItem>;

export type TooltipOptions = { placement: PopperOptions['placement'] };

/**
 * DH wrappers of Spectrum collection components use a normalized item that
 * includes a `key` prop and an optional `item` prop. This is mostly to support
 * Windowed data where items are created before their data has been loaded (data
 * gets set in the `item` prop). If data has loaded, return its `key`. If not,
 * return the top-level `key` on the normalized item.
 * @param item The normalized item or section
 * @returns The `key` of the item or section
 */
export function getItemKey<
  TItem extends NormalizedItem | NormalizedSection,
  TKey extends TItem extends NormalizedItem
    ? ItemKey | undefined
    : TItem extends NormalizedSection
    ? Key | undefined
    : undefined,
>(item: TItem | null | undefined): TKey {
  return (item?.item?.key ?? item?.key) as TKey;
}

/**
 * Get the position of the item with the given selected key in a list of items.
 * @param items The items to search
 * @param itemHeight The height of each item
 * @param selectedKey The key of the selected item
 * @param topOffset The top offset of the list
 * @returns The position of the selected item or the top offset if not found
 */
export async function getPositionOfSelectedItemElement<
  TKey extends string | number | boolean | undefined,
>({
  items,
  itemHeight,
  selectedKey,
  topOffset,
}: {
  items: ItemElement[];
  selectedKey: TKey | null | undefined;
  itemHeight: number;
  topOffset: number;
}): Promise<number> {
  let position = topOffset;

  if (selectedKey == null) {
    return position;
  }

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item.key === selectedKey) {
      return position;
    }

    position += itemHeight;
  }

  return topOffset;
}

/**
 * Determine if a node is a Section element.
 * @param node The node to check
 * @returns True if the node is a Section element
 */
export function isSectionElement<T>(
  node: ReactNode
): node is SectionElement<T> {
  return isElementOfType(node, Section);
}

/**
 * Determine if a node is an Item element.
 * @param node The node to check
 * @returns True if the node is an Item element
 */
export function isItemElement<T>(node: ReactNode): node is ItemElement<T> {
  return isElementOfType(node, Item);
}

/**
 * Determine if a node is an Item element containing a child `Text` element with
 * a `slot` prop set to `description`.
 * @param node The node to check
 * @returns True if the node is an Item element with a description
 */
export function isItemElementWithDescription<T>(
  node: ReactNode
): node is ReactElement<ItemProps<T>> {
  if (!isItemElement(node)) {
    return false;
  }

  // If children are wrapped in `ItemContent`, go down 1 level
  const children = isElementOfType(node.props.children, ItemContent)
    ? node.props.children.props.children
    : node.props.children;

  const childrenArray = Array.isArray(children) ? children : [children];

  const result = childrenArray.some(
    child => child.props?.slot === 'description' && isElementOfType(child, Text)
  );

  return result;
}

/**
 * Determine if a node is an array containing normalized items or sections with
 * keys. Note that this only checks the first node in the array.
 * @param node The node to check
 * @returns True if the node is a normalized item or section with keys array
 */
export function isNormalizedItemsWithKeysList<
  TItemOrSection extends ItemOrSection,
>(
  node:
    | TItemOrSection
    | TItemOrSection[]
    | NormalizedItemOrSection<TItemOrSection>[]
): node is NormalizedItemOrSection<TItemOrSection>[] {
  if (!Array.isArray(node)) {
    return false;
  }

  if (node.length === 0) {
    return true;
  }

  return !isItemOrSection(node[0]) && 'key' in node[0];
}

/**
 * Determine if an object is a normalized section.
 * @param maybeNormalizedSection The object to check
 * @returns True if the object is a normalized section
 */
export function isNormalizedSection(
  maybeNormalizedSection: NormalizedItem | NormalizedSection
): maybeNormalizedSection is NormalizedSection {
  return (
    maybeNormalizedSection.item != null &&
    'items' in maybeNormalizedSection.item
  );
}

/**
 * Determine if a node is an item or section. Valid types include strings,
 * numbers, booleans, Item elements, and Section elements.
 * @param node The node to check
 * @returns True if the node is an item or section
 */
export function isItemOrSection(node: ReactNode): node is ItemOrSection {
  return (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean' ||
    isItemElement(node) ||
    isSectionElement(node)
  );
}

/**
 * Returns a TooltipOptions object or null if options is false or null.
 * @param options Tooltip options
 * @param placement Default placement for the tooltip if `options` is set
 * explicitly to `true`
 * @returns TooltipOptions or null
 */
export function normalizeTooltipOptions(
  options?: boolean | TooltipOptions | null,
  placement: TooltipOptions['placement'] = 'right'
): TooltipOptions | null {
  if (options == null || options === false) {
    return null;
  }

  if (options === true) {
    return { placement };
  }

  return options;
}

/**
 * Convert a selection of `ItemKey`s to a selection of strings.
 * @param itemKeys The selection of `ItemKey`s
 * @returns The selection of strings
 */
export function itemSelectionToStringSet<
  TKeys extends 'all' | Iterable<ItemKey> | undefined,
  TResult extends TKeys extends 'all'
    ? 'all'
    : TKeys extends Iterable<ItemKey>
    ? Set<string>
    : undefined,
>(itemKeys: TKeys): TResult {
  if (itemKeys == null || itemKeys === 'all') {
    return itemKeys as undefined | 'all' as TResult;
  }

  return new Set([...itemKeys].map(String)) as TResult;
}
