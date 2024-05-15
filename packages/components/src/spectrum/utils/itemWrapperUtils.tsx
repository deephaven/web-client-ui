import { cloneElement, ReactNode } from 'react';
import { Item } from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dh as dhIcons } from '@deephaven/icons';
import { isElementOfType } from '@deephaven/react-hooks';
import { ensureArray, NON_BREAKING_SPACE } from '@deephaven/utils';
import {
  isItemElement,
  isSectionElement,
  ItemElement,
  ItemIconSlot,
  ItemOrSection,
  ITEM_EMPTY_STRING_TEXT_VALUE,
  SectionElement,
  TooltipOptions,
} from './itemUtils';
import { ItemContent } from '../ItemContent';
import { Icon } from '../icons';
import { Text } from '../Text';

/**
 * If the given content is a string, wrap it in an Icon component. Otherwise,
 * return the original content. If the key is not found in the dhIcons object,
 * the vsBlank icon will be used.
 * @param maybeIconKey The content to wrap
 * @param slot The slot to use for the Icon component
 * @returns The wrapped content or original content if not a string
 */
export function wrapIcon(
  maybeIconKey: ReactNode,
  slot: ItemIconSlot
): ReactNode {
  // eslint-disable-next-line no-param-reassign
  maybeIconKey = maybeIconKey ?? '';

  if (typeof maybeIconKey !== 'string') {
    return maybeIconKey;
  }

  return (
    <Icon slot={slot}>
      <FontAwesomeIcon icon={dhIcons[maybeIconKey] ?? dhIcons.vsBlank} />
    </Icon>
  );
}

/**
 * Ensure all primitive children are wrapped in `Item` elements and that all
 * `Item` element content is wrapped in `ItemContent` elements to handle text
 * overflow consistently and to support tooltips.
 * @param itemsOrSections The items or sections to wrap
 * @param tooltipOptions The tooltip options to use when wrapping items
 * @returns The wrapped items or sections
 */
export function wrapItemChildren<T>(
  itemsOrSections: ItemOrSection<T> | ItemOrSection<T>[],
  tooltipOptions: TooltipOptions | null
): ItemElement<T> | SectionElement<T> | (ItemElement<T> | SectionElement<T>)[] {
  const itemsOrSectionsArray = ensureArray(itemsOrSections);

  const result = itemsOrSectionsArray.map(item => {
    if (isItemElement(item)) {
      // Item content is already wrapped
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
        children: wrapItemChildren<T>(item.props.children, tooltipOptions),
      });
    }

    const text = String(item);
    const textValue = text === '' ? ITEM_EMPTY_STRING_TEXT_VALUE : text;

    return (
      <Item key={text} textValue={textValue}>
        <ItemContent tooltipOptions={tooltipOptions}>{text}</ItemContent>
      </Item>
    );
  });

  // Keep consistent with original data structure as array or single node
  return Array.isArray(itemsOrSections) ? result : result[0];
}

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
        {/* Non-breaking space is needed to avoid the Text element's height 
        collapsing when content is empty */}
        {content === '' ? NON_BREAKING_SPACE : String(content)}
      </Text>
    );
  }

  return content;
}
