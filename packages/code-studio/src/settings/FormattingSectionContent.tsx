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
import { Button, Checkbox } from '@deephaven/components';
import {
  DateTimeColumnFormatter,
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
  getFormatter,
  getTimeZone,
  getShowTimeZone,
  getShowTSeparator,
  getTruncateNumbersWithPound,
  getSettings,
  saveSettings as saveSettingsAction,
  RootState,
  WorkspaceSettings,
} from '@deephaven/redux';
import './FormattingSectionContent.scss';
import type { DebouncedFunc } from 'lodash';
import {
  focusFirstInputInContainer,
  isSameDecimalOptions,
  isSameIntegerOptions,
  isValidFormat,
  removeFormatRuleExtraProps,
  isFormatRuleValidForSave,
  ValidFormatterItem,
} from './SettingsUtils';
import type { FormatterItem, FormatOption } from './SettingsUtils';
import DateTimeOptions from './DateTimeOptions';
import TimeZoneOptions from './TimeZoneOptions';

const log = Log.module('FormattingSectionContent');

interface FormattingSectionContentProps {
  dh: DhType;
  formatter: FormatterItem[];
  defaultDateTimeFormat: string;
  showTimeZone: boolean;
  showTSeparator: boolean;
  timeZone: string;
  truncateNumbersWithPound: boolean;
  settings: WorkspaceSettings;
  saveSettings: (settings: WorkspaceSettings) => void;
  defaultDecimalFormatOptions: FormatOption;
  defaultIntegerFormatOptions: FormatOption;
  defaults: {
    defaultDateTimeFormat: string;
    defaultDecimalFormatOptions: FormatOption;
    defaultIntegerFormatOptions: FormatOption;
    showTimeZone: boolean;
    showTSeparator: boolean;
    timeZone: string;
  };
}

interface FormattingSectionContentState {
  formatSettings: FormatterItem[];
  showTimeZone: boolean;
  showTSeparator: boolean;
  timeZone: string;
  defaultDateTimeFormat: string;
  defaultDecimalFormatOptions: FormatOption;
  defaultIntegerFormatOptions: FormatOption;
  truncateNumbersWithPound: boolean;
  timestampAtMenuOpen: Date;
}

export class FormattingSectionContent extends PureComponent<
  FormattingSectionContentProps,
  FormattingSectionContentState
> {
  static defaultProps = {
    scrollTo: (): void => undefined,
    defaults: {
      defaultDateTimeFormat:
        DateTimeColumnFormatter.DEFAULT_DATETIME_FORMAT_STRING,
      defaultDecimalFormatOptions: {
        defaultFormatString: DecimalColumnFormatter.DEFAULT_FORMAT_STRING,
      },
      defaultIntegerFormatOptions: {
        defaultFormatString: IntegerColumnFormatter.DEFAULT_FORMAT_STRING,
      },
      showTimeZone: false,
      showTSeparator: true,
      timeZone: DateTimeColumnFormatter.DEFAULT_TIME_ZONE_ID,
    },
  };

  static inputDebounceTime = 250;

  constructor(props: FormattingSectionContentProps) {
    super(props);

    this.debouncedCommitChanges = debounce(
      this.commitChanges.bind(this),
      FormattingSectionContent.inputDebounceTime
    );

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

    const {
      formatter,
      defaultDateTimeFormat,
      defaultDecimalFormatOptions,
      defaultIntegerFormatOptions,
      showTimeZone,
      showTSeparator,
      timeZone,
      truncateNumbersWithPound,
    } = props;

    const formatSettings = formatter.map((item, i) => ({
      ...item,
      id: i,
    }));

    this.containerRef = React.createRef();

    this.state = {
      formatSettings,
      showTimeZone,
      showTSeparator,
      timeZone,
      defaultDateTimeFormat,
      defaultDecimalFormatOptions,
      defaultIntegerFormatOptions,
      truncateNumbersWithPound,
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

  handleDefaultDateTimeFormatChange(
    event: ChangeEvent<HTMLSelectElement>
  ): void {
    log.debug('handleDefaultDateTimeFormatChange', event.target.value);
    this.setState(
      {
        defaultDateTimeFormat: event.target.value,
      },
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleDefaultDecimalFormatChange(event: ChangeEvent<HTMLInputElement>): void {
    log.debug('handleDefaultDecimalFormatChange', event.target.value);
    this.setState(
      {
        defaultDecimalFormatOptions: {
          defaultFormatString: event.target.value,
        },
      },
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleDefaultIntegerFormatChange(event: ChangeEvent<HTMLInputElement>): void {
    log.debug('handleDefaultIntegerFormatChange', event.target.value);
    this.setState(
      {
        defaultIntegerFormatOptions: {
          defaultFormatString: event.target.value,
        },
      },
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleShowTimeZoneChange(): void {
    this.setState(
      state => ({
        showTimeZone: !state.showTimeZone,
      }),
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleShowTSeparatorChange(): void {
    this.setState(
      state => ({
        showTSeparator: !state.showTSeparator,
      }),
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleTimeZoneChange(event: ChangeEvent<HTMLSelectElement>): void {
    this.setState(
      {
        timeZone: event.target.value,
      },
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleResetDateTimeFormat(): void {
    const { defaults } = this.props;
    const { defaultDateTimeFormat, showTimeZone, showTSeparator } = defaults;
    log.debug('handleResetDateTimeFormat');
    this.setState(
      {
        defaultDateTimeFormat,
        showTimeZone,
        showTSeparator,
      },
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleResetTimeZone(): void {
    const { defaults } = this.props;
    const { timeZone } = defaults;
    log.debug('handleResetTimeZone');
    this.setState(
      {
        timeZone,
      },
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleResetDecimalFormat(): void {
    const { defaults } = this.props;
    const { defaultDecimalFormatOptions } = defaults;
    log.debug('handleResetDecimalFormat');
    this.setState(
      {
        defaultDecimalFormatOptions,
      },
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleResetIntegerFormat(): void {
    const { defaults } = this.props;
    const { defaultIntegerFormatOptions } = defaults;
    log.debug('handleResetIntegerFormat');
    this.setState(
      {
        defaultIntegerFormatOptions,
      },
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleTruncateNumbersWithPoundChange(): void {
    this.setState(
      state => ({
        truncateNumbersWithPound: !state.truncateNumbersWithPound,
      }),
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  commitChanges(): void {
    const {
      formatSettings,
      defaultDateTimeFormat,
      showTimeZone,
      showTSeparator,
      timeZone,
      defaultDecimalFormatOptions,
      defaultIntegerFormatOptions,
      truncateNumbersWithPound,
    } = this.state;
    const { dh } = this.props;

    const formatter =
      formatSettings
        .filter((format): format is ValidFormatterItem =>
          isFormatRuleValidForSave(dh, format)
        )
        .map(removeFormatRuleExtraProps) ?? [];

    const { settings, saveSettings } = this.props;
    const newSettings: WorkspaceSettings = {
      ...settings,
      formatter,
      defaultDateTimeFormat,
      showTimeZone,
      showTSeparator,
      timeZone,
      truncateNumbersWithPound,
    };
    if (
      isValidFormat(
        dh,
        TableUtils.dataType.DECIMAL,
        DecimalColumnFormatter.makeCustomFormat(
          defaultDecimalFormatOptions.defaultFormatString
        )
      )
    ) {
      newSettings.defaultDecimalFormatOptions = defaultDecimalFormatOptions;
    }
    if (
      isValidFormat(
        dh,
        TableUtils.dataType.INT,
        IntegerColumnFormatter.makeCustomFormat(
          defaultIntegerFormatOptions.defaultFormatString
        )
      )
    ) {
      newSettings.defaultIntegerFormatOptions = defaultIntegerFormatOptions;
    }
    saveSettings(newSettings);
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
              <select
                className="custom-select"
                value={timeZone}
                onChange={this.handleTimeZoneChange}
                id="select-reset-timezone"
              >
                <TimeZoneOptions />
              </select>
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
              <select
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
              </select>
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
          <div className="form-row mb-3">
            <div className="offset-3 col-9">
              <Checkbox
                checked={truncateNumbersWithPound ?? null}
                onChange={this.handleTruncateNumbersWithPoundChange}
              >
                Truncate numbers with #
              </Checkbox>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState) => ({
  formatter: getFormatter(state),
  defaultDateTimeFormat: getDefaultDateTimeFormat(state),
  defaultDecimalFormatOptions: getDefaultDecimalFormatOptions(state),
  defaultIntegerFormatOptions: getDefaultIntegerFormatOptions(state),
  dh: getApi(state),
  showTimeZone: getShowTimeZone(state),
  showTSeparator: getShowTSeparator(state),
  truncateNumbersWithPound: getTruncateNumbersWithPound(state),
  timeZone: getTimeZone(state),
  settings: getSettings(state),
});

const ConnectedFormattingSectionContent = connect(mapStateToProps, {
  saveSettings: saveSettingsAction,
})(FormattingSectionContent);

export default ConnectedFormattingSectionContent;
