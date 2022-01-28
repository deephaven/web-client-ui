import React, { useCallback, useEffect, useState } from 'react';
import Log from '@deephaven/log';
import { ComboBox } from '@deephaven/components';
import { ChangeCallback } from './ConditionalFormatEditor';
import {
  ModelColumn,
  BaseFormatConfig,
  getDefaultConditionConfigForType,
  getConditionConfig,
  getDefaultStyleConfig,
} from './ConditionalFormattingUtils';
import ConditionEditor from './ConditionEditor';
import StyleEditor from './StyleEditor';

const log = Log.module('RowFormatEditor');

export type RowFormatConfig = BaseFormatConfig;

export interface RowFormatEditorProps {
  columns: ModelColumn[];
  config?: RowFormatConfig;
  onChange?: ChangeCallback;
}

const DEFAULT_CALLBACK = () => undefined;

function makeDefaultConfig(columns: ModelColumn[]): RowFormatConfig {
  const { type, name } = columns[0];
  const column = { type, name };
  const config = {
    column,
    style: getDefaultStyleConfig(),
    ...getDefaultConditionConfigForType(type),
  };
  return config;
}

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
  const [conditionConfig, setConditionConfig] = useState(
    getConditionConfig(config)
  );
  const [conditionValid, setConditionValid] = useState(false);
  const [selectedStyle, setStyle] = useState(config.style);

  const handleColumnChange = useCallback(
    value => {
      const newColumn = columns.find(({ name }) => name === value);
      if (newColumn && selectedColumnType !== newColumn.type) {
        log.debug('handleColumnChange', selectedColumnType, newColumn.type);
        setConditionConfig(getDefaultConditionConfigForType(newColumn.type));
      }
      setColumn(newColumn);
    },
    [columns, selectedColumnType]
  );

  const handleConditionChange = useCallback(
    (updatedConditionConfig, isValid) => {
      log.debug('handleConditionChange', updatedConditionConfig, isValid);
      setConditionConfig(updatedConditionConfig);
      setConditionValid(isValid);
    },
    []
  );

  const handleStyleChange = useCallback(updatedStyleConfig => {
    log.debug('handleStyleChange', updatedStyleConfig);
    setStyle(updatedStyleConfig);
  }, []);

  useEffect(() => {
    if (selectedColumn === undefined) {
      log.debug('Column is not selected, skip update.');
      return;
    }
    if (selectedStyle === undefined) {
      log.debug('Style is not selected, skip update.');
      return;
    }
    if (!conditionValid) {
      log.debug('Condition not valid, skip update.');
      return;
    }
    const { type, name } = selectedColumn;
    const column = { type, name };
    onChange({
      column,
      style: selectedStyle,
      ...conditionConfig,
    });
  }, [
    onChange,
    selectedColumn,
    selectedStyle,
    conditionConfig,
    conditionValid,
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
          <ConditionEditor
            column={selectedColumn}
            config={conditionConfig}
            onChange={handleConditionChange}
          />
          <StyleEditor config={selectedStyle} onChange={handleStyleChange} />
        </>
      )}
    </div>
  );
};

export default RowFormatEditor;
