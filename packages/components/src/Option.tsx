import React from 'react';

export type OptionProps = {
  children: React.ReactNode;
  value: string;
};

const Option = ({ children, value }: OptionProps): JSX.Element => (
  <option value={value}>{children}</option>
);

export default Option;
