import { isElementOfType } from '@deephaven/react-hooks';
import React, { ReactNode, useMemo, useState } from 'react';
import {
  Checkbox,
  CheckboxGroup as SpectrumCheckboxGroup,
  SpectrumCheckboxGroupProps,
} from '@adobe/react-spectrum';

export type CheckboxGroupProps = {
  children: ReactNode;
} & Omit<SpectrumCheckboxGroupProps, 'children'>;

/**
 * Augmented version of the Spectrum CheckboxGroup component that supports
 * primitive item children.
 */
export function CheckboxGroup({
  children,
  ...props
}: CheckboxGroupProps): JSX.Element {
  const [checkedState, setCheckedState] = useState<{ [key: number]: boolean }>(
    {}
  );

  const handleCheckboxChange = (index: number) => {
    setCheckedState(prevState => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const wrappedChildren = useMemo(
    () =>
      React.Children.map(children, (child, index) => {
        if (isElementOfType(child, Checkbox)) {
          return React.cloneElement(child, {
            isSelected: true,
            value: `checkbox-${index}`,
            onChange: () => handleCheckboxChange(index),
          });
        }
        return (
          <Checkbox
            isSelected={checkedState[index] || false}
            value={`checkbox-${index}`}
            onChange={() => handleCheckboxChange(index)}
          >
            {String(child)}
          </Checkbox>
        );
      }) || [],
    [children, checkedState]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SpectrumCheckboxGroup {...props}>{wrappedChildren}</SpectrumCheckboxGroup>
  );
}

export default CheckboxGroup;
