import classNames from 'classnames';
import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import ReactDOM from 'react-dom';
import './Modal.scss';

interface ModalProps {
  className?: string;
  children?: ReactNode;
  role?: string;
  keyboard?: boolean;
  isOpen?: boolean;
  centered?: boolean;
  onOpened?: () => void;
  onClosed?: () => void;
  toggle?: () => void;
  'data-testid'?: string;
}

const Modal = ({
  className = 'theme-bg-light',
  children,
  role = 'role',
  keyboard = true,
  isOpen = false,
  centered = false,
  onOpened,
  onClosed,
  toggle,
  'data-testid': dataTestId,
}: ModalProps): ReactElement => {
  const outerDivRef = useRef<HTMLDivElement>(null);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      switch (event.key) {
        case 'Escape':
          if (keyboard === true) {
            if (toggle) {
              toggle();
            }
          }
          break;
        default:
          break;
      }
    },
    [toggle, keyboard]
  );

  useEffect(
    function addKeydownEventListener() {
      if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }
    },
    [handleKeyDown, isOpen]
  );

  useEffect(
    function open() {
      if (isOpen && onOpened) {
        onOpened();
      }
    },
    [onOpened, isOpen]
  );

  useEffect(
    function open() {
      if (!isOpen && onClosed) {
        onClosed();
      }
    },
    [onClosed, isOpen]
  );

  return isOpen ? (
    ReactDOM.createPortal(
      <div
        className={classNames('modal', { 'modal-dialog-centered': centered })}
        onClick={toggle}
        role="dialog"
      >
        <div className={`modal-dialog ${className}`} ref={outerDivRef}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            data-testid={dataTestId}
            role="dialog"
          >
            {children}
          </div>
        </div>
      </div>,
      document.getElementsByTagName('BODY')[0]
    )
  ) : (
    <></>
  );
};

export default Modal;
