import classNames from 'classnames';
import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import './Modal.scss';
import { CSSTransition } from 'react-transition-group';

interface ModalProps {
  className?: string;
  children?: ReactNode;
  role?: string;
  keyboard?: boolean;
  isOpen?: boolean;
  centered?: boolean;
  size?: 'sm' | 'lg' | 'xl' | undefined;
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
  size,
  onOpened,
  onClosed,
  toggle,
  'data-testid': dataTestId,
}: ModalProps): ReactElement => {
  const [show, setShow] = useState(false);

  const outerDivRef = useRef<HTMLDivElement>(null);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      switch (event.key) {
        case 'Escape':
          if (toggle) {
            toggle();
          }
          break;
        default:
          break;
      }
    },
    [toggle]
  );

  useEffect(
    function addKeydownEventListener() {
      if (isOpen && keyboard) {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }
    },
    [handleKeyDown, isOpen, keyboard]
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

  useEffect(
    function syncState() {
      if (isOpen) {
        setShow(true);
      } else {
        setTimeout(() => setShow(false), 150);
      }
    },
    [isOpen]
  );

  return show || isOpen ? (
    ReactDOM.createPortal(
      <CSSTransition
        appear
        in={show}
        classNames="modal-transition"
        timeout={150}
      >
        <div style={{ zIndex: 1050, position: 'relative' }}>
          <div
            className={classNames('modal-backdrop fade', { show: isOpen })}
          />

          <CSSTransition
            appear
            in={show}
            classNames="modal-slide-in"
            timeout={150}
          >
            <div
              className={classNames('modal fade', {
                'modal-lg': size === 'lg',
                'modal-sm': size === 'sm',
                'modal-xl': size === 'xl',
                'modal-dialog-centered': centered,
                show: isOpen,
              })}
              onClick={toggle}
              role="dialog"
              style={{ display: 'block' }}
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
            </div>
          </CSSTransition>
        </div>
      </CSSTransition>,
      document.getElementsByTagName('BODY')[0]
    )
  ) : (
    <></>
  );
};

export default Modal;
