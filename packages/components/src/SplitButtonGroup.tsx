import React from 'react';
import classNames from 'classnames';

type SplitButtonGroupProps = React.PropsWithChildren<{
  className?: string;
  style?: React.CSSProperties;
  'data-testid'?: string;
}>;

export function SplitButtonGroup(props: SplitButtonGroupProps): JSX.Element {
  const { children, className, style, 'data-testid': dataTestId } = props;

  return (
    <div
      className={classNames('btn-group', className)}
      style={style}
      role="group"
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
}

export default SplitButtonGroup;
