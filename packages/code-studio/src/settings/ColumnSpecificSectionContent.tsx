import React, {
  ChangeEvent,
  PureComponent,
  ReactElement,
  RefObject,
} from 'react';
import { connect } from 'react-redux';
import { dhNewCircleLargeFilled, vsTrash } from '@deephaven/icons';
import memoize from 'memoizee';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import debounce from 'lodash.debounce';
import classNames from 'classnames';
import { Button, ThemeExport } from '@deephaven/components';
import {
  DateTimeColumnFormatter,
  IntegerColumnFormatter,
  DecimalColumnFormatter,
  TableUtils,
  TableColumnFormat,
  FormattingRule,
} from '@deephaven/jsapi-utils';
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
import { assertNotNull } from '@deephaven/utils';
import './FormattingSectionContent.scss';
import type { DebouncedFunc } from 'lodash';
import {
  focusFirstInputInContainer,
  isValidColumnName,
  isValidFormat,
  removeFormatRuleExtraProps,
  isFormatRuleValidForSave,
} from './SettingsUtils';
import type { FormatterItem, FormatOption } from './SettingsUtils';
import ColumnTypeOptions from './ColumnTypeOptions';
import DateTimeOptions from './DateTimeOptions';

export interface ColumnSpecificSectionContentProps {
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
}

interface ColumnSpecificSectionContentState {
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

export class ColumnSpecificSectionContent extends PureComponent<
  ColumnSpecificSectionContentProps,
  ColumnSpecificSectionContentState
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

  constructor(props: ColumnSpecificSectionContentProps) {
    super(props);

    this.debouncedCommitChanges = debounce(
      this.commitChanges.bind(this),
      ColumnSpecificSectionContent.inputDebounceTime
    );

    this.handleFormatRuleEntered = this.handleFormatRuleEntered.bind(this);
    this.handleFormatRuleChange = this.handleFormatRuleChange.bind(this);
    this.handleFormatRuleCreate = this.handleFormatRuleCreate.bind(this);
    this.handleFormatRuleDelete = this.handleFormatRuleDelete.bind(this);

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
    focusFirstInputInContainer(this.containerRef.current);
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

  getCachedColumnTypeOptions = memoize(() => <ColumnTypeOptions />);

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
        formatSettings: [...formatSettings, newFormat],
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

  handleFormatRuleEntered(elem: HTMLElement): void {
    this.scrollToFormatBlockBottom();
    focusFirstInputInContainer(elem);
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
        .filter(isFormatRuleValidForSave)
        .map(removeFormatRuleExtraProps) ?? [];

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
      isValidFormat(
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

    if (!isValidColumnName(rule.columnName)) {
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
    } else if (!isValidFormat(rule.columnType, rule.format)) {
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
              aria-label="Delete Format Rule"
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
        throw new Error(`Unrecognized column type: ${columnType}`);
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
    const { formatRulesChanged, formatSettings } = this.state;

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

    return (
      <div className="app-settings-formatting-section" ref={this.containerRef}>
        <div className="app-settings-menu-description mb-3">
          Customize the formatting of table columns by applying rules based on
          matching both a column name and column type.
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
  ColumnSpecificSectionContent
);
