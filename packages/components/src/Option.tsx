import React from 'react';

export type OptionProps = {
  children: React.ReactNode;
  disabled?: boolean;
  value: string;
  'data-testid'?: string;
};

const Option = ({
  children,
  disabled,
  value,
  'data-testid': dataTestId,
}: OptionProps): JSX.Element => (
  <option value={value} disabled={disabled} data-testid={dataTestId}>
    {children}
  </option>
);

export default Option;
