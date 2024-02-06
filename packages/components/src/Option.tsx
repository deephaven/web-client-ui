import React, { OptionHTMLAttributes } from 'react';

export type OptionProps = OptionHTMLAttributes<HTMLOptionElement> & {
  children: React.ReactNode;
  'data-testid'?: string;
};

function Option({ children, ...props }: OptionProps): JSX.Element {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <option {...props}>{children}</option>;
}

export default Option;
