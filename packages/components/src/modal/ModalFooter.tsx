import React, { type ReactElement, type ReactNode } from 'react';
import classNames from 'classnames';

interface ModalFooterProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

function ModalFooter({
  className,
  children,
  'data-testid': dataTestId,
}: ModalFooterProps): ReactElement {
  return (
    <div
      className={classNames('modal-footer', className)}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
}

export default ModalFooter;
