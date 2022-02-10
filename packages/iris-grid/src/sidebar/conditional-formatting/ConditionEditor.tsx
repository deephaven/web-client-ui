import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Log from '@deephaven/log';
import TableUtils from '../../TableUtils';
import {
  StringCondition,
  DateCondition,
  getLabelForNumberCondition,
  getLabelForDateCondition,
  getLabelForStringCondition,
  NumberCondition,
  ModelColumn,
  ConditionConfig,
} from './ConditionalFormattingUtils';

const log = Log.module('ConditionEditor');

export interface ConditionEditorProps {
  column: ModelColumn;
  config: ConditionConfig;
  onChange?: (config: ConditionConfig, isValid: boolean) => void;
}

const DEFAULT_CALLBACK = () => undefined;

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

const ConditionEditor = (props: ConditionEditorProps): JSX.Element => {
  const { column, config, onChange = DEFAULT_CALLBACK } = props;
  const selectedColumnType = column.type;
  const [selectedCondition, setCondition] = useState(config.condition);
  const [conditionValue, setConditionValue] = useState(config.value);
  const [startValue, setStartValue] = useState(config.start);
  const [endValue, setEndValue] = useState(config.end);

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

  useEffect(() => {
    let isValid = true;

    if (selectedCondition === undefined) {
      log.error('Unable to create formatting rule. Condition is not selected.');
      isValid = false;
    }

    if (
      TableUtils.isNumberType(column.type) &&
      ((Number.isNaN(Number(conditionValue)) &&
        selectedCondition !== NumberCondition.IS_BETWEEN) ||
        (selectedCondition === NumberCondition.IS_BETWEEN &&
          (Number.isNaN(Number(startValue)) || Number.isNaN(Number(endValue)))))
    ) {
      log.error(
        'Unable to create formatting rule. Invalid value',
        conditionValue
      );
      isValid = false;
    }
    onChange(
      {
        condition: selectedCondition,
        value: conditionValue,
        start: startValue,
        end: endValue,
      },
      isValid
    );
  }, [
    onChange,
    column.type,
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

  return (
    <div className="condition-editor mb-2">
      <select
        value={selectedCondition}
        id="condition-select"
        className="custom-select mb-2"
        onChange={handleConditionChange}
      >
        {conditions}
      </select>
      {conditionInputs}
    </div>
  );
};

export default ConditionEditor;
