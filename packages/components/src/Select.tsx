import React, { useCallback } from 'react';
import classNames from 'classnames';

export type SelectProps = {
  children: React.ReactNode;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
};

const Select = ({
  children,
  onChange,
  className,
  defaultValue,
  value,
  disabled,
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
    >
      {children}
    </select>
  );
};

export default Select;
