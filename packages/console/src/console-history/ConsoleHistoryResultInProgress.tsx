import React, { Component, ReactElement } from 'react';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LoadingSpinner, Tooltip } from '@deephaven/components';
import { vsClose } from '@deephaven/icons';
import { TimeUtils } from '@deephaven/utils';
import './ConsoleHistoryResultInProgress.scss';

interface ConsoleHistoryResultInProgressProps {
  onCancelClick: () => void;
  disabled: boolean;
}

interface ConsoleHistoryResultInProgressState {
  elapsed: number;
}
/**
 * A spinner shown when a command is taking a while.
 */
class ConsoleHistoryResultInProgress extends Component<
  ConsoleHistoryResultInProgressProps,
  ConsoleHistoryResultInProgressState
> {
  static defaultProps = {
    disabled: false,
  };

  constructor(props: ConsoleHistoryResultInProgressProps) {
    super(props);

    this.updateElapsed = this.updateElapsed.bind(this);

    this.timer = null;
    this.startTime = Date.now();

    this.state = {
      elapsed: 0,
    };
  }

  componentDidMount(): void {
    this.timer = setInterval(this.updateElapsed, 1000);
  }

  componentWillUnmount(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = null;
  }

  timer: NodeJS.Timer | null;

  startTime: number;

  updateElapsed(): void {
    this.setState({
      elapsed: Math.round((Date.now() - this.startTime) / 1000),
    });
  }

  render(): ReactElement {
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

export default ConsoleHistoryResultInProgress;
