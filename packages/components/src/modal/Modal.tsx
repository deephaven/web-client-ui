import classNames from 'classnames';
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactDOM from 'react-dom';
import { CSSTransition } from 'react-transition-group';
import ThemeExport from '../ThemeExport';
import { ThemeProvider } from '../theme';

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

function Modal({
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
}: ModalProps): React.ReactElement | null {
  const element = useRef<HTMLElement>();
  const background = useRef<HTMLDivElement>(null);
  const [backgroundClicked, setBackgroundClicked] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      switch (event.key) {
        case 'Escape':
          toggle?.();
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
    function closed() {
      if (!isOpen && onClosed) {
        onClosed();
      }
    },
    [onClosed, isOpen]
  );

  if (isOpen && !element.current) {
    element.current = document.createElement('div');
    element.current.setAttribute(
      'style',
      'padding-right: 15px; display: block'
    );
    element.current.setAttribute('role', 'presentation');
    document.body.appendChild(element.current);
  }

  const onExited = () => {
    if (element.current) {
      document.body.removeChild(element.current);
      element.current = undefined;
    }
  };

  return element.current
    ? ReactDOM.createPortal(
        <ThemeProvider isPortal>
          <CSSTransition
            appear
            mountOnEnter
            unmountOnExit
            in={isOpen}
            classNames={{
              appearActive: 'show',
              appearDone: 'show',
            }}
            timeout={ThemeExport.transitionMs}
            onExited={onExited}
          >
            <div
              className={classNames('modal-backdrop fade')}
              style={{ zIndex: 1050 }}
            />
          </CSSTransition>
          <CSSTransition
            appear
            mountOnEnter
            unmountOnExit
            in={isOpen}
            classNames={{
              appearDone: 'show',
            }}
            timeout={ThemeExport.transitionMs}
            onExited={onExited}
          >
            <div
              ref={background}
              className="modal fade"
              onMouseDown={e => {
                if (e.target === background.current) {
                  setBackgroundClicked(true);
                } else {
                  setBackgroundClicked(false);
                }
              }}
              onMouseUp={e => {
                if (
                  backgroundClicked &&
                  e.target === background.current &&
                  toggle !== undefined
                ) {
                  toggle();
                }
              }}
              role="dialog"
              style={{ display: 'block' }}
            >
              <div
                className={classNames(`modal-dialog ${className}`, {
                  'modal-lg': size === 'lg',
                  'modal-sm': size === 'sm',
                  'modal-xl': size === 'xl',
                  'modal-dialog-centered': centered,
                })}
                style={{ zIndex: 1040 }}
              >
                <div
                  className="modal-content"
                  role="presentation"
                  data-testid={dataTestId}
                >
                  {children}
                </div>
              </div>
            </div>
          </CSSTransition>
        </ThemeProvider>,
        element.current
      )
    : null;
}

export default Modal;
