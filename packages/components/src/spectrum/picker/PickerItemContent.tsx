import { cloneElement, isValidElement, ReactNode } from 'react';
import { Text } from '@adobe/react-spectrum';
import cl from 'classnames';
import { isElementOfType } from '@deephaven/react-hooks';
import stylesCommon from '../../SpectrumComponent.module.scss';

export interface PickerItemContentProps {
  children: ReactNode;
}

/**
 * Picker item content. Text content will be wrapped in a Spectrum Text
 * component with ellipsis overflow handling.
 */
export function PickerItemContent({
  children: content,
}: PickerItemContentProps): JSX.Element | null {
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
    content = content.map((item, i) =>
      isElementOfType(item, Text)
        ? cloneElement(item, {
            ...item.props,
            // `cloneElement` has the side effect of resetting React's internal
            // `_store.validated` value to `false on the item. This causes it
            // to be re-validated as a child in an array when is is rendered,
            // even if the item was originally provided as an inline child.
            // Since React expects array children to have explicit keys, this
            // will show devtools warnings for items that wouldn't usually
            // require explicit keys. Since we are only cloning `Text` nodes, it
            // should be reasonable to fallback to a key matching the stringified
            // content. The index suffix is an extra precation for when 2 <Text>
            // nodes have the same value.
            key: item.key ?? `${item.props.children}_${i}`,
            UNSAFE_className: cl(
              item.props.UNSAFE_className,
              stylesCommon.spectrumEllipsis
            ),
          })
        : item
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

export default PickerItemContent;
