import React, { type ReactNode } from 'react';
import type { BoxAlignmentStyleProps, StyleProps } from '@react-types/shared';
import { Flex, Text } from '@deephaven/components';

interface LabeledProps extends BoxAlignmentStyleProps, StyleProps {
  label: string;
  direction?: 'row' | 'column';
  children: ReactNode;
}

export function LabeledFlexContainer({
  label,
  direction = 'column',
  children,
  ...styleProps
}: LabeledProps): JSX.Element {
  return (
    <Flex
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...styleProps}
      direction={direction}
    >
      <Text>{label}</Text>
      {children}
    </Flex>
  );
}

export default LabeledFlexContainer;
