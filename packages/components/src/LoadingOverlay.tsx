import { CSSTransition } from 'react-transition-group';
import classNames from 'classnames';
import ThemeExport from './ThemeExport';
import LoadingSpinner from './LoadingSpinner';
import './LoadingOverlay.scss';
import ChartErrorOverlay from './ChartErrorOverlay';

type LoadingOverlayProps = {
  isLoaded?: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  clearError?: () => void;
  'data-testid'?: string;
};

/**
 * A loading overlay that handles displaying a loading spinner or an error message
 */
function LoadingOverlay({
  isLoaded = false,
  isLoading = true,
  errorMessage = null,
  clearError,
  'data-testid': dataTestId,
}: LoadingOverlayProps): JSX.Element {
  const spinnerTestId =
    dataTestId != null ? `${dataTestId}-spinner` : undefined;

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
              {isLoading && (
                <LoadingSpinner
                  className="loading-spinner-large"
                  data-testid={spinnerTestId}
                />
              )}
            </div>
            {errorMessage != null && (
              <ChartErrorOverlay
                errorMessage={errorMessage}
                clearError={clearError}
                data-testid={dataTestId}
              />
            )}
          </div>
        </div>
      </div>
    </CSSTransition>
  );
}

export default LoadingOverlay;
