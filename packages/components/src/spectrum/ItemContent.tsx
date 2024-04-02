import { Children, cloneElement, isValidElement, ReactNode } from 'react';
import { Text } from '@adobe/react-spectrum';
import cl from 'classnames';
import { isElementOfType } from '@deephaven/react-hooks';
import stylesCommon from '../SpectrumComponent.module.scss';

export interface ItemContentProps {
  children: ReactNode;
}

/**
 * Picker item content. Text content will be wrapped in a Spectrum Text
 * component with ellipsis overflow handling.
 */
export function ItemContent({
  children: content,
}: ItemContentProps): JSX.Element | null {
  if (isValidElement(content)) {
    return content;
  }

  /* eslint-disable no-param-reassign */
  if (content === '') {
    // Prevent the item height from collapsing when the content is empty
    content = '\xa0'; // Non-breaking space
  } else if (typeof content === 'boolean') {
    // Boolean values need to be stringified to render
    content = String(content);
  } else if (Array.isArray(content)) {
    // For cases where there are multiple `Text` children, add a css class to
    // handle overflow. The primary use case for multiple text nodes is when a
    // description is provided for an item. e.g.
    // <Item textValue="Some Text">
    //   <SomeIcon />
    //   <Text>Some Label</Text>
    //   <Text slot="description">Some Description</Text>
    // </Item>
    content = Children.map(content, (el, i) =>
      isElementOfType(el, Text)
        ? cloneElement(el, {
            ...el.props,
            UNSAFE_className: cl(
              el.props.UNSAFE_className,
              stylesCommon.spectrumEllipsis
            ),
          })
        : el
    );
  }
  /* eslint-enable no-param-reassign */

  return typeof content === 'string' || typeof content === 'number' ? (
    <Text UNSAFE_className={stylesCommon.spectrumEllipsis}>{content}</Text>
  ) : (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>{content}</>
  );
}

export default ItemContent;
