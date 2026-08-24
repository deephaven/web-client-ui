import React from 'react';
import type { ReactNode } from 'react';
import type { BoxAlignmentStyleProps, StyleProps } from '@react-types/shared';
import { Flex, Text } from '@deephaven/components';

// eslint-disable-next-line react-refresh/only-export-components
export const LABELED_FLEX_CONTAINER_HEIGHTS = {
  gap: 10,
  label: {
    medium: 21,
    large: 25.5,
  },
};

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
      gap={LABELED_FLEX_CONTAINER_HEIGHTS.gap}
    >
      <Text>{label}</Text>
      {children}
    </Flex>
  );
}

export default LabeledFlexContainer;
