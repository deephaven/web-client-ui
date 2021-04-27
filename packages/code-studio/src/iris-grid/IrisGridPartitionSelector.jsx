import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DropdownMenu, Tooltip } from '@deephaven/components';
import { vsTriangleDown, vsClose } from '@deephaven/icons';
import Log from '@deephaven/log';
import debounce from 'lodash.debounce';
import PartitionSelectorSearch from './PartitionSelectorSearch';
import './IrisGridPartitionSelector.scss';

const log = Log.module('IrisGridPartitionSelector');

const PARTITION_CHANGE_DEBOUNCE_MS = 250;

class IrisGridPartitionSelector extends Component {
  constructor(props) {
    super(props);

    this.debounceUpdate = debounce(
      this.debounceUpdate.bind(this),
      PARTITION_CHANGE_DEBOUNCE_MS
    );
    this.handleAppendClick = this.handleAppendClick.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleIgnoreClick = this.handleIgnoreClick.bind(this);
    this.handlePartitionChange = this.handlePartitionChange.bind(this);
    this.handlePartitionSelect = this.handlePartitionSelect.bind(this);
    this.handlePartitionListResized = this.handlePartitionListResized.bind(
      this
    );
    this.handleSearchOpened = this.handleSearchOpened.bind(this);
    this.handleSearchClosed = this.handleSearchClosed.bind(this);

    this.searchMenu = null;
    this.selectorSearch = null;

    const { partition } = props;
    this.state = {
      partition,
    };
  }

  componentWillUnmount() {
    this.debounceUpdate.cancel();
  }

  handleAppendClick() {
    log.debug2('handleAppendClick');

    const { onAppend } = this.props;
    const { partition } = this.state;
    onAppend(partition);
  }

  handleCloseClick() {
    log.debug2('handleCloseClick');

    this.sendDone();
  }

  handleIgnoreClick() {
    log.debug2('handleIgnoreClick');

    this.sendFetchAll();
  }

  handlePartitionChange(event) {
    log.debug2('handlePartitionChange');

    const { value: partition } = event.target;

    this.setState({ partition });

    this.debounceUpdate();
  }

  handlePartitionSelect(partition) {
    if (this.searchMenu) {
      this.searchMenu.closeMenu();
    }

    this.setState({ partition }, () => {
      this.sendUpdate();
    });
  }

  handlePartitionListResized() {
    if (this.searchMenu) {
      this.searchMenu.scheduleUpdate();
    }
  }

  handleSearchClosed() {
    // Reset the table filter so it's ready next time user opens search
    const { table } = this.props;
    table.applyFilter([]);
  }

  handleSearchOpened() {
    if (this.selectorSearch) {
      this.selectorSearch.focus();
    }
  }

  debounceUpdate() {
    this.sendUpdate();
  }

  sendDone() {
    this.debounceUpdate.flush();

    const { onDone } = this.props;
    onDone();
  }

  sendUpdate() {
    log.debug2('sendUpdate');

    const { onChange } = this.props;
    const { partition } = this.state;
    onChange(partition);
  }

  sendFetchAll() {
    log.debug2('sendFetchAll');

    this.debounceUpdate.cancel();

    const { onFetchAll } = this.props;
    onFetchAll();
  }

  render() {
    const { columnName, getFormattedString, onDone, table } = this.props;
    const { partition } = this.state;
    const partitionSelectorSearch = (
      <PartitionSelectorSearch
        key="search"
        getFormattedString={getFormattedString}
        table={table}
        onSelect={this.handlePartitionSelect}
        onListResized={this.handlePartitionListResized}
        ref={selectorSearch => {
          this.selectorSearch = selectorSearch;
        }}
      />
    );
    return (
      <div className="iris-grid-partition-selector">
        <div className="status-message">
          <span>Filtering &quot;{columnName}&quot; partition to</span>
        </div>
        <div className="input-group">
          <input
            type="text"
            value={partition}
            onChange={this.handlePartitionChange}
            className="form-control input-partition"
          />
          <div className="input-group-append">
            <button type="button" className="btn btn-outline-primary">
              <FontAwesomeIcon icon={vsTriangleDown} />
              <Tooltip>Partitions</Tooltip>
              <DropdownMenu
                ref={searchMenu => {
                  this.searchMenu = searchMenu;
                }}
                actions={[{ menuElement: partitionSelectorSearch }]}
                onMenuOpened={this.handleSearchOpened}
                onMenuClosed={this.handleSearchClosed}
              />
            </button>
          </div>
        </div>
        <div className="iris-grid-partition-selector-spacer" />
        <button
          type="button"
          className="btn btn-outline-primary btn-ignore"
          onClick={this.handleIgnoreClick}
        >
          Ignore &amp; Fetch All
        </button>
        <button
          type="button"
          className="btn btn-outline-primary btn-append"
          onClick={this.handleAppendClick}
        >
          Append Command
        </button>
        <button
          type="button"
          className="btn btn-link btn-link-icon btn-close"
          onClick={onDone}
        >
          <FontAwesomeIcon icon={vsClose} />
        </button>
      </div>
    );
  }
}

IrisGridPartitionSelector.propTypes = {
  getFormattedString: PropTypes.func.isRequired,
  table: PropTypes.shape({ applyFilter: PropTypes.func }).isRequired,
  columnName: PropTypes.string.isRequired,
  partition: PropTypes.string,
  onAppend: PropTypes.func,
  onChange: PropTypes.func,
  onFetchAll: PropTypes.func,
  onDone: PropTypes.func,
};

IrisGridPartitionSelector.defaultProps = {
  onAppend: () => {},
  onChange: () => {},
  onFetchAll: () => {},
  onDone: () => {},
  partition: '',
};

export default IrisGridPartitionSelector;
