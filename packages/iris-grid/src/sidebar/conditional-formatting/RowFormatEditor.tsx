import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Log from '@deephaven/log';
import { ColorUtils } from '@deephaven/utils';
import { ComboBox } from '@deephaven/components';
import { TableUtils } from '../..';
import { ChangeCallback } from './ConditionalFormatEditor';
import {
  getLabelForStyleType,
  NumberCondition,
  StringCondition,
  DateCondition,
  FormatStyleType,
  getLabelForNumberCondition,
  getLabelForDateCondition,
  getLabelForStringCondition,
  getDefaultConditionForType,
  FormatStyleConfig,
  ModelColumn,
} from './ConditionalFormattingUtils';

const log = Log.module('RowFormatEditor');

// TODO: move to utils?
const DEFAULT_BACKGROUND = '#fcfcfa';

const DEFAULT_COLOR_LIGHT = '#f0f0ee';

const DEFAULT_COLOR_DARK = '#1a171a';

export interface RowFormatConfig {
  column: ModelColumn;
  condition: NumberCondition | StringCondition | DateCondition;
  value?: string | number;
  start?: number;
  end?: number;
  style: FormatStyleConfig;
}

export interface RowFormatEditorProps {
  columns: ModelColumn[];
  config?: RowFormatConfig;
  onChange?: ChangeCallback;
}

const DEFAULT_CALLBACK = () => undefined;

function makeDefaultConfig(columns: ModelColumn[]): RowFormatConfig {
  const { type, name } = columns[0];
  const column = { type, name };
  const condition = getDefaultConditionForType(type);
  const config = {
    column,
    condition,
    value: undefined,
    start: undefined,
    end: undefined,
    style: {
      type: FormatStyleType.NO_FORMATTING,
    },
  };
  return config;
}

const numberConditionOptions = [
  NumberCondition.IS_EQUAL,
  NumberCondition.IS_NOT_EQUAL,
  NumberCondition.IS_BETWEEN,
  NumberCondition.GREATER_THAN,
  NumberCondition.GREATER_THAN_OR_EQUAL,
  NumberCondition.LESS_THAN,
  NumberCondition.LESS_THAN_OR_EQUAL,
].map(option => (
  <option key={option} value={option}>
    {getLabelForNumberCondition(option)}
  </option>
));

const stringConditions = [
  StringCondition.IS_EXACTLY,
  StringCondition.IS_NOT_EXACTLY,
  StringCondition.CONTAINS,
  StringCondition.DOES_NOT_CONTAIN,
  StringCondition.STARTS_WITH,
  StringCondition.ENDS_WITH,
].map(option => (
  <option key={option} value={option}>
    {getLabelForStringCondition(option)}
  </option>
));

const dateConditions = [
  DateCondition.IS_EXACTLY,
  DateCondition.IS_NOT_EXACTLY,
  DateCondition.IS_BEFORE,
  DateCondition.IS_BEFORE_OR_EQUAL,
  DateCondition.IS_AFTER,
  DateCondition.IS_AFTER_OR_EQUAL,
].map(option => (
  <option key={option} value={option}>
    {getLabelForDateCondition(option)}
  </option>
));

const styleOptions = [
  FormatStyleType.NO_FORMATTING,
  FormatStyleType.POSITIVE,
  FormatStyleType.NEGATIVE,
  FormatStyleType.WARN,
  FormatStyleType.NEUTRAL,
  FormatStyleType.ACCENT_1,
  FormatStyleType.ACCENT_2,
  FormatStyleType.CUSTOM,
].map(option => (
  <option key={option} value={option}>
    {getLabelForStyleType(option)}
  </option>
));

const RowFormatEditor = (props: RowFormatEditorProps): JSX.Element => {
  const {
    columns,
    config = makeDefaultConfig(columns),
    onChange = DEFAULT_CALLBACK,
  } = props;

  const [selectedColumn, setColumn] = useState(
    columns.length > 0
      ? columns.find(
          c => c.name === config.column.name && c.type === config.column.type
        )
      : undefined
  );
  const selectedColumnType = selectedColumn?.type;
  const [selectedCondition, setCondition] = useState(config.condition);
  const [conditionValue, setConditionValue] = useState(config.value);
  const [startValue, setStartValue] = useState(config.start);
  const [endValue, setEndValue] = useState(config.end);
  const [selectedStyle, setStyle] = useState(config.style.type);
  const [selectedBackground, setBackground] = useState(
    config.style.customConfig?.background ?? DEFAULT_BACKGROUND
  );

  const conditions = useMemo(() => {
    if (selectedColumnType === undefined) {
      return [];
    }
    if (TableUtils.isNumberType(selectedColumnType)) {
      return numberConditionOptions;
    }
    if (TableUtils.isTextType(selectedColumnType)) {
      return stringConditions;
    }
    if (TableUtils.isDateType(selectedColumnType)) {
      return dateConditions;
    }
  }, [selectedColumnType]);

  const handleColumnChange = useCallback(
    value => {
      const newColumn = columns.find(({ name }) => name === value);
      if (newColumn && selectedColumnType !== newColumn.type) {
        log.debug('handleColumnChange', selectedColumnType, newColumn.type);
        setCondition(getDefaultConditionForType(newColumn.type));
        setConditionValue(undefined);
        setStartValue(undefined);
        setEndValue(undefined);
      }
      setColumn(newColumn);
    },
    [columns, selectedColumnType]
  );

  const handleConditionChange = useCallback(
    e => {
      const { value } = e.target;
      log.debug('handleConditionChange', value, selectedColumnType);
      setCondition(value);
    },
    [selectedColumnType]
  );

  const handleValueChange = useCallback(e => {
    const { value } = e.target;
    log.debug('handleValueChange', value);
    setConditionValue(value);
  }, []);

  const handleStartValueChange = useCallback(e => {
    const { value } = e.target;
    log.debug('handleStartValueChange', value);
    setStartValue(value);
  }, []);

  const handleEndValueChange = useCallback(e => {
    const { value } = e.target;
    log.debug('handleEndValueChange', value);
    setEndValue(value);
  }, []);

  const handleStyleChange = useCallback(e => {
    const { value } = e.target;
    log.debug('handleStyleChange', value);
    setStyle(value);
  }, []);

  const handleBackgroundChange = useCallback(e => {
    const { value } = e.target;
    log.debug('handleBackgroundChange', value);
    setBackground(value);
  }, []);

  useEffect(() => {
    // TODO: validation;
    if (selectedColumn === undefined) {
      log.error('Unable to create formatting rule. Column is not selected.');
      return;
    }

    if (selectedStyle === undefined) {
      log.error('Unable to create formatting rule. Style is not selected.');
      return;
    }

    if (selectedCondition === undefined) {
      log.error('Unable to create formatting rule. Condition is not selected.');
      return;
    }

    const { type, name } = selectedColumn;
    const column = { type, name };

    if (
      TableUtils.isNumberType(selectedColumn.type) &&
      ((Number.isNaN(Number(conditionValue)) &&
        selectedCondition !== NumberCondition.IS_BETWEEN) ||
        (selectedCondition === NumberCondition.IS_BETWEEN &&
          (Number.isNaN(Number(startValue)) || Number.isNaN(Number(endValue)))))
    ) {
      log.error(
        'Unable to create formatting rule. Invalid value',
        conditionValue
      );
      return;
    }
    onChange({
      column,
      condition: selectedCondition,
      style: {
        type: selectedStyle,
        customConfig: {
          color: ColorUtils.isDark(selectedBackground)
            ? DEFAULT_COLOR_LIGHT
            : DEFAULT_COLOR_DARK,
          background: selectedBackground,
        },
      },
      value: conditionValue,
      start: startValue,
      end: endValue,
    });
  }, [
    onChange,
    selectedBackground,
    selectedColumn,
    selectedStyle,
    selectedCondition,
    conditionValue,
    startValue,
    endValue,
  ]);

  const conditionInputs = useMemo(() => {
    if (
      selectedColumnType !== undefined &&
      TableUtils.isNumberType(selectedColumnType)
    ) {
      switch (selectedCondition) {
        case NumberCondition.IS_EQUAL:
        case NumberCondition.IS_NOT_EQUAL:
        case NumberCondition.GREATER_THAN:
        case NumberCondition.GREATER_THAN_OR_EQUAL:
        case NumberCondition.LESS_THAN:
        case NumberCondition.LESS_THAN_OR_EQUAL:
          return (
            <input
              type="text"
              className="form-control"
              placeholder="Enter value"
              value={conditionValue ?? ''}
              onChange={handleValueChange}
            />
          );
        case NumberCondition.IS_BETWEEN:
          return (
            <div className="d-flex flex-row">
              <input
                type="text"
                className="form-control d-flex mr-2"
                placeholder="Start value"
                value={startValue ?? ''}
                onChange={handleStartValueChange}
              />
              <input
                // TODO: fix this
                // move into a separate component that calls onChange with the updated config
                type="text"
                className="form-control d-flex"
                placeholder="End value"
                value={endValue ?? ''}
                onChange={handleEndValueChange}
              />
            </div>
          );
      }
    } else if (
      selectedColumnType !== undefined &&
      TableUtils.isTextType(selectedColumnType)
    ) {
      return (
        <input
          type="text"
          className="form-control"
          placeholder="Enter value"
          value={conditionValue ?? ''}
          onChange={handleValueChange}
        />
      );
    } else if (
      selectedColumnType !== undefined &&
      TableUtils.isDateType(selectedColumnType)
    ) {
      return (
        <input
          type="text"
          className="form-control"
          placeholder="Enter value"
          value={conditionValue ?? ''}
          onChange={handleValueChange}
        />
      );
    }
  }, [
    selectedColumnType,
    selectedCondition,
    conditionValue,
    startValue,
    endValue,
    handleValueChange,
    handleStartValueChange,
    handleEndValueChange,
  ]);

  const columnInputOptions = columns.map(({ name }) => ({
    title: name,
    value: name,
  }));

  return (
    <div className="conditional-rule-editor form">
      <div className="mb-2">
        <label className="mb-0">Format Row If</label>
        <ComboBox
          defaultValue={selectedColumn?.name}
          options={columnInputOptions}
          inputPlaceholder="Select a column"
          spellCheck={false}
          onChange={handleColumnChange}
          searchPlaceholder="Filter columns"
        />
      </div>

      {selectedColumn !== undefined && (
        <>
          <div className="mb-2">
            <select
              // TODO: separate condition editor as a component, one for each type?
              // Pass a callback with a completed condition string?
              value={selectedCondition}
              id="condition-select"
              className="custom-select mb-2"
              onChange={handleConditionChange}
            >
              {conditions}
            </select>
            {conditionInputs}
          </div>
          <div className="mb-2">
            <label className="mb-0" htmlFor="style-select">
              Style
            </label>
            <select
              value={selectedStyle}
              className="custom-select"
              id="style-select"
              onChange={handleStyleChange}
            >
              {styleOptions}
            </select>
          </div>

          {selectedStyle === FormatStyleType.CUSTOM && (
            <div className="mb-2">
              <label className="mb-0" htmlFor="color-select">
                Background
              </label>
              <input
                type="color"
                value={selectedBackground}
                className="custom-select"
                id="color-select"
                onChange={handleBackgroundChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RowFormatEditor;
