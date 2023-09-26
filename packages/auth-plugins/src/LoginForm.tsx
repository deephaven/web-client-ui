import { LoadingSpinner } from '@deephaven/components';
import classNames from 'classnames';
import React, { FormEventHandler } from 'react';
import './LoginForm.scss';

export interface LoginFormProps {
  /** What to display inside the form */
  children: React.ReactNode;

  /** Error message to display */
  errorMessage?: string;

  /** Whether currently logging in */
  isLoggingIn?: boolean;

  /** Triggered when the form is submitting */
  onSubmit?: FormEventHandler;
}

export function LoginForm({
  children,
  errorMessage,
  isLoggingIn = false,
  onSubmit,
}: LoginFormProps): JSX.Element {
  return (
    <form
      className="login-form"
      onSubmit={event => {
        event.preventDefault();
        event.stopPropagation();
        onSubmit?.(event);
      }}
    >
      <div className="flex-spacer" />
      <div className="flex-wrapper">
        <fieldset disabled={isLoggingIn} className="container-fluid">
          {children}
        </fieldset>
        <div className="form-group d-flex justify-content-end align-items-center mb-0">
          <button
            type="submit"
            className={classNames(
              'btn btn-primary',
              { 'btn-spinner': isLoggingIn },
              { 'btn-cancelable': isLoggingIn }
            )}
            data-testid="btn-login"
          >
            {isLoggingIn && (
              <span>
                <LoadingSpinner className="loading-spinner-vertical-align" />
                <span className="btn-normal-content">Logging in</span>
                <span className="btn-hover-content">Cancel</span>
              </span>
            )}
            {!isLoggingIn && 'Login'}
          </button>
        </div>
      </div>
      <div className="flex-spacer">
        {errorMessage != null && (
          <p className="error-message mb-0" role="alert">{`${errorMessage}`}</p>
        )}
      </div>
    </form>
  );
}

export default LoginForm;
