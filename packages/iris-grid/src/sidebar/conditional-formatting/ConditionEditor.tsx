import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TableUtils } from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import {
  StringCondition,
  DateCondition,
  getLabelForNumberCondition,
  getLabelForDateCondition,
  getLabelForStringCondition,
  NumberCondition,
  ModelColumn,
  ConditionConfig,
  getDefaultConditionForType,
  getLabelForBooleanCondition,
  BooleanCondition,
  CharCondition,
  getLabelForCharCondition,
  isDateConditionValid,
  getDefaultValueForType,
} from './ConditionalFormattingUtils';

const log = Log.module('ConditionEditor');

export interface ConditionEditorProps {
  dh: DhType;
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
  NumberCondition.IS_NULL,
  NumberCondition.IS_NOT_NULL,
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
  StringCondition.IS_NULL,
  StringCondition.IS_NOT_NULL,
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
  DateCondition.IS_NULL,
  DateCondition.IS_NOT_NULL,
].map(option => (
  <option key={option} value={option}>
    {getLabelForDateCondition(option)}
  </option>
));

const booleanConditions = [
  BooleanCondition.IS_TRUE,
  BooleanCondition.IS_FALSE,
  BooleanCondition.IS_NULL,
  BooleanCondition.IS_NOT_NULL,
].map(option => (
  <option key={option} value={option}>
    {getLabelForBooleanCondition(option)}
  </option>
));

const charConditions = [
  CharCondition.IS_EQUAL,
  CharCondition.IS_NOT_EQUAL,
  CharCondition.IS_NULL,
  CharCondition.IS_NOT_NULL,
].map(option => (
  <option key={option} value={option}>
    {getLabelForCharCondition(option)}
  </option>
));

function isNumberConditionValid(
  condition: NumberCondition,
  value?: string,
  startValue?: string,
  endValue?: string
) {
  if (
    condition === NumberCondition.IS_NULL ||
    condition === NumberCondition.IS_NOT_NULL
  ) {
    return true;
  }
  if (
    condition === NumberCondition.IS_BETWEEN &&
    startValue != null &&
    startValue !== '' &&
    !Number.isNaN(Number.parseFloat(startValue)) &&
    endValue != null &&
    endValue !== '' &&
    !Number.isNaN(Number.parseFloat(endValue))
  ) {
    return true;
  }
  if (
    condition !== NumberCondition.IS_BETWEEN &&
    value !== undefined &&
    value !== '' &&
    !Number.isNaN(Number.parseFloat(value))
  ) {
    return true;
  }
  return false;
}

function getNumberInputs(
  selectedCondition: NumberCondition,
  handleValueChange: (e: unknown) => void,
  handleStartValueChange: (e: unknown) => void,
  handleEndValueChange: (e: unknown) => void,
  conditionValue?: string,
  startValue?: string,
  endValue?: string
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
          type="number"
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
            type="number"
            className="form-control d-flex mr-2"
            placeholder="Start value"
            value={startValue ?? ''}
            onChange={handleStartValueChange}
          />
          <input
            type="number"
            className="form-control d-flex"
            placeholder="End value"
            value={endValue ?? ''}
            onChange={handleEndValueChange}
          />
        </div>
      );
    case NumberCondition.IS_NULL:
    case NumberCondition.IS_NOT_NULL:
      return null;
  }
}

function getStringInputs(
  selectedCondition: StringCondition,
  handleValueChange: (e: unknown) => void,
  conditionValue?: string
) {
  switch (selectedCondition) {
    case StringCondition.IS_NULL:
    case StringCondition.IS_NOT_NULL:
      return null;
    default:
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
}

function getDateInputs(
  selectedCondition: DateCondition,
  handleValueChange: (e: unknown) => void,
  conditionValue?: string
) {
  switch (selectedCondition) {
    case DateCondition.IS_NULL:
    case DateCondition.IS_NOT_NULL:
      return null;
    default:
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
}

function getBooleanInputs() {
  return null;
}

function getCharInputs(
  selectedCondition: CharCondition,
  handleValueChange: (e: unknown) => void,
  conditionValue?: string
) {
  switch (selectedCondition) {
    case CharCondition.IS_NULL:
    case CharCondition.IS_NOT_NULL:
      return null;
    default:
      return (
        <input
          type="text"
          className="form-control"
          maxLength={1}
          placeholder="Enter value"
          value={conditionValue ?? ''}
          onChange={handleValueChange}
        />
      );
  }
}

function ConditionEditor(props: ConditionEditorProps): JSX.Element {
  const { column, config, dh, onChange = DEFAULT_CALLBACK } = props;
  const selectedColumnType = column.type;
  const [prevColumnType, setPrevColumnType] = useState(selectedColumnType);
  const [selectedCondition, setCondition] = useState(config.condition);
  const [conditionValue, setValue] = useState(config.value);
  const [startValue, setStartValue] = useState(config.start);
  const [endValue, setEndValue] = useState(config.end);

  if (selectedColumnType !== prevColumnType) {
    // Column type changed, reset condition and value fields
    setCondition(getDefaultConditionForType(selectedColumnType));
    setValue(getDefaultValueForType(selectedColumnType));
    setStartValue(undefined);
    setEndValue(undefined);
    setPrevColumnType(selectedColumnType);
  }

  const conditions = useMemo(() => {
    if (selectedColumnType === undefined) {
      return [];
    }
    if (TableUtils.isNumberType(selectedColumnType)) {
      return numberConditionOptions;
    }
    if (TableUtils.isCharType(selectedColumnType)) {
      return charConditions;
    }
    if (TableUtils.isStringType(selectedColumnType)) {
      return stringConditions;
    }
    if (TableUtils.isDateType(selectedColumnType)) {
      return dateConditions;
    }
    if (TableUtils.isBooleanType(selectedColumnType)) {
      return booleanConditions;
    }
  }, [selectedColumnType]);

  const handleConditionChange = useCallback(e => {
    const { value } = e.target;
    log.debug('handleConditionChange', value);
    setCondition(value);
  }, []);

  const handleValueChange = useCallback(e => {
    const { value } = e.target;
    log.debug('handleValueChange', value);
    setValue(value);
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

  useEffect(
    function changeCondition() {
      let isValid = true;

      if (selectedCondition === undefined) {
        log.debug(
          'Unable to create formatting rule. Condition is not selected.'
        );
        isValid = false;
      } else if (
        TableUtils.isNumberType(column.type) &&
        !isNumberConditionValid(
          selectedCondition as NumberCondition,
          conditionValue,
          startValue,
          endValue
        )
      ) {
        log.debug(
          'Unable to create formatting rule. Invalid value',
          conditionValue
        );
        isValid = false;
      } else if (
        TableUtils.isDateType(column.type) &&
        !isDateConditionValid(
          dh,
          selectedCondition as DateCondition,
          conditionValue
        )
      ) {
        log.debug(
          'Unable to create formatting rule. Invalid date condition',
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
    },
    [
      onChange,
      column.type,
      dh,
      selectedCondition,
      conditionValue,
      startValue,
      endValue,
    ]
  );

  const conditionInputs = useMemo(() => {
    if (selectedColumnType === undefined) {
      // Column not selected
      return null;
    }
    if (TableUtils.isNumberType(selectedColumnType)) {
      return getNumberInputs(
        selectedCondition as NumberCondition,
        handleValueChange,
        handleStartValueChange,
        handleEndValueChange,
        conditionValue,
        startValue,
        endValue
      );
    }
    if (TableUtils.isCharType(selectedColumnType)) {
      return getCharInputs(
        selectedCondition as CharCondition,
        handleValueChange,
        conditionValue
      );
    }
    if (TableUtils.isStringType(selectedColumnType)) {
      return getStringInputs(
        selectedCondition as StringCondition,
        handleValueChange,
        conditionValue
      );
    }
    if (TableUtils.isDateType(selectedColumnType)) {
      return getDateInputs(
        selectedCondition as DateCondition,
        handleValueChange,
        conditionValue
      );
    }
    if (TableUtils.isBooleanType(selectedColumnType)) {
      return getBooleanInputs();
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
}

export default ConditionEditor;
