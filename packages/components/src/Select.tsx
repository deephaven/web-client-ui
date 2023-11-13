import React, { useCallback } from 'react';
import classNames from 'classnames';
import { useForwardedRef } from '@deephaven/react-hooks';

type baseSelectProps = Omit<React.HTMLProps<HTMLSelectElement>, 'onChange'>;

export type SelectProps = baseSelectProps & {
  onChange: (value: string) => void;
  'data-testid'?: string;
};

/**
 * A custom select component with styling, which is a wrapper around the
 * native select element.
 * @param props.onChange returns a string value and not the event
 */

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (props, forwardedRef) => {
    const {
      children,
      className,
      onChange,
      'data-testid': dataTestId,
      ...rest
    } = props;

    const ref = useForwardedRef<HTMLSelectElement>(forwardedRef);

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>): void => {
        onChange(event.target.value);
      },
      [onChange]
    );

    return (
      <select
        ref={ref}
        className={classNames('custom-select', className)}
        onChange={handleChange}
        data-testid={dataTestId}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export default Select;
