import React, { CSSProperties, ReactElement, ReactNode } from 'react';

interface ModalBodyProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  'data-testid'?: string;
}

function ModalBody({
  className = 'modal-body',
  style,
  children,
  'data-testid': dataTestId,
}: ModalBodyProps): ReactElement {
  return (
    <div className={className} data-testid={dataTestId} style={style}>
      {children}
    </div>
  );
}

export default ModalBody;
