import React, { useCallback } from 'react';
import classNames from 'classnames';
import { useForwardedRef } from '@deephaven/react-hooks';

export type SelectProps = {
  children: React.ReactNode;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
  onChange: (value: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLSelectElement>;
  id?: string;
  className?: string;
  defaultValue?: string;
  name?: string;
  title?: string;
  value?: string;
  disabled?: boolean;
  'data-testid'?: string;
  'aria-label'?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (props, forwardedRef) => {
    const {
      children,
      onBlur,
      onChange,
      onKeyDown,
      id,
      className,
      defaultValue,
      name,
      title,
      value,
      disabled,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
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
        id={id}
        ref={ref}
        className={classNames('custom-select', className)}
        onBlur={onBlur}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        defaultValue={defaultValue}
        value={value}
        name={name}
        title={title}
        disabled={disabled}
        data-testid={dataTestId}
        aria-label={ariaLabel}
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
