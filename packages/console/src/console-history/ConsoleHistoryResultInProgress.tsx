import React, { Component, ReactElement } from 'react';
import classNames from 'classnames';
import { Button, LoadingSpinner } from '@deephaven/components';
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

    this.timer = undefined;
  }

  timer?: NodeJS.Timer;

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
          Running... {TimeUtils.formatElapsedTime(elapsed)}&nbsp;
          <Button
            className="console-history-result-in-progress-cancel"
            kind="ghost"
            icon={vsClose}
            tooltip="Cancel"
            onClick={onCancelClick}
            disabled={disabled}
          />
        </span>
      </div>
    );
  }
}

export default ConsoleHistoryResultInProgress;
