import React from 'react';
import { CSSTransition } from 'react-transition-group';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsWarning } from '@deephaven/icons';
import ThemeExport from './ThemeExport';
import LoadingSpinner from './LoadingSpinner';
import './LoadingOverlay.scss';

/**
 * A loading overlay that handles displaying a loading spinner or an error message
 */
const LoadingOverlay = ({ isLoaded, isLoading, errorMessage }) => (
  <CSSTransition
    in={!!errorMessage || !isLoaded || isLoading}
    timeout={ThemeExport.transitionMs}
    classNames={isLoaded ? 'fade' : ''}
    mountOnEnter
    unmountOnExit
  >
    <div className="fill-parent-absolute">
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
            {!isLoading && errorMessage && <FontAwesomeIcon icon={vsWarning} />}
          </div>
          <div className="message-text">{errorMessage}</div>
        </div>
      </div>
    </div>
  </CSSTransition>
);

LoadingOverlay.propTypes = {
  errorMessage: PropTypes.string,
  isLoaded: PropTypes.bool,
  isLoading: PropTypes.bool,
};

LoadingOverlay.defaultProps = {
  isLoaded: false,
  isLoading: true,
  errorMessage: null,
};

export default LoadingOverlay;
