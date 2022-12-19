import React, { ReactElement, ReactNode } from 'react';

interface ModalFooterProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

function ModalFooter({
  className = 'modal-footer',
  children,
  'data-testid': dataTestId,
}: ModalFooterProps): ReactElement {
  return (
    <div className={className} data-testid={dataTestId}>
      {children}
    </div>
  );
}

export default ModalFooter;
