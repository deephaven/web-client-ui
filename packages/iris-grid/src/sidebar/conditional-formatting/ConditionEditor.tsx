import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { TableUtils } from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import {
  ComboBox,
  Item,
  type ItemKey,
  Picker,
  Section,
} from '@deephaven/components';
import {
  StringCondition,
  DateCondition,
  getLabelForNumberCondition,
  getLabelForDateCondition,
  getLabelForStringCondition,
  NumberCondition,
  type ModelColumn,
  type ConditionConfig,
  getDefaultConditionForType,
  getLabelForBooleanCondition,
  BooleanCondition,
  CharCondition,
  type Condition,
  getLabelForCharCondition,
  isDateConditionValid,
  getDefaultValueForType,
} from './ConditionalFormattingUtils';

const log = Log.module('ConditionEditor');

export interface ConditionEditorProps {
  dh: typeof DhType;
  column: ModelColumn;
  columns: ModelColumn[];
  config: ConditionConfig;
  onChange?: (config: ConditionConfig, isValid: boolean) => void;
}

const DEFAULT_CALLBACK = (): void => undefined;

const VALUE_PREFIX = 'value-';
const COLUMN_PREFIX = 'column-';

const numberValueConditions = [
  NumberCondition.IS_EQUAL,
  NumberCondition.IS_NOT_EQUAL,
  NumberCondition.IS_BETWEEN,
  NumberCondition.GREATER_THAN,
  NumberCondition.GREATER_THAN_OR_EQUAL,
  NumberCondition.LESS_THAN,
  NumberCondition.LESS_THAN_OR_EQUAL,
  NumberCondition.IS_NULL,
  NumberCondition.IS_NOT_NULL,
];

const numberColumnConditions = [
  NumberCondition.IS_EQUAL,
  NumberCondition.IS_NOT_EQUAL,
  NumberCondition.GREATER_THAN,
  NumberCondition.GREATER_THAN_OR_EQUAL,
  NumberCondition.LESS_THAN,
  NumberCondition.LESS_THAN_OR_EQUAL,
];

const stringValueConditions = [
  StringCondition.IS_EXACTLY,
  StringCondition.IS_NOT_EXACTLY,
  StringCondition.CONTAINS,
  StringCondition.DOES_NOT_CONTAIN,
  StringCondition.STARTS_WITH,
  StringCondition.ENDS_WITH,
  StringCondition.IS_NULL,
  StringCondition.IS_NOT_NULL,
];

const stringColumnConditions = [
  StringCondition.IS_EXACTLY,
  StringCondition.IS_NOT_EXACTLY,
  StringCondition.CONTAINS,
  StringCondition.DOES_NOT_CONTAIN,
  StringCondition.STARTS_WITH,
  StringCondition.ENDS_WITH,
];

const dateValueConditions = [
  DateCondition.IS_EXACTLY,
  DateCondition.IS_NOT_EXACTLY,
  DateCondition.IS_BEFORE,
  DateCondition.IS_BEFORE_OR_EQUAL,
  DateCondition.IS_AFTER,
  DateCondition.IS_AFTER_OR_EQUAL,
  DateCondition.IS_NULL,
  DateCondition.IS_NOT_NULL,
];

const dateColumnConditions = [
  DateCondition.IS_EXACTLY,
  DateCondition.IS_NOT_EXACTLY,
  DateCondition.IS_BEFORE,
  DateCondition.IS_BEFORE_OR_EQUAL,
  DateCondition.IS_AFTER,
  DateCondition.IS_AFTER_OR_EQUAL,
];

const booleanValueConditions = [
  BooleanCondition.IS_TRUE,
  BooleanCondition.IS_FALSE,
  BooleanCondition.IS_EQUAL,
  BooleanCondition.IS_NOT_EQUAL,
  BooleanCondition.IS_NULL,
  BooleanCondition.IS_NOT_NULL,
];

const booleanColumnConditions = [
  BooleanCondition.IS_EQUAL,
  BooleanCondition.IS_NOT_EQUAL,
];

const charValueConditions = [
  CharCondition.IS_EQUAL,
  CharCondition.IS_NOT_EQUAL,
  CharCondition.IS_NULL,
  CharCondition.IS_NOT_NULL,
];

const charColumnConditions = [
  CharCondition.IS_EQUAL,
  CharCondition.IS_NOT_EQUAL,
];

function isNumberConditionValid(
  condition: NumberCondition,
  value?: string,
  startValue?: string,
  endValue?: string
): boolean {
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

function ConditionEditor(props: ConditionEditorProps): JSX.Element {
  const { column, columns, config, dh, onChange = DEFAULT_CALLBACK } = props;
  const selectedColumnType = column.type;
  const [prevColumnType, setPrevColumnType] = useState(selectedColumnType);

  // Encode both condition and RHV mode in a single key: 'value-is-equal' or 'column-is-equal'
  const [selectedConditionKey, setConditionKey] = useState(
    () =>
      `${
        typeof config.rightHandValue === 'object' ? COLUMN_PREFIX : VALUE_PREFIX
      }${config.condition}`
  );
  const selectedCondition = selectedConditionKey.replace(
    /^(value|column)-/,
    ''
  ) as Condition;
  const isColumnMode = selectedConditionKey.startsWith(COLUMN_PREFIX);

  const [conditionValue, setValue] = useState<string | ModelColumn | undefined>(
    config.rightHandValue
  );
  const [startValue, setStartValue] = useState(config.start);
  const [endValue, setEndValue] = useState(config.end);
  const [isValid, setIsValid] = useState(true);

  if (selectedColumnType !== prevColumnType) {
    // Column type changed, reset condition and value fields
    setConditionKey(
      `${VALUE_PREFIX}${getDefaultConditionForType(selectedColumnType)}`
    );
    setValue(getDefaultValueForType(selectedColumnType));
    setStartValue(undefined);
    setEndValue(undefined);
    setPrevColumnType(selectedColumnType);
  }

  // Build label helper for any condition enum value
  const getConditionLabel = useCallback(
    (condition: Condition): string => {
      if (TableUtils.isNumberType(selectedColumnType)) {
        return getLabelForNumberCondition(condition as NumberCondition);
      }
      if (TableUtils.isCharType(selectedColumnType)) {
        return getLabelForCharCondition(condition as CharCondition);
      }
      if (TableUtils.isStringType(selectedColumnType)) {
        return getLabelForStringCondition(condition as StringCondition);
      }
      if (TableUtils.isDateType(selectedColumnType)) {
        return getLabelForDateCondition(condition as DateCondition);
      }
      return getLabelForBooleanCondition(condition as BooleanCondition);
    },
    [selectedColumnType]
  );

  const [pickerValueItems, pickerColumnItems] = useMemo(() => {
    let valueConditions: Condition[] = [];
    let columnConditions: Condition[] = [];
    if (TableUtils.isNumberType(selectedColumnType)) {
      valueConditions = numberValueConditions;
      columnConditions = numberColumnConditions;
    } else if (TableUtils.isCharType(selectedColumnType)) {
      valueConditions = charValueConditions;
      columnConditions = charColumnConditions;
    } else if (TableUtils.isStringType(selectedColumnType)) {
      valueConditions = stringValueConditions;
      columnConditions = stringColumnConditions;
    } else if (TableUtils.isDateType(selectedColumnType)) {
      valueConditions = dateValueConditions;
      columnConditions = dateColumnConditions;
    } else if (TableUtils.isBooleanType(selectedColumnType)) {
      valueConditions = booleanValueConditions;
      columnConditions = booleanColumnConditions;
    }
    return [
      valueConditions.map(c => (
        <Item key={`${VALUE_PREFIX}${c}`}>{getConditionLabel(c)}</Item>
      )),
      columnConditions.map(c => (
        <Item key={`${COLUMN_PREFIX}${c}`}>{getConditionLabel(c)}</Item>
      )),
    ];
  }, [selectedColumnType, getConditionLabel]);

  const handleConditionKeyChange = useCallback(
    (key: ItemKey | null) => {
      if (key == null) return;
      const keyStr = String(key);
      log.debug('handleConditionKeyChange', keyStr);
      const nextIsColumn = keyStr.startsWith(COLUMN_PREFIX);
      if (nextIsColumn && typeof conditionValue !== 'object') {
        // Switching to column mode — default to first compatible column
        const firstCompatible = columns.find(c => {
          if (TableUtils.isNumberType(selectedColumnType)) {
            return TableUtils.isNumberType(c.type);
          }
          return (
            TableUtils.getNormalizedType(selectedColumnType) ===
            TableUtils.getNormalizedType(c.type)
          );
        });
        setValue(
          firstCompatible != null
            ? { name: firstCompatible.name, type: firstCompatible.type }
            : undefined
        );
      } else if (!nextIsColumn && typeof conditionValue === 'object') {
        // Switching to value mode — clear the column value
        setValue(getDefaultValueForType(selectedColumnType));
      }
      setConditionKey(keyStr);
    },
    [columns, selectedColumnType, conditionValue]
  );

  const handleRightHandValueChange = useCallback(
    (value: string | ModelColumn | undefined) => {
      log.debug('handleRightHandValueChange', value);
      setValue(value);
    },
    []
  );

  const handleStartValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      log.debug('handleStartValueChange', value);
      setStartValue(value);
    },
    []
  );

  const handleEndValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      log.debug('handleEndValueChange', value);
      setEndValue(value);
    },
    []
  );

  useEffect(
    function changeCondition() {
      let isConditionValid = true;

      if (selectedCondition === undefined) {
        log.debug(
          'Unable to create formatting rule. Condition is not selected.'
        );
        isConditionValid = false;
      } else if (
        TableUtils.isNumberType(column.type) &&
        (selectedCondition === NumberCondition.IS_BETWEEN ||
          typeof conditionValue !== 'object') &&
        !isNumberConditionValid(
          selectedCondition as NumberCondition,
          typeof conditionValue === 'string' ? conditionValue : undefined,
          startValue,
          endValue
        )
      ) {
        log.debug(
          'Unable to create formatting rule. Invalid value',
          conditionValue
        );
        isConditionValid = false;
      } else if (
        TableUtils.isDateType(column.type) &&
        typeof conditionValue !== 'object' &&
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
        isConditionValid = false;
      } else if (
        TableUtils.isCharType(column.type) &&
        typeof conditionValue !== 'object' &&
        selectedCondition !== CharCondition.IS_NULL &&
        selectedCondition !== CharCondition.IS_NOT_NULL &&
        (conditionValue === undefined || conditionValue.length !== 1)
      ) {
        log.debug(
          'Unable to create formatting rule. Char value must be a single character',
          conditionValue
        );
        isConditionValid = false;
      } else if (
        TableUtils.isBooleanType(column.type) &&
        typeof conditionValue !== 'object' &&
        (selectedCondition === BooleanCondition.IS_EQUAL ||
          selectedCondition === BooleanCondition.IS_NOT_EQUAL) &&
        conditionValue !== 'true' &&
        conditionValue !== 'false' &&
        conditionValue !== 'null'
      ) {
        log.debug(
          'Unable to create formatting rule. Boolean comparison requires a column, true, false, or null',
          conditionValue
        );
        isConditionValid = false;
      }

      setIsValid(isConditionValid);
      onChange(
        {
          condition: selectedCondition,
          rightHandValue: conditionValue,
          start: startValue,
          end: endValue,
        },
        isConditionValid
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

    // IS_NULL/IS_NOT_NULL enum values are identical across all types ('is-null' /
    // 'is-not-null'), so checking one enum covers all.
    // Boolean IS_TRUE/IS_FALSE also never need a value input.
    if (
      selectedCondition === StringCondition.IS_NULL ||
      selectedCondition === StringCondition.IS_NOT_NULL ||
      selectedCondition === BooleanCondition.IS_TRUE ||
      selectedCondition === BooleanCondition.IS_FALSE
    ) {
      return null;
    }

    // A ModelColumn rightHandValue is always valid (column-vs-column comparison).
    // For string values, check type-specific validity.
    const rhvIsColumn = typeof conditionValue === 'object';
    const hasInvalidValue =
      !rhvIsColumn &&
      !isValid &&
      conditionValue !== undefined &&
      conditionValue !== '';

    // Only offer columns that are type-compatible with the condition column so
    // the generated expression is valid (e.g. prevent startsWith(intColumn)).
    // Numbers are cross-compatible (int vs double). Everything else requires the same
    // normalized type. (Note: text types are not compatible (string vs char)
    const compatibleRhvColumns = columns.filter(c => {
      if (TableUtils.isNumberType(selectedColumnType)) {
        return TableUtils.isNumberType(c.type);
      }
      return (
        TableUtils.getNormalizedType(selectedColumnType) ===
        TableUtils.getNormalizedType(c.type)
      );
    });

    // IS_BETWEEN uses two separate range inputs
    if (
      TableUtils.isNumberType(selectedColumnType) &&
      selectedCondition === NumberCondition.IS_BETWEEN
    ) {
      const isInvalid =
        !rhvIsColumn &&
        !isValid &&
        ((startValue !== undefined && startValue !== '') ||
          (endValue !== undefined && endValue !== ''));
      return (
        <div className="d-flex flex-row">
          <input
            type="number"
            className={classNames('form-control', 'd-flex', 'mr-2', {
              'is-invalid': isInvalid,
            })}
            placeholder="Start value"
            value={startValue ?? ''}
            onChange={handleStartValueChange}
          />
          <input
            type="number"
            className={classNames('form-control', 'd-flex', {
              'is-invalid': isInvalid,
            })}
            placeholder="End value"
            value={endValue ?? ''}
            onChange={handleEndValueChange}
          />
        </div>
      );
    }

    if (isColumnMode) {
      return (
        <ComboBox
          aria-label="Select a column"
          selectedKey={
            typeof conditionValue === 'object' ? conditionValue.name : null
          }
          onChange={key => {
            if (key == null) return;
            const col = compatibleRhvColumns.find(c => c.name === String(key));
            if (col != null) {
              handleRightHandValueChange({ name: col.name, type: col.type });
            }
          }}
        >
          {compatibleRhvColumns.map(c => c.name)}
        </ComboBox>
      );
    }

    return (
      <input
        type={TableUtils.isNumberType(selectedColumnType) ? 'number' : 'text'}
        className={classNames('form-control', {
          'is-invalid': hasInvalidValue,
        })}
        value={typeof conditionValue === 'string' ? conditionValue : ''}
        placeholder="Enter a value"
        onChange={e => handleRightHandValueChange(e.target.value)}
      />
    );
  }, [
    columns,
    selectedColumnType,
    selectedCondition,
    conditionValue,
    startValue,
    endValue,
    isValid,
    handleRightHandValueChange,
    handleStartValueChange,
    handleEndValueChange,
    isColumnMode,
  ]);

  return (
    <div className="condition-editor mb-2">
      <Picker
        selectedKey={selectedConditionKey}
        aria-label="Select condition"
        data-testid="condition-select"
        width="100%"
        UNSAFE_className="mb-2"
        onChange={handleConditionKeyChange}
      >
        <Section title="Value">{pickerValueItems}</Section>
        <Section title="Column">{pickerColumnItems}</Section>
      </Picker>
      {conditionInputs}
    </div>
  );
}

export default ConditionEditor;
