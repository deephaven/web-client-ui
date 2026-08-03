import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Log from '@deephaven/log';
import {
  ComboBox,
  type ItemKey,
  type ItemSelection,
  MultiSelect,
} from '@deephaven/components';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  type BaseFormatConfig,
  type ChangeCallback,
  getDefaultConditionConfigForType,
  getConditionConfig,
  getDefaultStyleConfig,
  type ModelColumn,
  FormatStyleType,
  type ConditionConfig,
  type FormatStyleConfig,
} from './ConditionalFormattingUtils';
import ConditionEditor from './ConditionEditor';
import StyleEditor from './StyleEditor';

const log = Log.module('MultiColumnFormatEditor');

export interface MultiColumnFormatEditorProps {
  columns: ModelColumn[];
  config?: BaseFormatConfig;
  dh: typeof DhType;
  onChange?: ChangeCallback;
}

const DEFAULT_CALLBACK = (): void => undefined;

function makeDefaultConfig(columns: ModelColumn[]): BaseFormatConfig {
  const { type, name } = columns[0];
  const leftHandValue = { type, name };
  const config = {
    leftHandValue,
    formattedColumns: [] as ModelColumn[],
    style: getDefaultStyleConfig(),
    ...getDefaultConditionConfigForType(type),
  };
  return config;
}

/**
 * Multi-column format editor component. Allows users to select multiple columns to apply formatting to,
 * specify a condition for formatting, and choose a style for the formatting.
 *
 * @param props The props for the component.
 * @returns The JSX element for the multi-column format editor.
 */
function MultiColumnFormatEditor(
  props: MultiColumnFormatEditorProps
): JSX.Element {
  const {
    columns,
    config = makeDefaultConfig(columns),
    dh,
    onChange = DEFAULT_CALLBACK,
  } = props;

  // The left-hand value column selected for the condition. This is the column that will be evaluated against the specified condition.
  const [selectedColumn, setColumn] = useState(
    columns.find(
      c =>
        c.name === config.leftHandValue.name &&
        c.type === config.leftHandValue.type
    ) ?? columns[0]
  );

  // customFormattedColumns holds an explicit column selection when non-empty.
  // An empty array means "track the condition column" (selectedFormattedColumns
  // will mirror [selectedColumn] automatically).
  const [customFormattedColumns, setCustomFormattedColumns] = useState<
    ModelColumn[]
  >(() => {
    const { formattedColumns, leftHandValue } = config;
    const isCustom =
      formattedColumns.length > 1 ||
      (formattedColumns.length === 1 &&
        formattedColumns[0].name !== leftHandValue.name);
    if (!isCustom) return [];
    return formattedColumns.map(
      col =>
        columns.find(c => c.name === col.name && c.type === col.type) ??
        columns[0]
    );
  });
  const selectedFormattedColumns = useMemo(
    () =>
      customFormattedColumns.length > 0
        ? customFormattedColumns
        : [selectedColumn],
    [customFormattedColumns, selectedColumn]
  );

  // The condition configuration for the formatting rule. This includes the condition type and any associated values.
  const [conditionConfig, setConditionConfig] = useState(
    getConditionConfig(config)
  );
  // Whether the current condition configuration is valid. This is used to determine if the rule can be applied.
  const [conditionValid, setConditionValid] = useState(false);
  // The style configuration for the formatting rule. This includes the style type and any associated style properties.
  const [selectedStyle, setStyle] = useState(config.style);

  /**
   * Handles changes to the selected column for the condition.
   *
   * @param value The name of the new column selected for the condition.
   */
  const handleColumnChange = useCallback(
    (value: ItemKey | null) => {
      const newColumn = columns.find(({ name }) => name === value);
      if (newColumn !== undefined) {
        setColumn(newColumn);
        if (selectedColumn.type !== newColumn.type) {
          setConditionConfig(getDefaultConditionConfigForType(newColumn.type));
          setConditionValid(false);
        }
      } else {
        log.error(`Column ${value} not found.`);
      }
    },
    [columns, selectedColumn]
  );

  /**
   * Handles changes to the selected columns for formatting. Updates the list of selected formatted columns based on the provided keys.
   *
   * @param keys The keys of the columns selected for formatting.
   */
  const handleFormattedColumnsChange = useCallback(
    (keys: ItemSelection) => {
      if (keys === 'all') return;
      const newCols = [...keys]
        .map(key => columns.find(c => c.name === String(key)))
        .filter((c): c is ModelColumn => c !== undefined);
      // Empty array reverts to tracking the condition column
      setCustomFormattedColumns(newCols);
    },
    [columns]
  );

  /**
   * Handles changes to the condition configuration. Updates the condition configuration and validity state based on the provided values.
   *
   * @param updatedConditionConfig The new condition configuration.
   * @param isValid Whether the new condition configuration is valid.
   */
  const handleConditionChange = useCallback(
    (updatedConditionConfig: ConditionConfig, isValid: boolean) => {
      log.debug('handleConditionChange', updatedConditionConfig, isValid);
      setConditionConfig(updatedConditionConfig);
      setConditionValid(isValid);
    },
    []
  );

  /**
   * Handles changes to the style configuration. Updates the selected style based on the provided style configuration.
   *
   * @param updatedStyleConfig The new style configuration.
   */
  const handleStyleChange = useCallback(
    (updatedStyleConfig: FormatStyleConfig) => {
      log.debug('handleStyleChange', updatedStyleConfig);
      setStyle(updatedStyleConfig);
    },
    []
  );

  // Update the parent component with the current rule configuration whenever any of the relevant state variables change.
  useEffect(
    function updateColumnFormat() {
      let isValid = conditionValid;

      if (selectedColumn === undefined) {
        log.debug('Column is not selected, invalidating update.');
        isValid = false;
      }
      if (
        selectedStyle === undefined ||
        selectedStyle.type === FormatStyleType.NO_FORMATTING
      ) {
        log.debug('Style is not selected, invalidating update.');
        isValid = false;
      }

      const { type, name } = selectedColumn;
      const leftHandValue = { type, name };
      onChange(
        {
          leftHandValue,
          formattedColumns: selectedFormattedColumns.map(
            ({ type: colType, name: colName }) => ({
              type: colType,
              name: colName,
            })
          ),
          style: selectedStyle,
          ...conditionConfig,
        },
        isValid
      );
    },
    [
      onChange,
      selectedColumn,
      selectedFormattedColumns,
      selectedStyle,
      conditionConfig,
      conditionValid,
    ]
  );

  const columnNames = useMemo(() => columns.map(({ name }) => name), [columns]);

  const selectedFormattedColumnKeys = useMemo(
    () => selectedFormattedColumns.map(c => c.name),
    [selectedFormattedColumns]
  );

  return (
    <div className="conditional-rule-editor form">
      <div className="mb-2">
        <label className="mb-0">Format Cell If</label>
        <ComboBox
          aria-label="Select column to format"
          defaultSelectedKey={selectedColumn?.name}
          onChange={handleColumnChange}
        >
          {columnNames}
        </ComboBox>
      </div>

      {selectedColumn !== undefined && (
        <>
          <ConditionEditor
            dh={dh}
            column={selectedColumn}
            columns={columns}
            config={conditionConfig}
            onChange={handleConditionChange}
          />
          <StyleEditor config={selectedStyle} onChange={handleStyleChange} />
        </>
      )}

      <div className="mb-2">
        <label className="mb-0 mt-1">Apply to Columns</label>
        <MultiSelect
          aria-label="Select columns to apply formatting to"
          width="100%"
          selectedKeys={selectedFormattedColumnKeys}
          onChange={handleFormattedColumnsChange}
        >
          {columnNames}
        </MultiSelect>
      </div>
    </div>
  );
}

export default MultiColumnFormatEditor;
