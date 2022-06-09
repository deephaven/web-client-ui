import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import ReactDOM from 'react-dom';
import './Modal.scss';

const Modal = ({
  className = 'theme-bg-light',
  children,
  role = 'role',
  keyboard = true,
  isOpen = false,
  autoFocus = true,
  centered = true,
  onOpened,
  onClosed,
  toggle,
  'data-testid': dataTestId,
}: {
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
}): ReactElement => {
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
      window.addEventListener('keydown', handleKeyDown);
    },
    [handleKeyDown]
  );

  useEffect(
    function open() {
      if (onOpened) {
        onOpened();
      }
    },
    [onOpened]
  );

  useEffect(
    function autoFocusOnRender() {
      if (autoFocus && isOpen) {
        (outerDivRef?.current as HTMLDivElement).focus();
      }
    },
    [autoFocus, isOpen]
  );

  const getCentered = (): string => {
    if (centered) {
      return 'modal-dialog-centered';
    }
    return '';
  };

  return isOpen ? (
    ReactDOM.createPortal(
      <div className="modal">
        <div
          className={`modal-dialog ${className} ${getCentered()}`}
          ref={outerDivRef}
          onClick={toggle}
          role="dialog"
        >
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
