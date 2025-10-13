import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsWarning } from '@deephaven/icons';
import ThemeExport from './ThemeExport';
import LoadingSpinner from './LoadingSpinner';
import './LoadingOverlay.scss';

type LoadingOverlayProps = {
  isLoaded?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  className?: string | null;
  scrimClassName?: string;
  timeout?: number | { enter?: number; exit?: number; appear?: number };
  'data-testid'?: string;
};

/**
 * A loading overlay that handles displaying a loading spinner or an error message
 */
function LoadingOverlay({
  isLoaded = false,
  isLoading = true,
  errorMessage = null,
  className = null,
  scrimClassName = 'iris-panel-scrim-background',
  timeout = ThemeExport.transitionMs,
  'data-testid': dataTestId,
}: LoadingOverlayProps): JSX.Element {
  const nodeRef = useRef<HTMLDivElement>(null);
  const messageTestId =
    dataTestId != null ? `${dataTestId}-message` : undefined;
  const spinnerTestId =
    dataTestId != null ? `${dataTestId}-spinner` : undefined;

  return (
    <CSSTransition
      in={Boolean(errorMessage) || !isLoaded || isLoading}
      timeout={timeout}
      classNames={classNames(className, { fade: isLoaded })}
      mountOnEnter
      unmountOnExit
      nodeRef={nodeRef}
    >
      <div
        ref={nodeRef}
        className="fill-parent-absolute"
        data-testid={dataTestId}
      >
        <div
          className={classNames(
            'iris-panel-message-overlay',
            'fill-parent-absolute',
            { [scrimClassName]: isLoaded }
          )}
        >
          <div className="message-content">
            <div className="message-icon">
              {isLoading && (
                <LoadingSpinner
                  className="loading-spinner-large"
                  data-testid={spinnerTestId}
                />
              )}
              {!isLoading && errorMessage != null && (
                <FontAwesomeIcon icon={vsWarning} />
              )}
            </div>
            {errorMessage != null && (
              <div className="message-text" data-testid={messageTestId}>
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </CSSTransition>
  );
}

export default LoadingOverlay;
