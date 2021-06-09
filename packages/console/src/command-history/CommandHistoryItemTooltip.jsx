import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import memoize from 'memoizee';
import { LoadingSpinner } from '@deephaven/components';
import { getCommandHistoryStorage } from '@deephaven/redux';
import { TimeUtils } from '@deephaven/utils';
import Code from '../common/Code';
import './CommandHistoryItemTooltip.scss';
import ConsolePropTypes from '../ConsolePropTypes';
import StoragePropTypes from '../StoragePropTypes';

const LOAD_DATA_DEBOUNCE = 250;
const MAX_NUMBER_OF_LINES = 2500;

export class CommandHistoryItemTooltip extends Component {
  static getTimeString(startTime, endTime) {
    if (!startTime || !endTime) {
      return null;
    }

    const deltaTime = Math.round(
      (new Date(endTime) - new Date(startTime)) / 1000
    );

    if (deltaTime < 1) return '<1s';

    return TimeUtils.formatElapsedTime(deltaTime);
  }

  constructor(props) {
    super(props);

    this.loadData = debounce(this.loadData.bind(this), LOAD_DATA_DEBOUNCE);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleTimeout = this.handleTimeout.bind(this);

    this.timer = null;
    this.cleanup = null;

    this.state = {
      currentTime: Date.now(),
      data: null,
      error: null,
    };
  }

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps, prevState) {
    const { data } = this.state;

    if (
      this.timer == null &&
      !data?.result &&
      data?.startTime &&
      !data?.endTime
    ) {
      this.startTimer();
    } else if (
      (data?.result && !prevState.data?.result) ||
      (data?.endTime && !prevState.data?.endTime)
    ) {
      // Command complete
      this.stopTimer();
    }
  }

  componentWillUnmount() {
    this.loadData.cancel();
    if (this.cleanup != null) {
      this.cleanup();
    }
    this.stopTimer();
  }

  loadData() {
    const { commandHistoryStorage, item, language } = this.props;
    const { id } = item;
    this.cleanup = commandHistoryStorage.listenItem(
      language,
      id,
      this.handleUpdate,
      this.handleError
    );
  }

  startTimer() {
    this.stopTimer();

    this.timer = setInterval(this.handleTimeout, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  updateTime() {
    this.setState({
      currentTime: Date.now(),
    });
  }

  handleError(error) {
    this.setState({ error: `${error}` });
  }

  handleUpdate(item) {
    const { data = null } = item ?? {};
    this.setState({ data });

    const { onUpdate } = this.props;
    onUpdate(data);
  }

  handleTimeout() {
    this.updateTime();
  }

  getPreviewText = memoize(
    name => name.split('\n', MAX_NUMBER_OF_LINES).join('\n'),
    { max: 1 }
  );

  render() {
    const {
      item: { name },
      language,
    } = this.props;
    const { currentTime, data, error } = this.state;
    const { result, startTime, endTime } = data ?? {};
    const errorMessage = result?.error?.message ?? result?.error ?? error;
    const timeString = CommandHistoryItemTooltip.getTimeString(
      startTime,
      endTime || currentTime
    );

    // colorizing in monaco is mostly a function of the number of lines,
    // it gets real slow after a few thousand lines. Truncate the tooltip
    // to avoid UI locks. The full command is still inserted.
    const previewText = this.getPreviewText(name);

    return (
      <div className="command-history-item-tooltip">
        <Code language={language}>{previewText}</Code>
        {previewText.length < name.length && <p>Preview Truncated...</p>}
        <div className="result-info">
          {!timeString && <LoadingSpinner />}
          {timeString && <div className="time-string">{timeString}</div>}
        </div>
        {errorMessage && (
          <>
            <hr />
            <div key="error" className="error-message">
              {errorMessage}
            </div>
          </>
        )}
      </div>
    );
  }
}

CommandHistoryItemTooltip.propTypes = {
  item: ConsolePropTypes.CommandHistoryItem.isRequired,
  language: PropTypes.string.isRequired,
  onUpdate: PropTypes.func,
  commandHistoryStorage: StoragePropTypes.CommandHistoryStorage.isRequired,
};

CommandHistoryItemTooltip.defaultProps = {
  onUpdate: () => {},
};

const mapStateToProps = state => ({
  commandHistoryStorage: getCommandHistoryStorage(state),
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(
  CommandHistoryItemTooltip
);
