import React, { useCallback } from 'react';
import classNames from 'classnames';

export type SelectProps = {
  children: React.ReactNode;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  'data-testid'?: string;
};

const Select = ({
  children,
  onChange,
  className,
  defaultValue,
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
      onChange={handleChange}
      defaultValue={defaultValue}
      value={value}
      disabled={disabled}
      data-testid={dataTestId}
    >
      {children}
    </select>
  );
};

export default Select;
