import React, { Component, ReactElement } from 'react';
import debounce from 'lodash.debounce';
import memoize from 'memoizee';
import { LoadingSpinner } from '@deephaven/components';
import { TimeUtils } from '@deephaven/utils';
import { StorageListenerRemover } from '@deephaven/storage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsWarning } from '@deephaven/icons';
import Code from '../common/Code';
import './CommandHistoryItemTooltip.scss';
import CommandHistoryStorage, {
  CommandHistoryStorageData,
  CommandHistoryStorageItem,
} from './CommandHistoryStorage';

interface CommandHistoryItemTooltipProps {
  item: CommandHistoryStorageItem;
  language: string;
  onUpdate?: (data: CommandHistoryStorageData | null) => void;
  commandHistoryStorage: CommandHistoryStorage;
}

interface CommandHistoryItemTooltipState {
  currentTime: number;
  data?: CommandHistoryStorageData;
  error?: string;
}

const LOAD_DATA_DEBOUNCE = 250;
const MAX_NUMBER_OF_LINES = 2500;

export class CommandHistoryItemTooltip extends Component<
  CommandHistoryItemTooltipProps,
  CommandHistoryItemTooltipState
> {
  static defaultProps = {
    onUpdate: (): void => undefined,
  };

  static getTimeString(
    startTime: string | undefined,
    endTime: string | number
  ): string | null {
    if (startTime == null || endTime === '' || endTime === 0) {
      return null;
    }

    const deltaTime = Math.round(
      (new Date(endTime).valueOf() - new Date(startTime).valueOf()) / 1000
    );

    if (deltaTime < 1) return '<1s';

    return TimeUtils.formatElapsedTime(deltaTime);
  }

  constructor(props: CommandHistoryItemTooltipProps) {
    super(props);

    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleTimeout = this.handleTimeout.bind(this);

    this.state = {
      currentTime: Date.now(),
    };
  }

  componentDidMount(): void {
    this.loadData();
  }

  componentDidUpdate(
    prevProps: CommandHistoryItemTooltipProps,
    prevState: CommandHistoryItemTooltipState
  ): void {
    const { data } = this.state;

    if (
      this.timer == null &&
      !data?.result &&
      Boolean(data?.startTime) &&
      !(data == null || data.endTime === undefined)
    ) {
      this.startTimer();
    } else if (
      (data?.result && !prevState.data?.result) ||
      (Boolean(data?.endTime) &&
        !(prevState.data == null || prevState.data.endTime === undefined))
    ) {
      // Command complete
      this.stopTimer();
    }
  }

  componentWillUnmount(): void {
    this.loadData.cancel();
    if (this.cleanup != null) {
      this.cleanup();
    }
    this.stopTimer();
  }

  timer?: NodeJS.Timer;

  cleanup?: StorageListenerRemover;

  loadData = debounce((): void => {
    const { commandHistoryStorage, item, language } = this.props;
    const { id } = item;
    this.cleanup = commandHistoryStorage.listenItem(
      language,
      id,
      this.handleUpdate,
      this.handleError
    );
  }, LOAD_DATA_DEBOUNCE);

  startTimer(): void {
    this.stopTimer();

    this.timer = setInterval(this.handleTimeout, 1000);
  }

  stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  updateTime(): void {
    this.setState({
      currentTime: Date.now(),
    });
  }

  handleError(error: string): void {
    this.setState({ error: `${error}` });
  }

  handleUpdate(item: CommandHistoryStorageItem): void {
    const { data } = item ?? {};
    this.setState({ data });

    const { onUpdate } = this.props;
    onUpdate?.(data);
  }

  handleTimeout(): void {
    this.updateTime();
  }

  getPreviewText = memoize(
    (name: string) => name.split('\n', MAX_NUMBER_OF_LINES).join('\n'),
    { max: 1 }
  );

  render(): ReactElement {
    const {
      item: { name },
      language,
    } = this.props;
    const { currentTime, data, error } = this.state;
    const { result, startTime, endTime } = data ?? {};

    const errorMessage = result?.error ?? error;

    const timeString = CommandHistoryItemTooltip.getTimeString(
      startTime,
      endTime ?? currentTime
    );

    // colorizing in monaco is mostly a function of the number of lines,
    // it gets real slow after a few thousand lines. Truncate the tooltip
    // to avoid UI locks. The full command is still inserted.
    const previewText = this.getPreviewText(name);

    const hasTimeString = Boolean(timeString);
    return (
      <div className="command-history-item-tooltip">
        <div className="scroll-container">
          <Code language={language}>{previewText}</Code>
          {previewText.length < name.length && <p>Preview Truncated...</p>}
        </div>
        <div className="result-info">
          <div className="d-flex justify-content-between">
            {Boolean(errorMessage) && (
              <div className="text-danger mr-1">
                <FontAwesomeIcon icon={vsWarning} /> Executed with errors
              </div>
            )}
            <div className="time-wrapper">
              Elapsed time:{' '}
              {hasTimeString ? (
                <span className="time-string">{timeString}</span>
              ) : (
                <LoadingSpinner />
              )}
            </div>
          </div>
          {Boolean(errorMessage) && (
            <div className="error-message">{errorMessage}</div>
          )}
        </div>
      </div>
    );
  }
}

export default CommandHistoryItemTooltip;
