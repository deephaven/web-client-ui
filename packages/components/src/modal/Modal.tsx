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
  autoFocus?: boolean;
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
  autoFocus = true,
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

  useEffect(function addKeydownEventListener() {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  });

  useEffect(
    function open() {
      if (onOpened) {
        onOpened();
      }
    },
    [onOpened]
  );

  // useEffect(
  //   function autoFocusOnRender() {
  //     if (autoFocus && isOpen) {
  //       (outerDivRef?.current as HTMLDivElement).focus();
  //     }
  //   },
  //   [autoFocus, isOpen]
  // );

  const getCentered = (): string => {
    if (centered) {
      return 'modal-dialog-centered';
    }
    return '';
  };

  return isOpen ? (
    ReactDOM.createPortal(
      <div className={`modal  ${getCentered()}`} onClick={toggle} role="dialog">
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
