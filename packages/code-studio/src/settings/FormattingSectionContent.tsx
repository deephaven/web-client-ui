import React, {
  ChangeEvent,
  PureComponent,
  ReactElement,
  RefObject,
} from 'react';
import { connect } from 'react-redux';
import { dhNewCircleLargeFilled, vsRefresh, vsTrash } from '@deephaven/icons';
import memoize from 'memoizee';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import debounce from 'lodash.debounce';
import classNames from 'classnames';
import { Button, Checkbox, ThemeExport } from '@deephaven/components';
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
import { assertNotNull, DbNameValidator, TimeUtils } from '@deephaven/utils';
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
  scrollTo: (x: number, y: number) => void;
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
  formatRulesChanged: boolean;
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
    this.handleFormatRuleEntered = this.handleFormatRuleEntered.bind(this);
    this.handleFormatRuleChange = this.handleFormatRuleChange.bind(this);
    this.handleFormatRuleCreate = this.handleFormatRuleCreate.bind(this);
    this.handleFormatRuleDelete = this.handleFormatRuleDelete.bind(this);
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
    this.addFormatRuleButtonRef = React.createRef();

    this.lastFormatRuleIndex = formatSettings.length;

    this.state = {
      formatSettings,
      formatRulesChanged: false,
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

  addFormatRuleButtonRef: RefObject<HTMLButtonElement>;

  lastFormatRuleIndex: number;

  isDuplicateRule(rule: FormatterItem): boolean {
    const { formatSettings } = this.state;
    return (
      formatSettings.some(
        item =>
          item.id !== rule.id &&
          item.columnName === rule.columnName &&
          item.columnType === rule.columnType
      ) ?? false
    );
  }

  getAutoIncrementFormatRuleIndex(): number {
    const { lastFormatRuleIndex } = this;
    this.lastFormatRuleIndex += 1;
    return lastFormatRuleIndex;
  }

  getCachedColumnTypeOptions = memoize(() =>
    FormattingSectionContent.renderColumnTypeOptions()
  );

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

  handleFormatRuleChange(
    index: number,
    key: string,
    value: TableColumnFormat | string | boolean
  ): void {
    this.setState(
      state => {
        const { formatSettings: oldFormatSettings } = state;
        assertNotNull(oldFormatSettings);
        const formatSettings = [...oldFormatSettings];
        // Reset format string on type change
        let resetKeys = {};
        if (key === 'columnType') {
          resetKeys = {
            format: '',
          };
        }
        const newEntry = {
          ...formatSettings[index],
          ...resetKeys,
          [key]: value,
        };

        formatSettings[index] = newEntry;
        return {
          formatSettings,
        };
      },
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleFormatRuleCreate(): void {
    this.setState(state => {
      const { formatSettings } = state;
      const newFormat = {
        columnType: TableUtils.dataType.DATETIME,
        columnName: '',
        format: {},
        id: this.getAutoIncrementFormatRuleIndex(),
        isNewRule: true,
      };
      return {
        formatSettings:
          formatSettings != null ? [...formatSettings, newFormat] : [newFormat],
        formatRulesChanged: true,
      };
    });
  }

  handleFormatRuleDelete(index: number): void {
    this.setState(
      state => {
        const { formatSettings: oldFormatSettings } = state;
        const formatSettings = oldFormatSettings.filter(
          (item, i) => i !== index
        );
        return {
          formatSettings,
          formatRulesChanged: true,
        };
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

  handleFormatRuleEntered(elem: HTMLElement): void {
    this.scrollToFormatBlockBottom();
    FormattingSectionContent.focusFirstInputInContainer(elem);
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

  scrollToFormatBlockBottom(): void {
    const { scrollTo } = this.props;
    scrollTo(
      0,
      (this.addFormatRuleButtonRef.current?.offsetHeight ?? 0) +
        (this.addFormatRuleButtonRef.current?.offsetTop ?? 0)
    );
  }

  getRuleError(
    rule: FormatterItem
  ): { hasColumnNameError: boolean; hasFormatError: boolean; message: string } {
    const error = {
      hasColumnNameError: false,
      hasFormatError: false,
      message: '',
    };

    const errorMessages = [];

    if (rule.isNewRule !== undefined && rule.isNewRule) {
      return error;
    }

    if (this.isDuplicateRule(rule)) {
      error.hasColumnNameError = true;
      errorMessages.push('Duplicate column name/type combo.');
    }

    if (!FormattingSectionContent.isValidColumnName(rule.columnName)) {
      error.hasColumnNameError = true;
      errorMessages.push(
        'Column names must start with a letter or underscore and contain only alphanumeric characters or underscores.'
      );
    }

    if (
      rule.format.formatString !== undefined &&
      rule.format.formatString.length === 0
    ) {
      error.hasFormatError = true;
      errorMessages.push('Empty formatting rule.');
    } else if (
      !FormattingSectionContent.isValidFormat(rule.columnType, rule.format)
    ) {
      error.hasFormatError = true;
      errorMessages.push('Invalid formatting rule.');
    }

    error.message = errorMessages.join('\n');
    return error;
  }

  renderFormatRule(i: number, rule: FormatterItem): ReactElement {
    const columnNameId = `input-${i}-columnName`;
    const columnTypeId = `input-${i}-columnType`;
    const formatId = `input-${i}-format`;
    const columnTypeOptions = this.getCachedColumnTypeOptions();
    const onNameChange = (e: ChangeEvent<HTMLInputElement>) =>
      this.handleFormatRuleChange(i, 'columnName', e.target.value);
    const onNameBlur = () => this.handleFormatRuleChange(i, 'isNewRule', false);
    const onTypeChange = (e: ChangeEvent<HTMLSelectElement>) =>
      this.handleFormatRuleChange(i, 'columnType', e.target.value);
    const ruleError = this.getRuleError(rule);

    return (
      <fieldset key={i} className="container-fluid format-rule-container">
        <div className="form-row">
          <div className="form-group col-7 mb-2">
            <label htmlFor={columnNameId}>Column Name</label>
            <input
              id={columnNameId}
              className={classNames('form-control', {
                'is-invalid': ruleError.hasColumnNameError,
              })}
              data-lpignore
              type="text"
              value={rule.columnName}
              onChange={onNameChange}
              onBlur={onNameBlur}
            />
          </div>
          <div className="form-group col mb-2">
            <Button
              kind="ghost"
              className="btn-delete-format-rule float-right"
              tabIndex={-1}
              onClick={() => this.handleFormatRuleDelete(i)}
              icon={vsTrash}
              tooltip="Delete"
            />

            <label htmlFor={columnTypeId}>Column Type</label>
            <select
              id={columnTypeId}
              className="custom-select"
              value={rule.columnType}
              onChange={onTypeChange}
            >
              {columnTypeOptions}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group col-12 d-flex mb-2">
            <label
              className="flex-shrink-0 col-form-label mr-3"
              htmlFor={formatId}
            >
              Formatting Rule
            </label>
            {this.renderFormatRuleInput(
              i,
              rule.columnType,
              formatId,
              rule.format,
              ruleError.hasFormatError
            )}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group col-12 d-flex mb-2">
            {ruleError.message && (
              <p className="text-danger">{ruleError.message}</p>
            )}
          </div>
        </div>
      </fieldset>
    );
  }

  renderFormatRuleInput(
    i: number,
    columnType: string,
    formatId: string,
    format: Partial<TableColumnFormat>,
    isInvalid: boolean
  ): ReactElement | null {
    switch (TableUtils.getNormalizedType(columnType)) {
      case TableUtils.dataType.DATETIME:
        return this.renderDateTimeFormatRuleInput(
          i,
          formatId,
          format,
          isInvalid
        );
      case TableUtils.dataType.DECIMAL:
        return this.renderDecimalFormatRuleInput(
          i,
          formatId,
          format,
          isInvalid
        );
      case TableUtils.dataType.INT:
        return this.renderIntegerFormatRuleInput(
          i,
          formatId,
          format,
          isInvalid
        );
      default:
        return null;
    }
  }

  renderDateTimeFormatRuleInput(
    i: number,
    formatId: string,
    format: Partial<TableColumnFormat>,
    isInvalid: boolean
  ): ReactElement {
    const { showTimeZone, showTSeparator, timeZone } = this.state;
    const value = format.formatString ?? '';
    return (
      <select
        className={classNames('custom-select', { 'is-invalid': isInvalid })}
        value={value}
        id={formatId}
        onChange={e => {
          const selectedFormat = DateTimeColumnFormatter.makeFormat(
            '',
            e.target.value,
            DateTimeColumnFormatter.TYPE_GLOBAL
          );
          this.handleFormatRuleChange(i, 'format', selectedFormat);
        }}
      >
        <option key="default" value="" disabled>
          Select format
        </option>
        {this.getCachedDateTimeFormatOptions(
          timeZone,
          showTimeZone,
          showTSeparator
        )}
      </select>
    );
  }

  renderIntegerFormatRuleInput(
    i: number,
    formatId: string,
    format: Partial<TableColumnFormat>,
    isInvalid: boolean
  ): ReactElement {
    const value = format.formatString ?? '';
    return (
      <input
        className={classNames('form-control', 'flex-grow-1', {
          'is-invalid': isInvalid,
        })}
        data-lpignore
        id={formatId}
        placeholder={IntegerColumnFormatter.DEFAULT_FORMAT_STRING}
        type="text"
        value={value}
        onChange={e => {
          const selectedFormat = IntegerColumnFormatter.makeFormat(
            '',
            e.target.value,
            IntegerColumnFormatter.TYPE_GLOBAL,
            undefined
          );
          this.handleFormatRuleChange(i, 'format', selectedFormat);
        }}
      />
    );
  }

  renderDecimalFormatRuleInput(
    i: number,
    formatId: string,
    format: Partial<TableColumnFormat>,
    isInvalid: boolean
  ): ReactElement {
    const value = format.formatString ?? '';
    return (
      <input
        className={classNames('form-control', 'flex-grow-1', {
          'is-invalid': isInvalid,
        })}
        data-lpignore
        id={formatId}
        placeholder={DecimalColumnFormatter.DEFAULT_FORMAT_STRING}
        type="text"
        value={value}
        onChange={e => {
          const selectedFormat = DecimalColumnFormatter.makeFormat(
            '',
            e.target.value,
            DecimalColumnFormatter.TYPE_GLOBAL,
            undefined
          );
          this.handleFormatRuleChange(i, 'format', selectedFormat);
        }}
      />
    );
  }

  render(): ReactElement {
    const { defaults } = this.props;
    const {
      formatRulesChanged,
      formatSettings,
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

    const formatRules = formatSettings.map((rule, index) => (
      <CSSTransition
        key={rule.id}
        classNames="fade"
        timeout={ThemeExport.transitionMs}
        onEnter={this.handleFormatRuleEntered}
      >
        {this.renderFormatRule(index, rule)}
      </CSSTransition>
    ));

    const addNewRuleButton = (
      <Button
        kind="ghost"
        className="mb-3"
        onClick={this.handleFormatRuleCreate}
        ref={this.addFormatRuleButtonRef}
        icon={dhNewCircleLargeFilled}
      >
        Add New Rule
      </Button>
    );

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

        <div>Default formatting for matched column names</div>
        <div className="app-settings-menu-description mb-3">
          Applies a formatting rule to all columns that match a specified name
          and type.
        </div>

        <TransitionGroup
          appear={formatRulesChanged}
          enter={formatRulesChanged}
          exit={formatRulesChanged}
        >
          {formatRules}
        </TransitionGroup>

        {addNewRuleButton}
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
