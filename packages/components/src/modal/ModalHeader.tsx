import React, { CSSProperties, ReactElement, ReactNode } from 'react';
import './Modal.scss';

interface ModalHeaderProps {
  className?: string;
  children?: ReactNode;
  closeButton?: boolean;
  style?: CSSProperties;
  toggle?: () => void;
  'data-testid'?: string;
}

const ModalHeader = ({
  className = 'modal-header',
  children,
  closeButton = true,
  style,
  toggle,
  'data-testid': dataTestId,
}: ModalHeaderProps): ReactElement => (
  <div className="modal-header" style={style}>
    <h5 className="modal-title">{children}</h5>
    {closeButton && (
      <button
        type="button"
        className="close"
        data-dismiss="modal"
        aria-label="Close"
        onClick={toggle}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    )}
  </div>
);

export default ModalHeader;
