import React from 'react';

export type OptionProps = {
  children: React.ReactNode;
  value: string;
  'data-testid'?: string;
};

const Option = ({
  children,
  value,
  'data-testid': dataTestId,
}: OptionProps): JSX.Element => (
  <option value={value} data-testid={dataTestId}>
    {children}
  </option>
);

export default Option;
