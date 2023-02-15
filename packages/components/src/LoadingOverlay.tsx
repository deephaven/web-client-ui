import React from 'react';
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
  'data-testid'?: string;
};

/**
 * A loading overlay that handles displaying a loading spinner or an error message
 */
function LoadingOverlay({
  isLoaded = false,
  isLoading = true,
  errorMessage = null,
  'data-testid': dataTestId,
}: LoadingOverlayProps): JSX.Element {
  return (
    <CSSTransition
      in={Boolean(errorMessage) || !isLoaded || isLoading}
      timeout={ThemeExport.transitionMs}
      classNames={isLoaded ? 'fade' : ''}
      mountOnEnter
      unmountOnExit
    >
      <div className="fill-parent-absolute" data-testid={dataTestId}>
        <div
          className={classNames(
            'iris-panel-message-overlay',
            'fill-parent-absolute',
            { 'iris-panel-scrim-background': isLoaded }
          )}
        >
          <div className="message-content">
            <div className="message-icon">
              {isLoading && <LoadingSpinner />}
              {!isLoading && errorMessage != null && (
                <FontAwesomeIcon icon={vsWarning} />
              )}
            </div>
            <div className="message-text">{errorMessage}</div>
          </div>
        </div>
      </div>
    </CSSTransition>
  );
}

export default LoadingOverlay;
