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
  Formatter,
  TableUtils,
  TableColumnFormat,
  FormattingRule,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import {
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
import { DbNameValidator, TimeUtils } from '@deephaven/utils';
import './FormattingSectionContent.scss';
import type { DebouncedFunc } from 'lodash';

const log = Log.module('FormattingSectionContent');

type FormatterItem = {
  columnType: string;
  columnName: string;
  format: Partial<TableColumnFormat>;
  id?: number;
  isNewRule?: boolean;
};

type FormatOption = {
  defaultFormatString?: string;
};

function isFormatStringFormat(
  format: Partial<TableColumnFormat>
): format is Pick<TableColumnFormat, 'formatString'> {
  return (
    (format as Pick<TableColumnFormat, 'formatString'>).formatString != null
  );
}

interface FormattingSectionContentProps {
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

  static focusFirstInputInContainer(container: HTMLElement | null): void {
    const input: HTMLElement | null | undefined = container?.querySelector(
      'input, select, textarea'
    );
    if (input) {
      input.focus();
    }
  }

  static isSameOptions(
    options1: FormatOption,
    options2: FormatOption
  ): boolean {
    return options1.defaultFormatString === options2.defaultFormatString;
  }

  static isSameDecimalOptions(
    options1: FormatOption,
    options2: FormatOption
  ): boolean {
    return FormattingSectionContent.isSameOptions(options1, options2);
  }

  static isSameIntegerOptions(
    options1: FormatOption,
    options2: FormatOption
  ): boolean {
    return FormattingSectionContent.isSameOptions(options1, options2);
  }

  static isValidColumnName(name: string): boolean {
    return name !== '' && DbNameValidator.isValidColumnName(name);
  }

  static isValidFormat(
    columnType: string,
    format: Partial<TableColumnFormat>
  ): boolean {
    // Undefined or empty string formats are always invalid
    if (
      !columnType ||
      format.formatString == null ||
      !isFormatStringFormat(format)
    ) {
      return false;
    }
    switch (columnType) {
      case 'datetime':
        return DateTimeColumnFormatter.isValid(format);
      case 'decimal':
        return DecimalColumnFormatter.isValid(format);
      case 'int':
        return IntegerColumnFormatter.isValid(format);
      default: {
        log.warn('Trying to validate format of unknown type');
        return true;
      }
    }
  }

  static removeFormatRuleExtraProps(
    item: FormatterItem
  ): Omit<FormatterItem, 'id' | 'isNewRule'> {
    const { id, isNewRule, ...rest } = item;
    return rest;
  }

  static isFormatRuleValidForSave(rule: FormatterItem): boolean {
    return (
      FormattingSectionContent.isValidColumnName(rule.columnName) &&
      FormattingSectionContent.isValidFormat(rule.columnType, rule.format)
    );
  }

  static renderTimeZoneOptions(): JSX.Element[] {
    const options = TimeUtils.TIME_ZONES.map(timeZone => {
      const { label, value } = timeZone;
      return (
        <option value={value} key={value}>
          {label}
        </option>
      );
    });

    return options;
  }

  static renderColumnTypeOptions(): ReactElement {
    const columnTypesArray = [
      { value: TableUtils.dataType.DATETIME, label: 'DateTime' },
      { value: TableUtils.dataType.DECIMAL, label: 'Decimal' },
      { value: TableUtils.dataType.INT, label: 'Integer' },
    ];

    const columnTypeOptions = columnTypesArray.map(item => (
      <option key={`key-columnType-${item.value}`} value={item.value}>
        {item.label}
      </option>
    ));

    return (
      <>
        <option key="key-columnType-placeholder" disabled value="">
          Select Type
        </option>
        {columnTypeOptions}
      </>
    );
  }

  static renderDateTimeOptions(
    timestamp: Date,
    timeZone: string,
    showTimeZone: boolean,
    showTSeparator: boolean,
    isGlobalOptions: boolean,
    legacyGlobalFormat?: string
  ): ReactElement[] {
    const formatter = new Formatter([], {
      timeZone,
      showTimeZone,
      showTSeparator,
    });
    const formats = isGlobalOptions
      ? DateTimeColumnFormatter.getGlobalFormats(showTimeZone, showTSeparator)
      : DateTimeColumnFormatter.getFormats(showTimeZone, showTSeparator);

    if (legacyGlobalFormat != null && !formats.includes(legacyGlobalFormat)) {
      formats.unshift(legacyGlobalFormat);
    }

    return formats.map(formatString => {
      const format = DateTimeColumnFormatter.makeFormat(
        '',
        formatString,
        DateTimeColumnFormatter.TYPE_GLOBAL
      );
      return (
        <option value={formatString} key={formatString}>
          {formatter.getFormattedString(
            timestamp,
            TableUtils.dataType.DATETIME,
            '',
            format
          )}
        </option>
      );
    });
  }

  constructor(props: FormattingSectionContentProps) {
    super(props);

    this.debouncedCommitChanges = debounce(
      this.commitChanges.bind(this),
      FormattingSectionContent.inputDebounceTime
    );

    this.handleDefaultDateTimeFormatChange = this.handleDefaultDateTimeFormatChange.bind(
      this
    );
    this.handleDefaultDecimalFormatChange = this.handleDefaultDecimalFormatChange.bind(
      this
    );
    this.handleDefaultIntegerFormatChange = this.handleDefaultIntegerFormatChange.bind(
      this
    );
    this.handleShowTimeZoneChange = this.handleShowTimeZoneChange.bind(this);
    this.handleShowTSeparatorChange = this.handleShowTSeparatorChange.bind(
      this
    );
    this.handleTimeZoneChange = this.handleTimeZoneChange.bind(this);
    this.handleResetDateTimeFormat = this.handleResetDateTimeFormat.bind(this);
    this.handleResetDecimalFormat = this.handleResetDecimalFormat.bind(this);
    this.handleResetIntegerFormat = this.handleResetIntegerFormat.bind(this);
    this.handleResetTimeZone = this.handleResetTimeZone.bind(this);
    this.handleTruncateNumbersWithPoundChange = this.handleTruncateNumbersWithPoundChange.bind(
      this
    );

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
    FormattingSectionContent.focusFirstInputInContainer(
      this.containerRef.current
    );
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
      return FormattingSectionContent.renderDateTimeOptions(
        timestampAtMenuOpen,
        timeZone,
        showTimeZone,
        showTSeparator,
        isGlobalOptions,
        legacyGlobalFormat
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

    const formatter =
      formatSettings
        .filter(FormattingSectionContent.isFormatRuleValidForSave)
        .map(FormattingSectionContent.removeFormatRuleExtraProps) ?? [];

    const { settings, saveSettings } = this.props;
    const newSettings: WorkspaceSettings = {
      ...settings,
      formatter: formatter as FormattingRule[],
      defaultDateTimeFormat,
      showTimeZone,
      showTSeparator,
      timeZone,
      truncateNumbersWithPound,
    };
    if (
      FormattingSectionContent.isValidFormat(
        TableUtils.dataType.DECIMAL,
        DecimalColumnFormatter.makeCustomFormat(
          defaultDecimalFormatOptions.defaultFormatString
        )
      )
    ) {
      newSettings.defaultDecimalFormatOptions = defaultDecimalFormatOptions;
    }
    if (
      FormattingSectionContent.isValidFormat(
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
    const { defaults } = this.props;
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
      defaultFormatString: defaultDecimalFormatString = DecimalColumnFormatter.DEFAULT_FORMAT_STRING,
    } = defaultDecimalFormatOptions ?? {};
    const {
      defaultFormatString: defaultIntegerFormatString = IntegerColumnFormatter.DEFAULT_FORMAT_STRING,
    } = defaultIntegerFormatOptions ?? {};

    const isTimeZoneDefault = timeZone === defaults.timeZone;
    const isDateTimeOptionsDefault =
      showTSeparator === defaults.showTSeparator &&
      showTimeZone === defaults.showTimeZone &&
      defaultDateTimeFormat === defaults.defaultDateTimeFormat;
    const isDecimalOptionsDefault = FormattingSectionContent.isSameDecimalOptions(
      defaultDecimalFormatOptions,
      defaults.defaultDecimalFormatOptions
    );
    const isIntegerOptionsDefault = FormattingSectionContent.isSameIntegerOptions(
      defaultIntegerFormatOptions,
      defaults.defaultIntegerFormatOptions
    );

    return (
      <div className="app-settings-formatting-section" ref={this.containerRef}>
        <div className="container-fluid p-0">
          <div>Default formatting for column types</div>
          <div className="app-settings-menu-description mb-3">
            Applies a formatting rule to all columns of a set type.
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
                {FormattingSectionContent.renderTimeZoneOptions()}
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
                    'is-invalid': !FormattingSectionContent.isValidFormat(
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
                    'is-invalid': !FormattingSectionContent.isValidFormat(
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
  showTimeZone: getShowTimeZone(state),
  showTSeparator: getShowTSeparator(state),
  truncateNumbersWithPound: getTruncateNumbersWithPound(state),
  timeZone: getTimeZone(state),
  settings: getSettings(state),
});

export default connect(mapStateToProps, { saveSettings: saveSettingsAction })(
  FormattingSectionContent
);
