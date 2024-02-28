import React, {
  ChangeEvent,
  PureComponent,
  ReactElement,
  RefObject,
} from 'react';
import { connect } from 'react-redux';
import { vsRefresh } from '@deephaven/icons';
import memoize from 'memoizee';
import debounce from 'lodash.debounce';
import classNames from 'classnames';
import { Button, Checkbox, Select } from '@deephaven/components';
import {
  IntegerColumnFormatter,
  DecimalColumnFormatter,
  TableUtils,
} from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import {
  getApi,
  getDefaultDateTimeFormat,
  getDefaultDecimalFormatOptions,
  getDefaultIntegerFormatOptions,
  getTimeZone,
  getShowTimeZone,
  getShowTSeparator,
  getTruncateNumbersWithPound,
  getShowEmptyStrings,
  getShowNullStrings,
  updateSettings as updateSettingsAction,
  RootState,
  WorkspaceSettings,
  getDefaultSettings,
} from '@deephaven/redux';
import './FormattingSectionContent.scss';
import type { DebouncedFunc } from 'lodash';
import {
  focusFirstInputInContainer,
  isSameDecimalOptions,
  isSameIntegerOptions,
  isValidFormat,
} from './SettingsUtils';
import type { FormatOption } from './SettingsUtils';
import DateTimeOptions from './DateTimeOptions';
import TimeZoneOptions from './TimeZoneOptions';

const log = Log.module('FormattingSectionContent');

interface FormattingSectionContentProps {
  dh: typeof DhType;
  defaultDateTimeFormat: string;
  showTimeZone: boolean;
  showTSeparator: boolean;
  timeZone: string;
  truncateNumbersWithPound: boolean;
  showEmptyStrings: boolean;
  showNullStrings: boolean;
  updateSettings: (settings: Partial<WorkspaceSettings>) => void;
  defaultDecimalFormatOptions: FormatOption;
  defaultIntegerFormatOptions: FormatOption;
  defaults: WorkspaceSettings;
}

interface FormattingSectionContentState {
  showTimeZone: boolean;
  showTSeparator: boolean;
  timeZone: string;
  defaultDateTimeFormat: string;
  defaultDecimalFormatOptions: FormatOption;
  defaultIntegerFormatOptions: FormatOption;
  truncateNumbersWithPound: boolean;
  showEmptyStrings: boolean;
  showNullStrings: boolean;
  timestampAtMenuOpen: Date;
}

export class FormattingSectionContent extends PureComponent<
  FormattingSectionContentProps,
  FormattingSectionContentState
> {
  static defaultProps = {
    scrollTo: (): void => undefined,
  };

  static inputDebounceTime = 250;

  constructor(props: FormattingSectionContentProps) {
    super(props);

    this.debouncedCommitChanges = debounce(
      this.commitChanges.bind(this),
      FormattingSectionContent.inputDebounceTime
    );
    this.queueUpdate = this.queueUpdate.bind(this);
    this.handleDefaultDateTimeFormatChange =
      this.handleDefaultDateTimeFormatChange.bind(this);
    this.handleDefaultDecimalFormatChange =
      this.handleDefaultDecimalFormatChange.bind(this);
    this.handleDefaultIntegerFormatChange =
      this.handleDefaultIntegerFormatChange.bind(this);
    this.handleShowTimeZoneChange = this.handleShowTimeZoneChange.bind(this);
    this.handleShowTSeparatorChange =
      this.handleShowTSeparatorChange.bind(this);
    this.handleTimeZoneChange = this.handleTimeZoneChange.bind(this);
    this.handleResetDateTimeFormat = this.handleResetDateTimeFormat.bind(this);
    this.handleResetDecimalFormat = this.handleResetDecimalFormat.bind(this);
    this.handleResetIntegerFormat = this.handleResetIntegerFormat.bind(this);
    this.handleResetTimeZone = this.handleResetTimeZone.bind(this);
    this.handleTruncateNumbersWithPoundChange =
      this.handleTruncateNumbersWithPoundChange.bind(this);
    this.handleShowEmptyStringsChange =
      this.handleShowEmptyStringsChange.bind(this);
    this.handleShowNullStringsChange =
      this.handleShowNullStringsChange.bind(this);

    const {
      defaultDateTimeFormat,
      defaultDecimalFormatOptions,
      defaultIntegerFormatOptions,
      showTimeZone,
      showTSeparator,
      timeZone,
      truncateNumbersWithPound,
      showEmptyStrings,
      showNullStrings,
    } = props;

    this.containerRef = React.createRef();
    this.pendingUpdates = [];

    this.state = {
      showTimeZone,
      showTSeparator,
      timeZone,
      defaultDateTimeFormat,
      defaultDecimalFormatOptions,
      defaultIntegerFormatOptions,
      truncateNumbersWithPound,
      showEmptyStrings,
      showNullStrings,
      timestampAtMenuOpen: new Date(),
    };
  }

  componentDidMount(): void {
    focusFirstInputInContainer(this.containerRef.current);
  }

  componentWillUnmount(): void {
    this.debouncedCommitChanges.flush();
  }

  debouncedCommitChanges: DebouncedFunc<() => void>;

  pendingUpdates: Partial<WorkspaceSettings>[];

  containerRef: RefObject<HTMLDivElement>;

  getCachedDateTimeFormatOptions = memoize(
    (
      timeZone: string,
      showTimeZone: boolean,
      showTSeparator: boolean,
      isGlobalOptions = false,
      legacyGlobalFormat?: string
    ) => {
      const { timestampAtMenuOpen } = this.state;
      return (
        <DateTimeOptions
          timestamp={timestampAtMenuOpen}
          timeZone={timeZone}
          showTimeZone={showTimeZone}
          showTSeparator={showTSeparator}
          isGlobalOptions={isGlobalOptions}
          legacyGlobalFormat={legacyGlobalFormat}
        />
      );
    }
  );

  queueUpdate(updates: Partial<WorkspaceSettings>): void {
    this.pendingUpdates.push(updates);
    this.debouncedCommitChanges();
  }

  handleDefaultDateTimeFormatChange(value: string): void {
    log.debug('handleDefaultDateTimeFormatChange', value);
    const update = {
      defaultDateTimeFormat: value,
    };
    this.setState(update);
    this.queueUpdate(update);
  }

  handleDefaultDecimalFormatChange(event: ChangeEvent<HTMLInputElement>): void {
    log.debug('handleDefaultDecimalFormatChange', event.target.value);
    const update = {
      defaultDecimalFormatOptions: {
        defaultFormatString: event.target.value,
      },
    };
    this.setState(update);
    if (
      isValidFormat(
        dh,
        TableUtils.dataType.DECIMAL,
        DecimalColumnFormatter.makeCustomFormat(event.target.value)
      )
    ) {
      this.queueUpdate(update);
    }
  }

  handleDefaultIntegerFormatChange(event: ChangeEvent<HTMLInputElement>): void {
    log.debug('handleDefaultIntegerFormatChange', event.target.value);
    const update = {
      defaultIntegerFormatOptions: {
        defaultFormatString: event.target.value,
      },
    };
    this.setState(update);
    if (
      isValidFormat(
        dh,
        TableUtils.dataType.INT,
        IntegerColumnFormatter.makeCustomFormat(event.target.value)
      )
    ) {
      this.queueUpdate(update);
    }
  }

  handleShowTimeZoneChange(): void {
    const { showTimeZone } = this.state;
    const update = { showTimeZone: !showTimeZone };
    this.setState(update);
    this.queueUpdate(update);
  }

  handleShowTSeparatorChange(): void {
    const { showTSeparator } = this.state;
    const update = { showTSeparator: !showTSeparator };
    this.setState(update);
    this.queueUpdate(update);
  }

  handleTimeZoneChange(value: string): void {
    const update = { timeZone: value };
    this.setState(update);
    this.queueUpdate(update);
  }

  handleResetDateTimeFormat(): void {
    const { defaults } = this.props;
    const { defaultDateTimeFormat, showTimeZone, showTSeparator } = defaults;
    log.debug('handleResetDateTimeFormat');
    this.setState({
      defaultDateTimeFormat,
      showTimeZone,
      showTSeparator,
    });
    this.queueUpdate({
      defaultDateTimeFormat: undefined,
      showTimeZone: undefined,
      showTSeparator: undefined,
    });
  }

  handleResetTimeZone(): void {
    const { defaults } = this.props;
    const { timeZone } = defaults;
    log.debug('handleResetTimeZone');
    this.setState({
      timeZone,
    });
    this.queueUpdate({
      timeZone: undefined,
    });
  }

  handleResetDecimalFormat(): void {
    const { defaults } = this.props;
    const { defaultDecimalFormatOptions } = defaults;
    log.debug('handleResetDecimalFormat');
    this.setState({
      defaultDecimalFormatOptions,
    });
    this.queueUpdate({
      defaultDecimalFormatOptions: undefined,
    });
  }

  handleResetIntegerFormat(): void {
    const { defaults } = this.props;
    const { defaultIntegerFormatOptions } = defaults;
    log.debug('handleResetIntegerFormat');
    this.setState({
      defaultIntegerFormatOptions,
    });
    this.queueUpdate({
      defaultIntegerFormatOptions: undefined,
    });
  }

  handleTruncateNumbersWithPoundChange(): void {
    const { truncateNumbersWithPound } = this.state;
    const update = {
      truncateNumbersWithPound: truncateNumbersWithPound !== true,
    };
    this.setState(update);
    this.queueUpdate(update);
  }

  handleShowEmptyStringsChange(): void {
    const { showEmptyStrings } = this.state;
    const update = {
      showEmptyStrings: !showEmptyStrings,
    };
    this.setState(update);
    this.queueUpdate(update);
  }

  handleShowNullStringsChange(): void {
    const { showNullStrings } = this.state;
    const update = {
      showNullStrings: !showNullStrings,
    };
    this.setState(update);
    this.queueUpdate(update);
  }

  commitChanges(): void {
    const { updateSettings } = this.props;
    const updates = this.pendingUpdates.reduce(
      (acc, update) => ({
        ...acc,
        ...update,
      }),
      {}
    );
    this.pendingUpdates = [];

    updateSettings(updates);
  }

  render(): ReactElement {
    const { defaults, dh } = this.props;
    const {
      defaultDateTimeFormat,
      defaultDecimalFormatOptions,
      defaultIntegerFormatOptions,
      timeZone,
      showTimeZone,
      showTSeparator,
      truncateNumbersWithPound,
      showEmptyStrings,
      showNullStrings,
    } = this.state;

    const {
      defaultFormatString:
        defaultDecimalFormatString = DecimalColumnFormatter.DEFAULT_FORMAT_STRING,
    } = defaultDecimalFormatOptions ?? {};
    const {
      defaultFormatString:
        defaultIntegerFormatString = IntegerColumnFormatter.DEFAULT_FORMAT_STRING,
    } = defaultIntegerFormatOptions ?? {};

    const isTimeZoneDefault = timeZone === defaults.timeZone;
    const isDateTimeOptionsDefault =
      showTSeparator === defaults.showTSeparator &&
      showTimeZone === defaults.showTimeZone &&
      defaultDateTimeFormat === defaults.defaultDateTimeFormat;
    const isDecimalOptionsDefault = isSameDecimalOptions(
      defaultDecimalFormatOptions,
      defaults.defaultDecimalFormatOptions
    );
    const isIntegerOptionsDefault = isSameIntegerOptions(
      defaultIntegerFormatOptions,
      defaults.defaultIntegerFormatOptions
    );

    return (
      <div className="app-settings-formatting-section" ref={this.containerRef}>
        <div className="container-fluid p-0">
          <div className="app-settings-menu-description mb-3">
            Choose the default formatting rule to apply to all table columns
            based on their type.
          </div>
          <div className="form-row mb-2">
            <label
              className="col-form-label col-3"
              htmlFor="select-reset-timezone"
            >
              Time zone
            </label>
            <div className="col pr-0">
              <Select
                className="custom-select"
                value={timeZone}
                onChange={this.handleTimeZoneChange}
                id="select-reset-timezone"
              >
                <TimeZoneOptions />
              </Select>
            </div>
            <div className="col-1 btn-col">
              <Button
                kind="ghost"
                icon={vsRefresh}
                onClick={this.handleResetTimeZone}
                tooltip="Reset Time Zone"
                className={classNames('btn-reset', 'btn-reset-time-zone', {
                  hidden: isTimeZoneDefault,
                })}
              />
            </div>
          </div>
          <div className="form-row mb-2">
            <label
              className="col-form-label col-3"
              htmlFor="select-default-time-format"
            >
              DateTime
            </label>
            <div className="col pr-0">
              <Select
                className="custom-select"
                value={defaultDateTimeFormat}
                onChange={this.handleDefaultDateTimeFormatChange}
                id="select-default-time-format"
              >
                {this.getCachedDateTimeFormatOptions(
                  timeZone,
                  showTimeZone,
                  showTSeparator,
                  true,
                  defaultDateTimeFormat
                )}
              </Select>
            </div>
            <div className="col-1 btn-col">
              <Button
                kind="ghost"
                icon={vsRefresh}
                onClick={this.handleResetDateTimeFormat}
                tooltip="Reset DateTime Options"
                className={classNames('btn-reset', 'btn-reset-date-time', {
                  hidden: isDateTimeOptionsDefault,
                })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="offset-3 col-9">
              <Checkbox
                checked={showTimeZone ?? null}
                onChange={this.handleShowTimeZoneChange}
              >
                Show time zone in dates
              </Checkbox>
            </div>
          </div>

          <div className="form-row mb-3">
            <div className="offset-3 col-9">
              <Checkbox
                checked={showTSeparator ?? null}
                onChange={this.handleShowTSeparatorChange}
              >
                Show &#39;T&#39; separator
              </Checkbox>
            </div>
          </div>
          <div className="form-row mb-2">
            <label
              className="col-form-label col-3"
              htmlFor="default-decimal-format-input"
            >
              Decimal
            </label>
            <div className="col pr-0">
              <input
                className={classNames(
                  'form-control',
                  'flex-grow-1',
                  'default-decimal-format-input',
                  {
                    'is-invalid': !isValidFormat(
                      dh,
                      TableUtils.dataType.DECIMAL,
                      DecimalColumnFormatter.makeCustomFormat(
                        defaultDecimalFormatString
                      )
                    ),
                  }
                )}
                data-lpignore
                placeholder={DecimalColumnFormatter.DEFAULT_FORMAT_STRING}
                type="text"
                id="default-decimal-format-input"
                value={defaultDecimalFormatString}
                onChange={this.handleDefaultDecimalFormatChange}
              />
            </div>
            <div className="col-1 btn-col">
              <Button
                kind="ghost"
                icon={vsRefresh}
                onClick={this.handleResetDecimalFormat}
                tooltip="Reset Decimal Formatting"
                className={classNames('btn-reset', 'btn-reset-decimal', {
                  hidden: isDecimalOptionsDefault,
                })}
                data-testid="btn-reset-decimal"
              />
            </div>
          </div>
          <div className="form-row mb-2">
            <label
              className="col-form-label col-3"
              htmlFor="default-integer-format-input"
            >
              Integer
            </label>
            <div className="col pr-0">
              <input
                className={classNames(
                  'form-control',
                  'flex-grow-1',
                  'default-integer-format-input',
                  {
                    'is-invalid': !isValidFormat(
                      dh,
                      TableUtils.dataType.INT,
                      IntegerColumnFormatter.makeCustomFormat(
                        defaultIntegerFormatString
                      )
                    ),
                  }
                )}
                data-lpignore
                placeholder={IntegerColumnFormatter.DEFAULT_FORMAT_STRING}
                type="text"
                id="default-integer-format-input"
                value={defaultIntegerFormatString}
                onChange={this.handleDefaultIntegerFormatChange}
              />
            </div>
            <div className="col-1 btn-col">
              <Button
                kind="ghost"
                icon={vsRefresh}
                onClick={this.handleResetIntegerFormat}
                tooltip="Reset Integer Formatting"
                className={classNames('btn-reset', 'btn-reset-integer', {
                  hidden: isIntegerOptionsDefault,
                })}
                data-testid="btn-reset-integer"
              />
            </div>
          </div>
          <div className="form-row mb-2">
            <div className="offset-3 col-9">
              <Checkbox
                checked={truncateNumbersWithPound ?? null}
                onChange={this.handleTruncateNumbersWithPoundChange}
              >
                Show truncated numbers as ###
              </Checkbox>
            </div>
          </div>

          <div className="form-row mb-3">
            <label
              className="col-form-label col-3"
              htmlFor="default-integer-format-input"
            >
              String
            </label>
            <div className="col pr-0 pt-2">
              <Checkbox
                checked={showEmptyStrings ?? null}
                onChange={this.handleShowEmptyStringsChange}
              >
                Show empty strings as{' '}
                <span className="font-italic text-muted">empty</span>
              </Checkbox>
              <Checkbox
                checked={showNullStrings ?? null}
                onChange={this.handleShowNullStringsChange}
              >
                Show null strings as{' '}
                <span className="font-italic text-muted">null</span>
              </Checkbox>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (
  state: RootState
): Omit<FormattingSectionContentProps, 'updateSettings'> => ({
  defaultDateTimeFormat: getDefaultDateTimeFormat(state),
  defaultDecimalFormatOptions: getDefaultDecimalFormatOptions(state),
  defaultIntegerFormatOptions: getDefaultIntegerFormatOptions(state),
  dh: getApi(state),
  showTimeZone: getShowTimeZone(state),
  showTSeparator: getShowTSeparator(state),
  truncateNumbersWithPound: getTruncateNumbersWithPound(state),
  showEmptyStrings: getShowEmptyStrings(state),
  showNullStrings: getShowNullStrings(state),
  timeZone: getTimeZone(state),
  defaults: getDefaultSettings(state),
});

const ConnectedFormattingSectionContent = connect(mapStateToProps, {
  updateSettings: updateSettingsAction,
})(FormattingSectionContent);

export default ConnectedFormattingSectionContent;
