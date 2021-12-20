import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhNewCircleLargeFilled, vsTrash } from '@deephaven/icons';
import memoize from 'memoizee';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import debounce from 'lodash.debounce';
import classNames from 'classnames';
import { Checkbox, ThemeExport } from '@deephaven/components';
import { Formatter, TableUtils } from '@deephaven/iris-grid';
import {
  DateTimeColumnFormatter,
  IntegerColumnFormatter,
  DecimalColumnFormatter,
} from '@deephaven/iris-grid/dist/formatters';
import Log from '@deephaven/log';
import {
  getDefaultDateTimeFormat,
  getFormatter,
  getTimeZone,
  getShowTimeZone,
  getShowTSeparator,
  getSettings,
  saveSettings as saveSettingsAction,
} from '@deephaven/redux';
import { DbNameValidator, TimeUtils } from '@deephaven/utils';

const log = Log.module('FormattingSectionContent');

export class FormattingSectionContent extends PureComponent {
  static inputDebounceTime = 250;

  static focusFirstInputInContainer(container) {
    const input = container.querySelector('input, select, textarea');
    if (input) {
      input.focus();
    }
  }

  static isValidColumnName(name) {
    return name && DbNameValidator.isValidColumnName(name);
  }

  static isValidFormat(columnType, format) {
    // Undefined or empty string formats are always invalid
    if (!columnType || !format.formatString) {
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

  static removeFormatRuleExtraProps(item) {
    const { id, isNewRule, ...rest } = item;
    return rest;
  }

  static isFormatRuleValidForSave(rule) {
    return (
      FormattingSectionContent.isValidColumnName(rule.columnName) &&
      FormattingSectionContent.isValidFormat(rule.columnType, rule.format)
    );
  }

  static renderTimeZoneOptions() {
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

  static renderColumnTypeOptions() {
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
    timestamp,
    timeZone,
    showTimeZone,
    showTSeparator,
    isGlobalOptions,
    legacyGlobalFormat
  ) {
    // TODO: Do we need the decimal/integer formatting settings here? Or no because it's just date/time anyway?
    const formatter = new Formatter([], {
      timeZone,
      showTimeZone,
      showTSeparator,
    });
    const formats = isGlobalOptions
      ? DateTimeColumnFormatter.getGlobalFormats(showTimeZone, showTSeparator)
      : DateTimeColumnFormatter.getFormats(showTimeZone, showTSeparator);

    if (legacyGlobalFormat && !formats.includes(legacyGlobalFormat)) {
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

  constructor(props) {
    super(props);

    this.debouncedCommitChanges = debounce(
      this.commitChanges.bind(this),
      FormattingSectionContent.inputDebounceTime
    );

    this.handleDefaultDateTimeFormatChange = this.handleDefaultDateTimeFormatChange.bind(
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

    this.containerRef = React.createRef();
    this.addFormatRuleButtonRef = React.createRef();

    this.lastFormatRuleIndex = 0;

    this.state = {
      formatSettings: [],
      formatRulesChanged: false,
      showTimeZone: true,
      showTSeparator: false,
      timeZone: '',
      defaultDateTimeFormat: '',
      timestampAtMenuOpen: new Date(),
    };
  }

  componentDidMount() {
    const {
      formatter,
      defaultDateTimeFormat,
      showTimeZone,
      showTSeparator,
      timeZone,
    } = this.props;

    this.setState(
      {
        formatSettings: formatter.map(item => ({
          ...item,
          id: this.getAutoIncrementFormatRuleIndex(),
        })),
        defaultDateTimeFormat,
        showTimeZone,
        showTSeparator,
        timeZone,
      },
      () => {
        FormattingSectionContent.focusFirstInputInContainer(
          this.containerRef.current
        );
      }
    );
  }

  componentWillUnmount() {
    this.debouncedCommitChanges.flush();
  }

  isDuplicateRule(rule) {
    const { formatSettings } = this.state;
    return formatSettings.some(
      item =>
        item.id !== rule.id &&
        item.columnName === rule.columnName &&
        item.columnType === rule.columnType
    );
  }

  getAutoIncrementFormatRuleIndex() {
    const { lastFormatRuleIndex } = this;
    this.lastFormatRuleIndex += 1;
    return lastFormatRuleIndex;
  }

  getCachedColumnTypeOptions = memoize(() =>
    FormattingSectionContent.renderColumnTypeOptions()
  );

  getCachedDateTimeFormatOptions = memoize(
    (
      timeZone,
      showTimeZone,
      showTSeparator,
      isGlobalOptions = false,
      legacyGlobalFormat = null
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

  handleDefaultDateTimeFormatChange(event) {
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

  handleFormatRuleChange(index, key, value) {
    this.setState(
      state => {
        const { formatSettings: oldFormatSettings } = state;
        const formatSettings = oldFormatSettings.concat();
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

  handleFormatRuleCreate() {
    this.setState(state => {
      const { formatSettings } = state;
      const newFormat = {
        columnType: TableUtils.dataType.DATETIME,
        columnName: '',
        format: '',
        id: this.getAutoIncrementFormatRuleIndex(),
        isNewRule: true,
      };
      return {
        formatSettings: [...formatSettings, newFormat],
        formatRulesChanged: true,
      };
    });
  }

  handleFormatRuleDelete(index) {
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

  handleShowTimeZoneChange() {
    this.setState(
      state => ({
        showTimeZone: !state.showTimeZone,
      }),
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleShowTSeparatorChange() {
    this.setState(
      state => ({
        showTSeparator: !state.showTSeparator,
      }),
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleTimeZoneChange(event) {
    this.setState(
      {
        timeZone: event.target.value,
      },
      () => {
        this.debouncedCommitChanges();
      }
    );
  }

  handleFormatRuleEntered(elem) {
    this.scrollToFormatBlockBottom();
    FormattingSectionContent.focusFirstInputInContainer(elem);
  }

  commitChanges() {
    const {
      formatSettings,
      defaultDateTimeFormat,
      showTimeZone,
      showTSeparator,
      timeZone,
    } = this.state;

    const formatter = formatSettings
      .filter(FormattingSectionContent.isFormatRuleValidForSave)
      .map(FormattingSectionContent.removeFormatRuleExtraProps);

    const { settings, saveSettings } = this.props;
    saveSettings({
      ...settings,
      formatter,
      defaultDateTimeFormat,
      showTimeZone,
      showTSeparator,
      timeZone,
    });
  }

  scrollToFormatBlockBottom() {
    const { scrollTo } = this.props;
    scrollTo(
      0,
      this.addFormatRuleButtonRef.current.offsetHeight +
        this.addFormatRuleButtonRef.current.offsetTop
    );
  }

  getRuleError(rule) {
    const error = {
      hasColumnNameError: false,
      hasFormatError: false,
      message: '',
    };

    const errorMessages = [];

    if (rule.isNewRule) {
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

    if (!rule.format) {
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

  renderFormatRule(i, rule) {
    const columnNameId = `input-${i}-columnName`;
    const columnTypeId = `input-${i}-columnType`;
    const formatId = `input-${i}-format`;
    const columnTypeOptions = this.getCachedColumnTypeOptions();
    const onNameChange = e =>
      this.handleFormatRuleChange(i, 'columnName', e.target.value);
    const onNameBlur = () => this.handleFormatRuleChange(i, 'isNewRule', false);
    const onTypeChange = e =>
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
            <button
              type="button"
              className="btn btn-link btn-link-icon btn-delete-format-rule float-right"
              tabIndex="-1"
              onClick={() => this.handleFormatRuleDelete(i)}
            >
              <FontAwesomeIcon icon={vsTrash} />
            </button>

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

  renderFormatRuleInput(i, columnType, formatId, format, isInvalid) {
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

  renderDateTimeFormatRuleInput(i, formatId, format, isInvalid) {
    const { showTimeZone, showTSeparator, timeZone } = this.state;
    const value = (format && format.formatString) || '';
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

  renderIntegerFormatRuleInput(i, formatId, format, isInvalid) {
    const value = (format && format.formatString) || '';
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
            null,
            IntegerColumnFormatter.TYPE_GLOBAL
          );
          this.handleFormatRuleChange(i, 'format', selectedFormat);
        }}
      />
    );
  }

  renderDecimalFormatRuleInput(i, formatId, format, isInvalid) {
    const value = (format && format.formatString) || '';
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
            null
          );
          this.handleFormatRuleChange(i, 'format', selectedFormat);
        }}
      />
    );
  }

  render() {
    const {
      formatRulesChanged,
      formatSettings,
      defaultDateTimeFormat,
      timeZone,
      showTimeZone,
      showTSeparator,
    } = this.state;

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
      <button
        type="button"
        className="btn btn-link mb-3"
        onClick={this.handleFormatRuleCreate}
        ref={this.addFormatRuleButtonRef}
      >
        <FontAwesomeIcon icon={dhNewCircleLargeFilled} />
        Add New Rule
      </button>
    );

    return (
      <div ref={this.containerRef}>
        <div className="container-fluid p-0">
          <div className="form-row mb-2">
            <label className="col-form-label col-3">Time zone</label>
            <div className="col-9">
              <select
                className="custom-select"
                value={timeZone}
                onChange={this.handleTimeZoneChange}
              >
                {FormattingSectionContent.renderTimeZoneOptions()}
              </select>
            </div>
          </div>
          <div className="form-row mb-2">
            {/* TODO: Add Decimal and Integer formatting here */}
            <label className="col-form-label col-3">DateTime</label>
            <div className="col-9">
              <select
                className="custom-select"
                value={defaultDateTimeFormat}
                onChange={this.handleDefaultDateTimeFormatChange}
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
          </div>

          <div className="form-row">
            <div className="offset-3 col-9">
              <Checkbox
                checked={showTimeZone}
                onChange={this.handleShowTimeZoneChange}
              >
                Show time zone in dates
              </Checkbox>
            </div>
          </div>

          <div className="form-row mb-3">
            <div className="offset-3 col-9">
              <Checkbox
                checked={showTSeparator}
                onChange={this.handleShowTSeparatorChange}
              >
                Show &#39;T&#39; separator
              </Checkbox>
            </div>
          </div>
        </div>

        <div>Default Formatting Rules</div>
        <div className="app-settings-menu-description mb-3">
          Applies a preset column formatting rule to all columns that match a
          set name and type
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

FormattingSectionContent.propTypes = {
  formatter: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  defaultDateTimeFormat: PropTypes.string.isRequired,
  showTimeZone: PropTypes.bool.isRequired,
  showTSeparator: PropTypes.bool.isRequired,
  timeZone: PropTypes.string.isRequired,
  settings: PropTypes.shape({}).isRequired,

  saveSettings: PropTypes.func.isRequired,
  scrollTo: PropTypes.func,
};

FormattingSectionContent.defaultProps = {
  scrollTo: () => {},
};

const mapStateToProps = state => ({
  formatter: getFormatter(state),
  defaultDateTimeFormat: getDefaultDateTimeFormat(state),
  showTimeZone: getShowTimeZone(state),
  showTSeparator: getShowTSeparator(state),
  timeZone: getTimeZone(state),
  settings: getSettings(state),
});

export default connect(mapStateToProps, { saveSettings: saveSettingsAction })(
  FormattingSectionContent
);
