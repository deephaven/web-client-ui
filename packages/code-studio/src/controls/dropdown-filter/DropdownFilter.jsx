/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
// background click is just a convenience method, not an actual a11y issue

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactCardFlip from 'react-card-flip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SocketedButton } from '@deephaven/components';
import { vsGear } from '@deephaven/icons';
import memoizee from 'memoizee';
import memoize from 'memoize-one';
import debounce from 'lodash.debounce';
import Log from '@deephaven/log';
import { IrisPropTypes, UIPropTypes } from '../../include/prop-types';
import TableUtils from '../../iris-grid/TableUtils';
import './DropdownFilter.scss';

const log = Log.module('DropdownFilter');
const UPDATE_DEBOUNCE = 150;

class DropdownFilter extends Component {
  static PLACEHOLDER = 'Select a value...';

  static SOURCE_BUTTON_CLASS_NAME = 'btn-dropdown-filter-selector';

  static SOURCE_BUTTON_PLACEHOLDER = 'Select a column';

  constructor(props) {
    super(props);

    this.handleColumnChange = this.handleColumnChange.bind(this);
    this.handleSettingsCancel = this.handleSettingsCancel.bind(this);
    this.handleSettingsClick = this.handleSettingsClick.bind(this);
    this.handleSettingsSave = this.handleSettingsSave.bind(this);
    this.handleBackgroundClick = this.handleBackgroundClick.bind(this);
    this.handleDropdownKeyPress = this.handleDropdownKeyPress.bind(this);
    this.handleValueChange = this.handleValueChange.bind(this);

    this.sendUpdate = debounce(this.sendUpdate.bind(this), UPDATE_DEBOUNCE);

    this.dropdownRef = React.createRef();

    const { column, isValueShown, value } = props;
    this.state = {
      column,
      selectedColumn: column,
      disableCancel: !isValueShown,
      isValueShown,
      value,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const { source, values, isLoaded } = this.props;
    const { column, value, isValueShown } = this.state;

    if (isLoaded) {
      if (source !== prevProps.source) {
        this.sourceUpdated();
      }

      if (
        values !== prevProps.values &&
        value !== '' &&
        !values.includes(value)
      ) {
        // Value list loaded, but doesn't contain the current value
        this.resetValue();
      }

      if (isValueShown !== prevState.isValueShown) {
        if (isValueShown) {
          this.focusInput();
        }
      }

      if (
        column !== prevState.column ||
        value !== prevState.value ||
        isValueShown !== prevState.isValueShown
      ) {
        this.sendUpdate();
      }
    }
  }

  componentWillUnmount() {
    this.sendUpdate.flush();
  }

  getCompatibleColumns = memoize((source, columns) =>
    source
      ? columns.filter(({ type }) =>
          TableUtils.isCompatibleType(type, source.columnType)
        )
      : []
  );

  getColumnOptions = memoize((columns, selectedColumn) => {
    let selectedIndex = -1;
    const options = [];
    options.push(
      <option key="placeholder" value="-1">
        Select a column
      </option>
    );
    columns.forEach((columnItem, index) => {
      options.push(
        <option key={`${columnItem.name}/${columnItem.type}`} value={index}>
          {this.getItemLabel(columns, index)}
        </option>
      );
      if (
        selectedColumn !== null &&
        columnItem.name === selectedColumn.name &&
        columnItem.type === selectedColumn.type
      ) {
        selectedIndex = index;
      }
    });
    return [options, selectedIndex];
  });

  getSelectedOptionIndex = memoize((values, value) => values.indexOf(value));

  getValueOptions = memoize(values => [
    <option value="-1" key="-1">
      {DropdownFilter.PLACEHOLDER}
    </option>,
    ...values.map((val, index) => (
      <option
        value={index}
        // eslint-disable-next-line react/no-array-index-key
        key={`${index}/${val}`}
      >
        {val}
      </option>
    )),
  ]);

  getItemLabel = memoizee((columns, index) => {
    const { name, type } = columns[index];

    if (
      (index > 0 && columns[index - 1].name === name) ||
      (index < columns.length - 1 && columns[index + 1].name === name)
    ) {
      const shortType = type.substring(type.lastIndexOf('.') + 1);
      return `${name} (${shortType})`;
    }

    return name;
  });

  handleColumnChange(event) {
    const { value } = event.target;
    log.debug2('handleColumnChange', value);
    if (value < 0) {
      this.setState({
        selectedColumn: null,
      });
      return;
    }
    const { columns: allColumns, source } = this.props;
    const columns = this.getCompatibleColumns(source, allColumns);
    this.setState({
      selectedColumn: columns[value],
    });
  }

  handleDropdownKeyPress(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      log.debug2('handleDropdownKeyPress');

      this.sendUpdate();
      this.sendUpdate.flush();
    }
  }

  handleValueChange(event) {
    const { value: valueIndex } = event.target;
    const index = parseInt(valueIndex, 10);
    // Default empty string value for 'clear filter'
    let value = '';
    const { values } = this.props;
    if (index === -1) {
      log.debug2('Selected default item');
    } else if (index >= 0 && index < values.length) {
      value = values[index];
    } else {
      log.error('Invalid index', index, values);
      return;
    }

    log.debug2('handleValueChange', value);

    this.setState({ value });
  }

  handleSettingsCancel() {
    this.setState(({ column }) => ({
      selectedColumn: column,
      isValueShown: true,
    }));
  }

  handleSettingsSave() {
    this.setState(({ column, selectedColumn, value }) => ({
      column: selectedColumn,
      // Reset value if column changed
      value: column === selectedColumn ? value : '',
      isValueShown: true,
      disableCancel: false,
    }));
  }

  handleSettingsClick(event) {
    event.stopPropagation();
    this.showSettings();
  }

  handleBackgroundClick(event) {
    // allow clicking anywhere in the background to select and focus the input
    if (event.target !== this.dropdownRef.current) {
      this.focusInput();
    }
  }

  handleMouseEnter() {
    const { onSourceMouseEnter } = this.props;
    onSourceMouseEnter();
  }

  handleMouseLeave() {
    const { onSourceMouseLeave } = this.props;
    onSourceMouseLeave();
  }

  sourceUpdated() {
    this.setState({
      column: null,
      selectedColumn: null,
      isValueShown: false,
      disableCancel: true,
      value: '',
    });
  }

  showSettings() {
    const { column } = this.state;
    this.setState({ selectedColumn: column, isValueShown: false });
  }

  focusInput() {
    if (this.dropdownRef.current !== null) {
      this.dropdownRef.current.focus();
    }
  }

  resetValue() {
    this.setState({ value: '' });
  }

  // Called by the parent component via ref
  clearFilter() {
    this.resetValue();
  }

  sendUpdate() {
    const { onChange } = this.props;
    const { column, value, isValueShown } = this.state;
    onChange({ column, isValueShown, value });
  }

  render() {
    const {
      columns: allColumns,
      disableLinking,
      isLinkerActive,
      isLoaded,
      source,
      onColumnSelected,
      onSourceMouseEnter,
      onSourceMouseLeave,
      values,
      settingsError,
    } = this.props;
    const {
      column,
      disableCancel,
      isValueShown,
      selectedColumn,
      value,
    } = this.state;
    const columnSelectionDisabled = source === null;
    const columns = this.getCompatibleColumns(source, allColumns);
    const isLinked = source != null;
    const sourceButtonLabel =
      source?.columnName ?? DropdownFilter.SOURCE_BUTTON_PLACEHOLDER;
    const filterTitle = column != null ? `${column.name} Filter` : null;
    const [columnOptions, selectedIndex] = this.getColumnOptions(
      columns,
      selectedColumn
    );
    const valueOptions = this.getValueOptions(values);
    const selectedOption = this.getSelectedOptionIndex(values, value);
    const disableSave = !isLinked || selectedColumn == null;

    return (
      <div className="dropdown-filter fill-parent-absolute">
        <ReactCardFlip
          isFlipped={isValueShown && !isLinkerActive}
          containerStyle={{ width: '100%', height: '100%' }}
        >
          <div
            className="dropdown-filter-settings-card fill-parent-absolute"
            key="front"
          >
            <div className="dropdown-filter-card-content">
              <div className="dropdown-filter-settings-grid">
                <label>Source Column</label>
                <SocketedButton
                  isLinked={isLinked}
                  onClick={onColumnSelected}
                  onMouseEnter={onSourceMouseEnter}
                  onMouseLeave={onSourceMouseLeave}
                  className={DropdownFilter.SOURCE_BUTTON_CLASS_NAME}
                  disabled={disableLinking}
                >
                  {sourceButtonLabel}
                </SocketedButton>

                <div className="text-muted small">
                  Select a source column for the list by linking to a table.
                </div>

                <label>Filter Column</label>
                <select
                  value={selectedIndex}
                  className="custom-select"
                  onChange={this.handleColumnChange}
                  disabled={columnSelectionDisabled}
                >
                  {columnOptions}
                </select>
                <div className="text-muted small">
                  Dropdown filter control will apply its filter to all columns
                  matching this name in this dashboard.
                </div>
              </div>

              {settingsError && (
                <div className="error-message text-center">{settingsError}</div>
              )}

              {isLinked && !isValueShown && !isLinkerActive && (
                <div className="form-row justify-content-end dropdown-filter-settings-buttons">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={this.handleSettingsCancel}
                    disabled={disableCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary ml-2"
                    onClick={this.handleSettingsSave}
                    disabled={disableSave}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
          <div
            className="dropdown-filter-value-card fill-parent-absolute"
            key="back"
            onClick={this.handleBackgroundClick}
          >
            {isLoaded && (
              <>
                <div className="dropdown-filter-column">
                  <div className="dropdown-filter-column-title">
                    {filterTitle}
                  </div>
                </div>
                <div className="dropdown-filter-card-content">
                  <div className="dropdown-filter-value-input d-flex flex-column justify-content-center">
                    <select
                      className="custom-select"
                      value={selectedOption}
                      ref={this.dropdownRef}
                      onChange={this.handleValueChange}
                      onKeyPress={this.handleDropdownKeyPress}
                    >
                      {valueOptions}
                    </select>
                  </div>
                  {settingsError && (
                    <div className="error-message mt-3 text-center">
                      {settingsError}
                    </div>
                  )}
                </div>
                <div className="dropdown-filter-menu">
                  <button
                    type="button"
                    className="btn btn-link btn-link-icon m-2 px-2"
                    onClick={this.handleSettingsClick}
                  >
                    <FontAwesomeIcon icon={vsGear} transform="grow-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </ReactCardFlip>
      </div>
    );
  }
}

DropdownFilter.propTypes = {
  column: IrisPropTypes.Column,
  columns: PropTypes.arrayOf(IrisPropTypes.Column).isRequired,
  onSourceMouseEnter: PropTypes.func,
  onSourceMouseLeave: PropTypes.func,
  disableLinking: PropTypes.bool,
  isLinkerActive: PropTypes.bool,
  isLoaded: PropTypes.bool,
  isValueShown: PropTypes.bool,
  settingsError: PropTypes.string,
  source: UIPropTypes.LinkPoint,
  value: PropTypes.string,
  values: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  onColumnSelected: PropTypes.func,
};

DropdownFilter.defaultProps = {
  column: null,
  disableLinking: false,
  isLinkerActive: false,
  isLoaded: false,
  isValueShown: false,

  settingsError: null,
  source: null,
  value: '',
  values: [],
  onColumnSelected: () => {},
  onSourceMouseEnter: () => {},
  onSourceMouseLeave: () => {},
};

export default DropdownFilter;
