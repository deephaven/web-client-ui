/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
// background click is just a convenience method, not an actual a11y issue

import React, {
  Component,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
  RefObject,
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  CardFlip,
  Select,
  SocketedButton,
} from '@deephaven/components';
import { vsGear } from '@deephaven/icons';
import type { Column } from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import memoizee from 'memoizee';
import memoize from 'memoize-one';
import debounce from 'lodash.debounce';
import shortid from 'shortid';
import Log from '@deephaven/log';
import './DropdownFilter.scss';
import { LinkPoint } from '../../linker/LinkerUtils';

const log = Log.module('DropdownFilter');
const UPDATE_DEBOUNCE = 150;

export interface DropdownFilterColumn {
  name: string;
  type: string;
}

export interface DropdownFilterProps {
  column: DropdownFilterColumn;
  columns: DropdownFilterColumn[];
  onSourceMouseEnter: () => void;
  onSourceMouseLeave: () => void;
  disableLinking: boolean;
  isLinkerActive: boolean;
  isLoaded: boolean;
  isValueShown: boolean;
  settingsError: string;
  source: LinkPoint;
  value: string | null;
  values: (string | null)[];
  onChange: (change: {
    column: Partial<Column> | null;
    isValueShown?: boolean;
    value?: string;
  }) => void;
  onColumnSelected: () => void;
}

interface DropdownFilterState {
  column: DropdownFilterColumn | null;
  selectedColumn: DropdownFilterColumn | null;
  disableCancel: boolean;
  isValueShown: boolean;
  value: string | null;
  id: string;
}

export class DropdownFilter extends Component<
  DropdownFilterProps,
  DropdownFilterState
> {
  static defaultProps = {
    column: null,
    disableLinking: false,
    isLinkerActive: false,
    isLoaded: false,
    isValueShown: false,

    settingsError: null,
    source: null,
    value: '',
    values: [],
    onColumnSelected: (): void => undefined,
    onSourceMouseEnter: (): void => undefined,
    onSourceMouseLeave: (): void => undefined,
  };

  static PLACEHOLDER = 'Select a value...';

  static SOURCE_BUTTON_CLASS_NAME = 'btn-dropdown-filter-selector';

  static SOURCE_BUTTON_PLACEHOLDER = 'Select a column';

  constructor(props: DropdownFilterProps) {
    super(props);

    this.handleColumnChange = this.handleColumnChange.bind(this);
    this.handleSettingsCancel = this.handleSettingsCancel.bind(this);
    this.handleSettingsClick = this.handleSettingsClick.bind(this);
    this.handleSettingsSave = this.handleSettingsSave.bind(this);
    this.handleBackgroundClick = this.handleBackgroundClick.bind(this);
    this.handleDropdownKeyPress = this.handleDropdownKeyPress.bind(this);
    this.handleValueChange = this.handleValueChange.bind(this);

    this.dropdownRef = React.createRef();

    const { column, isValueShown, value } = props;
    this.state = {
      column,
      id: shortid(),
      selectedColumn: column,
      disableCancel: !isValueShown,
      isValueShown,
      value,
    };
  }

  componentDidUpdate(
    prevProps: DropdownFilterProps,
    prevState: DropdownFilterState
  ): void {
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

  componentWillUnmount(): void {
    this.sendUpdate.flush();
  }

  dropdownRef: RefObject<HTMLSelectElement>;

  getCompatibleColumns = memoize(
    (source: LinkPoint, columns: DropdownFilterColumn[]) =>
      source != null
        ? columns.filter(
            ({ type }) =>
              type !== undefined &&
              TableUtils.isCompatibleType(type, source.columnType)
          )
        : []
  );

  getColumnOptions = memoize(
    (
      columns: DropdownFilterColumn[],
      selectedColumn: DropdownFilterColumn | null
    ): [JSX.Element[], number] => {
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
    }
  );

  getSelectedOptionIndex = memoize(
    (values: (string | null)[], value: string | null) => values.indexOf(value)
  );

  getValueOptions = memoize((values: (string | null)[]) => [
    <option value="-1" key="-1">
      {DropdownFilter.PLACEHOLDER}
    </option>,
    ...values.map((val, index) => (
      <option
        value={index}
        // eslint-disable-next-line react/no-array-index-key
        key={`${index}/${val}`}
      >
        {val ?? '(null)'}
      </option>
    )),
  ]);

  getItemLabel = memoizee((columns: DropdownFilterColumn[], index: number) => {
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

  handleColumnChange(eventTargetValue: string): void {
    const value = eventTargetValue;
    log.debug2('handleColumnChange', value);
    if (value != null && parseInt(value, 10) < 0) {
      this.setState({
        selectedColumn: null,
      });
      return;
    }
    const { columns: allColumns, source } = this.props;
    const columns = this.getCompatibleColumns(source, allColumns);
    this.setState({
      selectedColumn: columns[parseInt(value, 10)],
    });
  }

  handleDropdownKeyPress(event: KeyboardEvent<HTMLSelectElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      log.debug2('handleDropdownKeyPress');

      this.sendUpdate();
      this.sendUpdate.flush();
    }
  }

  handleValueChange(eventTargetValue: string): void {
    const valueIndex = eventTargetValue;
    const index = parseInt(valueIndex, 10);
    // Default empty string value for 'clear filter'
    let value: string | null = '';
    const { values } = this.props;
    if (index >= 0 && index < values.length) {
      value = values[index];
    } else {
      log.debug2('Selected default item');
    }

    log.debug2('handleValueChange', value);

    this.setState({ value });
  }

  handleSettingsCancel(): void {
    this.setState(({ column }) => ({
      selectedColumn: column,
      isValueShown: true,
    }));
  }

  handleSettingsSave(): void {
    this.setState(({ column, selectedColumn, value }) => ({
      column: selectedColumn,
      // Reset value if column changed
      value: column === selectedColumn ? value : '',
      isValueShown: true,
      disableCancel: false,
    }));
  }

  handleSettingsClick(event: MouseEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    this.showSettings();
  }

  handleBackgroundClick(event: MouseEvent<HTMLDivElement>): void {
    // allow clicking anywhere in the background to select and focus the input
    if (event.target !== this.dropdownRef.current) {
      this.focusInput();
    }
  }

  sourceUpdated(): void {
    this.setState({
      column: null,
      selectedColumn: null,
      isValueShown: false,
      disableCancel: true,
      value: '',
    });
  }

  showSettings(): void {
    const { column } = this.state;
    this.setState({ selectedColumn: column, isValueShown: false });
  }

  focusInput(): void {
    this.dropdownRef.current?.focus();
  }

  resetValue(): void {
    this.setState({ value: '' });
  }

  // Called by the parent component via ref
  clearFilter(): void {
    this.resetValue();
  }

  // Called by the parent component via ref
  setFilterState({
    name,
    type,
    value,
    isValueShown,
  }: {
    name?: string;
    type?: string;
    value?: string;
    isValueShown?: boolean;
  }): void {
    const column = name != null && type != null ? { name, type } : null;
    this.setState(({ value: oldValue, isValueShown: oldIsValueShown }) => ({
      column,
      value: value ?? oldValue,
      isValueShown: isValueShown ?? oldIsValueShown,
    }));
  }

  sendUpdate = debounce(() => {
    const { onChange } = this.props;
    const { column, value, isValueShown } = this.state;
    onChange({ column, isValueShown, value: value ?? undefined });
  }, UPDATE_DEBOUNCE);

  render(): ReactElement {
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
    const { column, disableCancel, id, isValueShown, selectedColumn, value } =
      this.state;
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

    const isFlipped = isValueShown && !isLinkerActive;

    const sourceColumnId = `source-column-btn-${id}`;
    const filterColumnId = `filter-column-select-${id}`;

    return (
      <CardFlip
        className="dropdown-filter fill-parent-absolute"
        isFlipped={isFlipped}
      >
        <div className="dropdown-filter-settings-card">
          <div className="dropdown-filter-card-content">
            <div className="dropdown-filter-settings-grid">
              <label htmlFor={sourceColumnId}>Source Column</label>
              <SocketedButton
                id={sourceColumnId}
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

              <label htmlFor={filterColumnId}>Filter Column</label>
              <Select
                id={filterColumnId}
                value={String(selectedIndex)}
                className="custom-select"
                onChange={this.handleColumnChange}
                disabled={columnSelectionDisabled}
              >
                {columnOptions}
              </Select>
              <div className="text-muted small">
                Dropdown filter control will apply its filter to all columns
                matching this name in this dashboard.
              </div>
            </div>
            {settingsError && (
              <div className="error-message text-center">{settingsError}</div>
            )}
            {isLinked && (
              <div className="dropdown-filter-settings-buttons">
                <Button
                  kind="secondary"
                  type="button"
                  onClick={this.handleSettingsCancel}
                  disabled={disableCancel || isValueShown || isLinkerActive}
                  tooltip={
                    isLinkerActive
                      ? 'Cancel disabled while linker open'
                      : undefined
                  }
                >
                  Cancel
                </Button>
                <Button
                  kind="primary"
                  type="button"
                  className="ml-2"
                  onClick={this.handleSettingsSave}
                  disabled={disableSave || isValueShown || isLinkerActive}
                  tooltip={
                    isLinkerActive
                      ? 'Save disabled while linker open'
                      : undefined
                  }
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>

        <div
          className="dropdown-filter-value-card"
          onClick={this.handleBackgroundClick}
          data-testid="dropdown-filter-value-background"
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
                  <Select
                    className="custom-select"
                    value={String(selectedOption)}
                    ref={this.dropdownRef}
                    onChange={this.handleValueChange}
                    onKeyDown={this.handleDropdownKeyPress}
                    title="Select Value"
                  >
                    {valueOptions}
                  </Select>
                </div>
                {settingsError && (
                  <div className="error-message mt-3 text-center">
                    {settingsError}
                  </div>
                )}
              </div>
              <div className="dropdown-filter-menu">
                <Button
                  kind="ghost"
                  className="m-2 px-2"
                  onClick={this.handleSettingsClick}
                  icon={<FontAwesomeIcon icon={vsGear} transform="grow-4" />}
                  tooltip="Dropdown Filter Settings"
                />
              </div>
            </>
          )}
        </div>
      </CardFlip>
    );
  }
}

export default DropdownFilter;
