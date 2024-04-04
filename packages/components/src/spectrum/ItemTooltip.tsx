import { ReactNode } from 'react';
import { isElementOfType } from '@deephaven/react-hooks';
import { TooltipOptions } from './utils';
import { Tooltip } from '../popper';
import { Flex } from './layout';
import { Text } from './Text';

export interface ItemTooltipProps {
  children: ReactNode;
  options: TooltipOptions;
}

/**
 * Tooltip for `<Item>` content.
 */
export function ItemTooltip({
  children,
  options,
}: ItemTooltipProps): JSX.Element {
  if (Array.isArray(children)) {
    return (
      <Tooltip options={options}>
        {/* Multiple children scenarios include a `<Text>` node for the label 
        and at least 1 of an optional icon or `<Text slot="description">` node.
        In such cases we only show the label and description `<Text>` nodes. */}
        <Flex direction="column" alignItems="start">
          {children.filter(node => isElementOfType(node, Text))}
        </Flex>
      </Tooltip>
    );
  }

  return <Tooltip options={options}>{children}</Tooltip>;
}

export default ItemTooltip;
