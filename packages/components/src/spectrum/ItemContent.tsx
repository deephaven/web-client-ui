import {
  Children,
  cloneElement,
  isValidElement,
  ReactNode,
  useState,
} from 'react';
import cl from 'classnames';
import { isElementOfType, useCheckOverflow } from '@deephaven/react-hooks';
import { NON_BREAKING_SPACE } from '@deephaven/utils';
import { Text } from './Text';
import { TooltipOptions } from './utils';
import ItemTooltip from './ItemTooltip';
import stylesCommon from '../SpectrumComponent.module.scss';

export interface ItemContentProps {
  children: ReactNode;
  tooltipOptions?: TooltipOptions | null;
}

/**
 * Item content. Text content will be wrapped in a Spectrum Text
 * component with ellipsis overflow handling. If text content overflows and
 * tooltipOptions are provided a tooltip will be displayed when hovering over
 * the item content.
 */
export function ItemContent({
  children: content,
  tooltipOptions,
}: ItemContentProps): JSX.Element | null {
  const { checkOverflow, isOverflowing, resetIsOverflowing } =
    useCheckOverflow();

  const [previousContent, setPreviousContent] = useState(content);

  // Reset `isOverflowing` if content changes. It will get re-calculated as
  // `Text` components render.
  if (previousContent !== content) {
    setPreviousContent(content);
    resetIsOverflowing();
  }

  if (isValidElement(content)) {
    return content;
  }

  /* eslint-disable no-param-reassign */
  if (content === '') {
    // Prevent the item height from collapsing when the content is empty
    content = NON_BREAKING_SPACE;
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
    content = Children.map(content, el =>
      isElementOfType(el, Text)
        ? cloneElement(el, {
            ...el.props,
            ref: checkOverflow,
            UNSAFE_className: cl(
              el.props.UNSAFE_className,
              stylesCommon.spectrumEllipsis
            ),
          })
        : el
    );
  }

  if (typeof content === 'string' || typeof content === 'number') {
    content = (
      <Text
        ref={checkOverflow}
        UNSAFE_className={stylesCommon.spectrumEllipsis}
      >
        {content}
      </Text>
    );
  }
  /* eslint-enable no-param-reassign */

  const tooltip =
    tooltipOptions == null || !isOverflowing ? null : (
      <ItemTooltip options={tooltipOptions}>{content}</ItemTooltip>
    );

  return (
    <>
      {content}
      {tooltip}
    </>
  );
}

export default ItemContent;
