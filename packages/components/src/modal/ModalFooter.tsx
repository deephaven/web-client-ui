import React, { ReactElement, ReactNode } from 'react';
import './Modal.scss';

interface ModalFooterProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

const ModalFooter = ({
  className = 'modal-footer',
  children,
  'data-testid': dataTestId,
}: ModalFooterProps): ReactElement => (
  <div className={className} data-testid={dataTestId}>
    {children}
  </div>
);

export default ModalFooter;
