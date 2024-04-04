import React from 'react';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import { vsClose } from '@deephaven/icons';
import Button from './Button';
import ThemeExport from './ThemeExport';
import './ToastNotification.scss';
import { FadeTransition } from './transitions';

type ToastNotificationProps = {
  buttons?: (typeof Button)[];
  classNames?: string;
  isShown?: boolean;
  message?: string;
  type?: string;
  'data-testid'?: string;

  onClick?: React.EventHandler<
    React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
  >;
  onDismiss?: React.MouseEventHandler<HTMLButtonElement>;
};

function ToastNotification({
  buttons,
  isShown = false,
  classNames: classNamesProp,
  message,
  type,
  onClick,
  onDismiss,
  'data-testid': dataTestId,
}: ToastNotificationProps): JSX.Element {
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
        data-testid={dataTestId}
      >
        <div className="message-container">
          <span className="message">{message}</span>
        </div>
        <FadeTransition
          in={hasButtons}
          timeout={ThemeExport.transitionSlowMs}
          mountOnEnter
          unmountOnExit
        >
          <div className="buttons-container">{buttons}</div>
        </FadeTransition>
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
}

ToastNotification.TYPE = Object.freeze({
  ERROR: 'error',
});

export default ToastNotification;
