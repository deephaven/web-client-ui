import { cloneElement, ReactElement } from 'react';
import { Item } from '@adobe/react-spectrum';
import { isElementOfType } from '@deephaven/react-hooks';
import {
  isItemElement,
  isSectionElement,
  ItemElement,
  ItemOrSection,
  ITEM_EMPTY_STRING_TEXT_VALUE,
  SectionElement,
  TooltipOptions,
} from './itemUtils';
import { ItemProps } from '../shared';
import ItemContent from '../ItemContent';

/**
 * Ensure all primitive children are wrapped in `Item` elements and that all
 * `Item` element content is wrapped in `ItemContent` elements to handle text
 * overflow consistently and to support tooltips.
 * @param itemsOrSections The items or sections to wrap
 * @param tooltipOptions The tooltip options to use when wrapping items
 * @returns The wrapped items or sections
 */
export function wrapItemChildren(
  itemsOrSections: ItemOrSection | ItemOrSection[],
  tooltipOptions: TooltipOptions | null
): (ItemElement | SectionElement)[] {
  const itemsOrSectionsArray = Array.isArray(itemsOrSections)
    ? itemsOrSections
    : [itemsOrSections];

  return itemsOrSectionsArray.map(item => {
    if (isItemElement(item)) {
      if (isElementOfType(item.props.children, ItemContent)) {
        return item;
      }

      const key = item.key ?? item.props.textValue;
      const textValue =
        item.props.textValue === ''
          ? ITEM_EMPTY_STRING_TEXT_VALUE
          : item.props.textValue;

      // Wrap in `ItemContent` so we can support tooltips and handle text
      // overflow
      return cloneElement(item, {
        ...item.props,
        key,
        textValue,
        children: (
          <ItemContent tooltipOptions={tooltipOptions}>
            {item.props.children}
          </ItemContent>
        ),
      });
    }

    if (isSectionElement(item)) {
      return cloneElement(item, {
        ...item.props,
        key:
          item.key ??
          (typeof item.props.title === 'string' ? item.props.title : undefined),
        children: wrapItemChildren(
          item.props.children,
          tooltipOptions
        ) as ReactElement<ItemProps<unknown>>[],
      });
    }

    if (
      typeof item === 'string' ||
      typeof item === 'number' ||
      typeof item === 'boolean'
    ) {
      const text = String(item);
      const textValue = text === '' ? ITEM_EMPTY_STRING_TEXT_VALUE : text;

      return (
        <Item key={text} textValue={textValue}>
          <ItemContent tooltipOptions={tooltipOptions}>{text}</ItemContent>
        </Item>
      );
    }

    return item;
  });
}

export default wrapItemChildren;
