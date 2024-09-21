/* eslint-disable react/no-array-index-key */
import { isElementOfType } from '@deephaven/react-hooks';
import React, { ReactNode, useMemo } from 'react';
import {
  Checkbox,
  CheckboxGroup as SpectrumCheckboxGroup,
  SpectrumCheckboxGroupProps,
} from '@adobe/react-spectrum';
import { ensureArray } from '@deephaven/utils';

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
  const wrappedChildren = useMemo(
    () =>
      ensureArray(children).map(child =>
        isElementOfType(child, Checkbox) ? (
          child
        ) : (
          <Checkbox key={String(child)} value={String(child)}>
            {String(child)}
          </Checkbox>
        )
      ),
    [children]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SpectrumCheckboxGroup {...props}>{wrappedChildren}</SpectrumCheckboxGroup>
  );
}

export default CheckboxGroup;
