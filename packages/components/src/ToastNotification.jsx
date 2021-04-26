import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import { vsClose } from '@deephaven/icons';
import Button from './Button';
import ThemeExport from './ThemeExport';
import './ToastNotification.scss';

const ToastNotification = props => {
  const {
    buttons,
    isShown,
    classNames: classNamesProp,
    message,
    type,
    onClick,
    onDismiss,
  } = props;

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

ToastNotification.propTypes = {
  buttons: PropTypes.node,
  classNames: PropTypes.arrayOf(PropTypes.string),
  isShown: PropTypes.bool,
  message: PropTypes.string,
  type: PropTypes.string,

  onClick: PropTypes.func,
  onDismiss: PropTypes.func,
};

ToastNotification.defaultProps = {
  buttons: null,
  classNames: null,
  isShown: false,
  message: null,
  type: null,

  onClick: () => {},
  onDismiss: null,
};

export default ToastNotification;
