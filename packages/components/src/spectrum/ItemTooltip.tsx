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

export function ItemTooltip({
  children,
  options,
}: ItemTooltipProps): JSX.Element {
  if (typeof children === 'boolean') {
    return <Tooltip options={options}>{children}</Tooltip>;
  }

  if (Array.isArray(children)) {
    return (
      <Tooltip options={options}>
        <Flex direction="column" alignItems="start">
          {children.filter(node => isElementOfType(node, Text))}
        </Flex>
      </Tooltip>
    );
  }

  return <Tooltip options={options}>{children}</Tooltip>;
}

export default ItemTooltip;
