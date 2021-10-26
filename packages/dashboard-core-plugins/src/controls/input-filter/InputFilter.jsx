/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
// background click is just a convience method, not an actual a11y issue

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { CardFlip } from '@deephaven/components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsGear } from '@deephaven/icons';
import { PropTypes as APIPropTypes } from '@deephaven/jsapi-shim';
import memoizee from 'memoizee';
import debounce from 'lodash.debounce';
import Log from '@deephaven/log';
import './InputFilter.scss';

const log = Log.module('InputFilter');
const UPDATE_DEBOUNCE = 150;

class InputFilter extends Component {
  static PLACEHOLDER = 'Enter value...';

  constructor(props) {
    super(props);

    this.handleColumnChange = this.handleColumnChange.bind(this);
    this.handleInputKeyPress = this.handleInputKeyPress.bind(this);
    this.handleValueChange = this.handleValueChange.bind(this);
    this.handleSettingsCancel = this.handleSettingsCancel.bind(this);
    this.handleSettingsClick = this.handleSettingsClick.bind(this);
    this.handleSettingsSave = this.handleSettingsSave.bind(this);
    this.handleBackgroundClick = this.handleBackgroundClick.bind(this);
    this.sendUpdate = debounce(this.sendUpdate.bind(this), UPDATE_DEBOUNCE);

    this.inputRef = React.createRef();

    const { column, isValueShown, value } = props;
    this.state = {
      column,
      selectedColumn: column,
      value,
      isValueShown,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const { column: propColumn } = this.props;
    const { column, value, isValueShown } = this.state;

    if (propColumn !== prevProps.column) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ column: propColumn, selectedColumn: propColumn });
    }

    if (isValueShown && isValueShown !== prevState.isValueShown) {
      this.focusInput();
    }

    if (
      column !== prevState.column ||
      value !== prevState.value ||
      isValueShown !== prevState.isValueShown
    ) {
      this.sendUpdate();
    }
  }

  componentWillUnmount() {
    this.sendUpdate.flush();
  }

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
    const { columns } = this.props;
    const { value } = event.target;
    const selectedColumn = columns[value];

    log.debug2('handleColumnChange', selectedColumn);

    this.setState({ selectedColumn, value: null });
  }

  handleInputKeyPress(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.setState(
        ({ value }) => (value == null ? { value: '' } : null),
        () => {
          this.sendUpdate();
          this.sendUpdate.flush();
        }
      );
    }
  }

  handleValueChange(event) {
    const { value } = event.target;

    log.debug2('handleValueChange', value);

    this.setState({ value });
  }

  handleSettingsCancel() {
    const { column } = this.state;
    this.setState({ selectedColumn: column, isValueShown: true });
  }

  handleSettingsSave() {
    const { selectedColumn } = this.state;
    this.setState({ column: selectedColumn, isValueShown: true });
  }

  handleSettingsClick(event) {
    const { column } = this.state;
    this.setState({ selectedColumn: column, isValueShown: false });
    event.stopPropagation();
  }

  handleBackgroundClick(event) {
    // allow clicking anywhere in the background to select and focus the input
    if (event.target !== this.inputRef.current) {
      this.focusInput();
    }
  }

  focusInput() {
    if (this.inputRef.current !== null) {
      this.inputRef.current.select();
      this.inputRef.current.focus();
    }
  }

  clearFilter() {
    this.setState({ value: '' });
  }

  setFilterState({ name, type, value, isValueShown }) {
    const column = name != null && type != null ? { name, type } : null;
    this.setState({ column, value, isValueShown });
  }

  sendUpdate() {
    const { onChange } = this.props;
    const { column, value, isValueShown } = this.state;
    onChange({ column, isValueShown, value });
  }

  render() {
    const { columns } = this.props;
    const { column, isValueShown, selectedColumn, value } = this.state;
    const inputLength =
      value == null || value.length === 0
        ? InputFilter.PLACEHOLDER.length
        : value.length;
    let titleLabel = null;
    if (column != null) {
      const columnIndex = columns.findIndex(
        item => item.name === column.name && item.type === column.type
      );
      titleLabel =
        columnIndex >= 0
          ? this.getItemLabel(columns, columnIndex)
          : column.name;
    }

    return (
      <CardFlip
        className="input-filter fill-parent-absolute"
        isFlipped={isValueShown}
      >
        <div className="input-filter-settings-card">
          <div className="input-filter-settings-content">
            <div className="input-filter-settings-grid">
              <label>Filter Column</label>
              <select
                value={columns.findIndex(
                  item =>
                    item.name === selectedColumn?.name &&
                    item.type === selectedColumn?.type
                )}
                className="custom-select"
                onChange={this.handleColumnChange}
              >
                {columns.map((columnItem, index) => (
                  <option
                    key={`${columnItem.name}/${columnItem.type}`}
                    value={index}
                  >
                    {this.getItemLabel(columns, index)}
                  </option>
                ))}
                {columns.length === 0 && (
                  <option value="-1" disabled>
                    No Available Columns
                  </option>
                )}
              </select>
              <div className="text-muted small">
                Input filter control will apply its filter to all columns
                matching this name in this dashboard.
              </div>
            </div>
            <div className="input-filter-settings-buttons">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={this.handleSettingsCancel}
                disabled={column == null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary ml-2"
                onClick={this.handleSettingsSave}
                disabled={selectedColumn == null}
              >
                Save
              </button>
            </div>
          </div>
        </div>

        <div
          className="input-filter-value-card"
          onClick={this.handleBackgroundClick}
        >
          <div className="input-filter-column">
            <div className="input-filter-column-title">{titleLabel} Filter</div>
          </div>
          <div className="d-flex justify-content-center align-items-center h-100 w-100">
            <div className="input-filter-value-input d-flex flex-column justify-content-center">
              <input
                type="text"
                ref={this.inputRef}
                placeholder={InputFilter.PLACEHOLDER}
                value={value ?? ''}
                onChange={this.handleValueChange}
                onKeyPress={this.handleInputKeyPress}
                style={{ width: `${inputLength + 3}ch` }}
                spellCheck="false"
              />
            </div>
          </div>
          <div className="input-filter-menu">
            <button
              type="button"
              className="btn btn-link btn-link-icon m-2 px-2"
              onClick={this.handleSettingsClick}
            >
              <FontAwesomeIcon icon={vsGear} transform="grow-4" />
            </button>
          </div>
        </div>
      </CardFlip>
    );
  }
}

InputFilter.propTypes = {
  columns: PropTypes.arrayOf(APIPropTypes.Column).isRequired,
  column: APIPropTypes.Column,
  isValueShown: PropTypes.bool,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

InputFilter.defaultProps = {
  column: null,
  isValueShown: false,
  value: null,
};

export default InputFilter;
