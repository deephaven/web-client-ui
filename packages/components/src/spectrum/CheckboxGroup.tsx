import {
  CheckboxGroup as SpectrumCheckboxGroup,
  SpectrumCheckboxGroupProps,
} from '@adobe/react-spectrum';
import { isElementOfType } from '@deephaven/react-hooks';
import React, { useMemo } from 'react';
import Checkbox from '../Checkbox';

/**
 * Augmented version of the Spectrum CheckboxGroup component that supports
 * primitive item children.
 */
export function CheckboxGroup({
  children,
  ...props
}: SpectrumCheckboxGroupProps): JSX.Element {
  const wrappedChildren = useMemo(
    () =>
      React.Children.map(children, child => {
        if (isElementOfType(child, Checkbox)) {
          return child;
        }
        return <Checkbox checked={false}>{child}</Checkbox>;
      }),
    [children]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SpectrumCheckboxGroup {...props}>{wrappedChildren}</SpectrumCheckboxGroup>
  );
}

export default CheckboxGroup;
