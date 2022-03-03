import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LoadingSpinner, Tooltip } from '@deephaven/components';
import { vsClose } from '@deephaven/icons';
import { TimeUtils } from '@deephaven/utils';
import './ConsoleHistoryResultInProgress.scss';

/**
 * A spinner shown when a command is taking a while.
 */
class ConsoleHistoryResultInProgress extends Component {
  constructor(props) {
    super(props);

    this.updateElapsed = this.updateElapsed.bind(this);

    this.timer = null;
    this.startTime = Date.now();

    this.state = {
      elapsed: 0,
    };
  }

  componentDidMount() {
    this.timer = setInterval(this.updateElapsed, 1000);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = null;
  }

  updateElapsed() {
    this.setState({
      elapsed: Math.round((Date.now() - this.startTime) / 1000),
    });
  }

  render() {
    const { disabled, onCancelClick } = this.props;
    const { elapsed } = this.state;
    return (
      <div
        className={classNames('console-history-result-in-progress', {
          disabled,
        })}
      >
        <span className="badge">
          <LoadingSpinner />
          &nbsp;Running... {TimeUtils.formatElapsedTime(elapsed)}&nbsp;
          <button type="button" onClick={onCancelClick} disabled={disabled}>
            <FontAwesomeIcon icon={vsClose} />
            <Tooltip>Cancel</Tooltip>
          </button>
        </span>
      </div>
    );
  }
}

ConsoleHistoryResultInProgress.propTypes = {
  onCancelClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ConsoleHistoryResultInProgress.defaultProps = {
  disabled: false,
};

export default ConsoleHistoryResultInProgress;
