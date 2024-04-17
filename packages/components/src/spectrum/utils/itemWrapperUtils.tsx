import { cloneElement, ReactElement, ReactNode } from 'react';
import { Item } from '@adobe/react-spectrum';
import { isElementOfType } from '@deephaven/react-hooks';
import { NON_BREAKING_SPACE } from '@deephaven/utils';
import { Text } from '../Text';
import {
  isItemElement,
  isSectionElement,
  ItemElement,
  ItemOrSection,
  SectionElement,
  TooltipOptions,
} from './itemUtils';
import { ItemProps } from '../shared';
import ItemContent from '../ItemContent';

/**
 * If the given content is a primitive type, wrap it in a Text component.
 * @param content The content to wrap
 * @param slot The slot to use for the Text component
 * @returns The wrapped content or original content if not a primitive type
 */
export function wrapPrimitiveWithText(
  content?: ReactNode,
  slot?: string
): ReactNode {
  // eslint-disable-next-line no-param-reassign
  content = content ?? '';

  if (['string', 'boolean', 'number'].includes(typeof content)) {
    return (
      <Text slot={slot}>
        {content === '' ? NON_BREAKING_SPACE : String(content)}
      </Text>
    );
  }

  return content;
}

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

  return itemsOrSectionsArray.map((item: ItemOrSection) => {
    if (isItemElement(item)) {
      if (isElementOfType(item.props.children, ItemContent)) {
        return item;
      }

      // Wrap in `ItemContent` so we can support tooltips and handle text
      // overflow
      return cloneElement(item, {
        ...item.props,
        children: (
          <ItemContent tooltipOptions={tooltipOptions}>
            {wrapPrimitiveWithText(item.props.children)}
          </ItemContent>
        ),
      });
    }

    if (isSectionElement(item)) {
      return cloneElement(item, {
        ...item.props,
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
      return (
        <Item key={text} textValue={text}>
          <ItemContent tooltipOptions={tooltipOptions}>{text}</ItemContent>
        </Item>
      );
    }

    return item;
  });
}
