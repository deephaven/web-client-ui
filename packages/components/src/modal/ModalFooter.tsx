import React, { ReactElement, ReactNode } from 'react';
import './Modal.scss';

const ModalFooter = ({
  className = 'modal-footer',
  children,
  'data-testid': dataTestId,
}: {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}): ReactElement => (
  <div className={className} data-testid={dataTestId}>
    {children}
  </div>
);

export default ModalFooter;
