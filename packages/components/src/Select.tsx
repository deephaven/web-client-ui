import React, { useCallback } from 'react';
import classNames from 'classnames';

export type SelectProps = {
  children: React.ReactNode;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  'data-testid'?: string;
};

const Select = ({
  children,
  onBlur,
  onChange,
  className,
  defaultValue,
  name,
  value,
  disabled,
  'data-testid': dataTestId,
}: SelectProps): JSX.Element => {
  const handleChange = useCallback(
    event => {
      onChange(event.target.value);
    },
    [onChange]
  );

  return (
    <select
      className={classNames('custom-select', className)}
      onBlur={onBlur}
      onChange={handleChange}
      defaultValue={defaultValue}
      value={value}
      name={name}
      disabled={disabled}
      data-testid={dataTestId}
    >
      {children}
    </select>
  );
};

export default Select;
