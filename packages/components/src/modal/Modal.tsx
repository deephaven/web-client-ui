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
  // const [show, setShow] = useState(false);

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

  // useEffect(
  //   function syncState() {
  //     if (isOpen) {
  //       setShow(true);
  //     }
  //   },
  //   [isOpen]
  // );

  // const onEnterOrExit = () => {
  //   setShow(isOpen);
  // };

  return ReactDOM.createPortal(
    <CSSTransition
      appear
      mountOnEnter
      unmountOnExit
      in={isOpen}
      classNames={{
        enterActive: 'show',
        enterDone: 'show',
      }}
      timeout={ThemeExport.transitionMs}
    >
      <div
        className="modal fade"
        onClick={toggle}
        role="dialog"
        style={{ zIndex: 1050, display: 'block', paddingRight: '15px' }}
      >
        <div className={classNames('modal-backdrop fade show')} />
        <div
          className={classNames(`modal-dialog ${className}`, {
            'modal-lg': size === 'lg',
            'modal-sm': size === 'sm',
            'modal-xl': size === 'xl',
            'modal-dialog-centered': centered,
          })}
          ref={outerDivRef}
          style={{ zIndex: 1040 }}
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
      </div>
    </CSSTransition>,
    document.getElementsByTagName('BODY')[0]
  );
};

export default Modal;
