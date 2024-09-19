import React, {
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import classNames from 'classnames';

interface ModalBodyProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  'data-testid'?: string;
}

function ModalBody({
  className,
  style,
  children,
  'data-testid': dataTestId,
}: ModalBodyProps): ReactElement {
  return (
    <div
      className={classNames('modal-body', className)}
      data-testid={dataTestId}
      style={style}
    >
      {children}
    </div>
  );
}

export default ModalBody;
