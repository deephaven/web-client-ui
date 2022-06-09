import React, { CSSProperties, ReactElement, ReactNode } from 'react';
import './Modal.scss';

const ModalBody = ({
  className = 'modal-body',
  style,
  children,
  'data-testid': dataTestId,
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  'data-testid'?: string;
}): ReactElement => (
  <div className={className} data-testid={dataTestId} style={style}>
    {children}
  </div>
);

export default ModalBody;
