import classNames from 'classnames';
import React, {
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import ReactDOM from 'react-dom';
import { CSSTransition } from 'react-transition-group';
import ThemeExport from '../ThemeExport';

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
  const element = useRef<HTMLElement>();

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

  return element.current ? (
    ReactDOM.createPortal(
      <>
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
            className="modal fade"
            onClick={toggle}
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
                onClick={e => e.stopPropagation()}
                role="presentation"
                data-testid={dataTestId}
              >
                {children}
              </div>
            </div>
          </div>
        </CSSTransition>
      </>,
      element.current
    )
  ) : (
    <></>
  );
};

export default Modal;
