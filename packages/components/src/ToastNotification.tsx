import React from 'react';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import { vsClose } from '@deephaven/icons';
import Button from './Button';
import ThemeExport from './ThemeExport';
import './ToastNotification.scss';

type ToastNotificationProps = {
  buttons?: typeof Button[];
  classNames?: string;
  isShown?: boolean;
  message?: string;
  type?: string;

  onClick?: React.EventHandler<
    React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
  >;
  onDismiss?: React.MouseEventHandler<HTMLButtonElement>;
};

const ToastNotification = ({
  buttons,
  isShown = false,
  classNames: classNamesProp,
  message,
  type,
  onClick,
  onDismiss,
}: ToastNotificationProps): JSX.Element => {
  const hasButtons = buttons && buttons.length !== 0;

  return (
    <CSSTransition
      in={isShown}
      timeout={ThemeExport.transitionMs}
      classNames="toast-notification-slide-up"
      mountOnEnter
      unmountOnExit
    >
      <div
        className={classNames('toast-notification', classNamesProp, type)}
        role="presentation"
        onClick={onClick}
        onKeyPress={onClick}
      >
        <div className="message-container">
          <span className="message">{message}</span>
        </div>
        <CSSTransition
          in={hasButtons}
          timeout={ThemeExport.transitionSlowMs}
          classNames="fade"
          mountOnEnter
          unmountOnExit
        >
          <div className="buttons-container">{buttons}</div>
        </CSSTransition>
        {onDismiss && (
          <Button
            kind="ghost"
            icon={vsClose}
            tooltip="Close notification"
            className="my-2"
            onClick={onDismiss}
          />
        )}
      </div>
    </CSSTransition>
  );
};

ToastNotification.TYPE = Object.freeze({
  ERROR: 'error',
});

export default ToastNotification;
