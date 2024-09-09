import {
  Checkbox,
  CheckboxGroup as SpectrumCheckboxGroup,
  SpectrumCheckboxGroupProps,
} from '@adobe/react-spectrum';
import React, { useMemo } from 'react';

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
        if (typeof child === 'function') {
          return child;
        }
        return <Checkbox>{child}</Checkbox>;
      }),
    [children]
  );

  return (
    <SpectrumCheckboxGroup
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      // eslint-disable-next-line react/no-children-prop
      children={wrappedChildren}
    />
  );
}

CheckboxGroup.displayName = 'CheckboxGroup';

export default CheckboxGroup;
