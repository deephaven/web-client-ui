import React, { CSSProperties, ReactElement, ReactNode } from 'react';
import './Modal.scss';

interface ModalBodyProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  'data-testid'?: string;
}

const ModalBody = ({
  className = 'modal-body',
  style,
  children,
  'data-testid': dataTestId,
}: ModalBodyProps): ReactElement => (
  <div className={className} data-testid={dataTestId} style={style}>
    {children}
  </div>
);

export default ModalBody;
