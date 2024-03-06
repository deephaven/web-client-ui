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
    // For cases where there are multiple `Text` children, add css class to
    // handle overflow
    content = content.map(item =>
      isElementOfType(item, Text)
        ? // Cloning elements has the side effect of resetting React's internal
          // `_store.validated` value to `false on each item. This causes them
          // to be re-validated when they are rendered. Since they are inside of
          // an array, React will show devtools warnings if they are missing `key`
          // props.
          cloneElement(item, {
            ...item.props,
            UNSAFE_className: cl(
              item.props.UNSAFE_className,
              stylesCommon.spectrumEllipsis
            ),
          })
        : item
    );
  }
  /* eslint-enable no-param-reassign */

  return typeof content === 'string' ? (
    <Text UNSAFE_className={stylesCommon.spectrumEllipsis}>{content}</Text>
  ) : (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>{content}</>
  );
}

export default PickerItemContent;
