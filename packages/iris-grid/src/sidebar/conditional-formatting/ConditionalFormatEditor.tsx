import React, { useCallback, useState } from 'react';
import classNames from 'classnames';
import { Button } from '@deephaven/components';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import {
  FormatColumnWhereIcon,
  FormatRowWhereIcon,
  FormatDataBarIcon,
} from '../icons';
import ColumnFormatEditor from './ColumnFormatEditor';
import RowFormatEditor from './RowFormatEditor';
import {
  BaseFormatConfig,
  DataBarFormatConfig,
  FormatterType,
  FormattingRule,
  isSupportedColumn,
  ModelColumn,
} from './ConditionalFormattingUtils';
import './ConditionalFormatEditor.scss';
import DataBarFormatEditor from './DataBarFormatEditor';

const log = Log.module('ConditionalFormatEditor');

export type SaveCallback = (rule: FormattingRule) => void;

export type UpdateCallback = (rule?: FormattingRule) => void;

export type UpdateDataBarCallback = (column: string) => void;

export type CancelCallback = () => void;

export interface ConditionalFormatEditorProps {
  dh: DhType;
  columns: readonly ModelColumn[];
  rule?: FormattingRule;
  onCancel?: CancelCallback;
  onSave?: SaveCallback;
  onUpdate?: UpdateCallback;
  onDataBarRangeChange?: UpdateDataBarCallback;
}

const DEFAULT_CALLBACK = (): void => undefined;

function getFormatterTypeIcon(option: FormatterType): JSX.Element | undefined {
  switch (option) {
    case FormatterType.CONDITIONAL:
      return <FormatColumnWhereIcon />;
    case FormatterType.ROWS:
      return <FormatRowWhereIcon />;
    case FormatterType.DATA_BAR:
      return <FormatDataBarIcon />;
  }
}

function getFormatterTypeLabel(option: FormatterType): string {
  switch (option) {
    case FormatterType.CONDITIONAL:
      return 'Conditional';
    case FormatterType.ROWS:
      return 'Rows';
    case FormatterType.DATA_BAR:
      return 'Data Bar';
  }
}

const formatterTypes = [
  FormatterType.CONDITIONAL,
  FormatterType.ROWS,
  FormatterType.DATA_BAR,
];

function ConditionalFormatEditor(
  props: ConditionalFormatEditorProps
): JSX.Element {
  const {
    columns: originalColumns,
    dh,
    onSave = DEFAULT_CALLBACK,
    onUpdate = DEFAULT_CALLBACK,
    onCancel = DEFAULT_CALLBACK,
    onDataBarRangeChange = DEFAULT_CALLBACK,
    rule: defaultRule,
  } = props;

  const columns = originalColumns.filter(isSupportedColumn);

  const [selectedFormatter, setFormatter] = useState(
    defaultRule?.type ?? formatterTypes[0]
  );
  const [rule, setRule] = useState(defaultRule);
  const [isValid, setIsValid] = useState(false);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleSave = useCallback(() => {
    if (rule === undefined) {
      log.error('Rule is not defined.');
      return;
    }
    onSave(rule);
  }, [onSave, rule]);

  const handleDataBarRangeChange = useCallback(
    column => {
      if (column === undefined) {
        log.error('Column is not defined.');
        return;
      }
      onDataBarRangeChange(column);
    },
    [onDataBarRangeChange]
  );

  const handleFormatterChange = useCallback(value => {
    log.debug('handleFormatterChange', value);
    setFormatter(value);
  }, []);

  const handleRuleChange = useCallback(
    (
      ruleConfig: BaseFormatConfig | DataBarFormatConfig,
      isRuleValid: boolean
    ) => {
      log.debug('handleRuleChange', ruleConfig, isRuleValid, selectedFormatter);
      const updatedRule = {
        type: selectedFormatter,
        config: ruleConfig as BaseFormatConfig | DataBarFormatConfig,
      };
      setRule(updatedRule);
      setIsValid(isRuleValid);
      onUpdate(isRuleValid ? updatedRule : undefined);
    },
    [onUpdate, selectedFormatter]
  );

  return (
    <div className="conditional-format-editor form">
      <div className="mb-2">
        <label className="mb-0" htmlFor="formatter-select">
          Select Formatter
        </label>

        <div className="formatter-list">
          {formatterTypes.map((type, index) => (
            <div key={type} className="formatter-type">
              <button
                type="button"
                className={classNames('btn', 'btn-icon', 'btn-formatter-type', {
                  active: type === selectedFormatter,
                })}
                data-index={index}
                onClick={() => handleFormatterChange(type)}
              >
                {getFormatterTypeIcon(type)}
                {getFormatterTypeLabel(type)}
              </button>
            </div>
          ))}
        </div>
      </div>
      {selectedFormatter === FormatterType.CONDITIONAL && (
        <ColumnFormatEditor
          columns={columns}
          dh={dh}
          config={rule?.config as BaseFormatConfig}
          onChange={handleRuleChange}
        />
      )}
      {selectedFormatter === FormatterType.ROWS && (
        <RowFormatEditor
          columns={columns}
          config={rule?.config as BaseFormatConfig}
          dh={dh}
          onChange={handleRuleChange}
        />
      )}
      {selectedFormatter === FormatterType.DATA_BAR && (
        <DataBarFormatEditor
          columns={columns}
          config={rule?.config as DataBarFormatConfig}
          dh={dh}
          onChange={handleRuleChange}
          onDataBarRangeChange={handleDataBarRangeChange}
        />
      )}
      <hr />
      <div className="d-flex justify-content-end my-3">
        <Button kind="secondary" onClick={handleCancel} className="mr-2">
          Cancel
        </Button>
        <Button
          kind="primary"
          onClick={handleSave}
          disabled={rule === undefined || !isValid}
        >
          Done
        </Button>
      </div>
    </div>
  );
}

export default ConditionalFormatEditor;
