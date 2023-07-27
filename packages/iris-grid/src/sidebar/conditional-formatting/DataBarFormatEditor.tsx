import React, { useCallback, useEffect, useState } from 'react';
import Log from '@deephaven/log';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { dhNewCircleLargeFilled } from '@deephaven/icons';
import { Button, ComboBox } from '@deephaven/components';
import {
  BaseFormatConfig,
  ChangeCallback,
  getDefaultConditionConfigForType,
  getConditionConfig,
  getDefaultStyleConfig,
  ModelColumn,
  DataBarAxisOptions,
  DataBarDirectionOptions,
  DataBarValuePlacementOptions,
} from './ConditionalFormattingUtils';
import StyleEditor from './StyleEditor';

import './DataBarFormatEditor.scss';

const log = Log.module('DataBarFormatEditor');

export interface DataBarFormatEditorProps {
  columns: ModelColumn[];
  config?: BaseFormatConfig;
  dh: DhType;
  onChange?: ChangeCallback;
}

const DEFAULT_CALLBACK = () => undefined;

const axisOptions = Object.values(DataBarAxisOptions).map(opt => (
  <option key={opt} value={opt}>
    {opt}
  </option>
));

const directionOptions = Object.values(DataBarDirectionOptions).map(opt => (
  <option key={opt} value={opt}>
    {opt}
  </option>
));

const valuePlacementOptions = Object.values(DataBarValuePlacementOptions).map(
  opt => (
    <>
      <input
        type="radio"
        name="value_placement"
        id={opt}
        key={opt}
        value={opt}
        className="mr-1"
      />
      <label htmlFor={opt}>{opt}</label>
      <br />
    </>
  )
);

function makeDefaultConfig(columns: ModelColumn[]): BaseFormatConfig {
  const { type, name } = columns[0];
  const column = { type, name };
  const config = {
    column,
    style: getDefaultStyleConfig(),
    ...getDefaultConditionConfigForType(type),
  };
  return config;
}

function DataBarFormatEditor(props: DataBarFormatEditorProps): JSX.Element {
  const {
    columns,
    config = makeDefaultConfig(columns),
    dh,
    onChange = DEFAULT_CALLBACK,
  } = props;

  const [selectedColumn, setColumn] = useState(
    columns.find(
      c => c.name === config.column.name && c.type === config.column.type
    ) ?? columns[0]
  );
  const [markerColumn, setMarkerColumn] = useState(
    columns.find(
      c => c.name === config.column.name && c.type === config.column.type
    ) ?? columns[0]
  );
  const [conditionConfig, setConditionConfig] = useState(
    getConditionConfig(config)
  );
  const [conditionValid, setConditionValid] = useState(false);
  const [positiveStyle, setPositiveStyle] = useState(config.style);
  const [negativeStyle, setNegativeStyle] = useState(config.style);

  const [minValue, setMinValue] = useState<number>();
  const [maxValue, setMaxValue] = useState<number>();

  const handleColumnChange = useCallback(
    value => {
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

  const handleMarkerColumnChange = useCallback(
    value => {
      const newColumn = columns.find(({ name }) => name === value);
      if (newColumn !== undefined) {
        setMarkerColumn(newColumn);
        if (markerColumn.type !== newColumn.type) {
          setConditionConfig(getDefaultConditionConfigForType(newColumn.type));
          setConditionValid(false);
        }
      } else {
        log.error(`Column ${value} not found.`);
      }
    },
    [columns, markerColumn]
  );

  const handlePositiveStyleChange = useCallback(updatedStyleConfig => {
    log.debug('handleStyleChange', updatedStyleConfig);
    setPositiveStyle(updatedStyleConfig);
  }, []);

  const handleNegativeStyleChange = useCallback(updatedStyleConfig => {
    log.debug('handleStyleChange', updatedStyleConfig);
    setNegativeStyle(updatedStyleConfig);
  }, []);

  useEffect(
    function updateRowFormat() {
      if (selectedColumn === undefined) {
        log.debug('Column is not selected, skip update.');
        return;
      }
      if (positiveStyle === undefined && negativeStyle === undefined) {
        log.debug('Style is not selected, skip update.');
        return;
      }
      const { type, name } = selectedColumn;
      const column = { type, name };
      onChange(
        {
          column,
          style: positiveStyle,
          ...conditionConfig,
        },
        conditionValid
      );
    },
    [
      onChange,
      selectedColumn,
      positiveStyle,
      negativeStyle,
      conditionConfig,
      conditionValid,
    ]
  );

  const columnInputOptions = columns.map(({ name }) => ({
    title: name,
    value: name,
  }));

  return (
    <div className="conditional-rule-editor form">
      <div className="mb-2 column-range-container">
        <label className="mb-0">Column</label>
        <div>
          <ComboBox
            defaultValue={selectedColumn?.name}
            options={columnInputOptions}
            inputPlaceholder="Select a column"
            spellCheck={false}
            onChange={handleColumnChange}
            searchPlaceholder="Filter columns"
          />
        </div>

        <label className="mb-1 align-items-end">Range</label>
        <div className="min-max-container">
          <label>Min</label>
          <label>Max</label>
          <input
            type="number"
            className="form-control"
            placeholder="Automatic"
            value={minValue}
            onChange={e => setMinValue(parseInt(e.target.value, 10))}
          />
          <input
            type="number"
            className="form-control"
            placeholder="Automatic"
            value={maxValue}
            onChange={e => setMaxValue(parseInt(e.target.value, 10))}
          />
        </div>
      </div>
      {selectedColumn !== undefined && (
        <>
          <hr />
          <label className="mb-0 pb-0">Bar Style</label>
          <div className="bar-style-container mb-3">
            {/* <div /> */}
            <label>Positive values</label>
            <StyleEditor
              config={positiveStyle}
              onChange={handlePositiveStyleChange}
              showLabel={false}
            />
            <label>Negative values</label>
            <StyleEditor
              config={positiveStyle}
              onChange={handleNegativeStyleChange}
              showLabel={false}
            />
            <label htmlFor="axis-selector">Negative Axis</label>
            <select
              className="custom-select"
              name="axisSelector"
              id="axis-selector"
            >
              {axisOptions}
            </select>
            <label htmlFor="direction-selector">Bar Direction</label>
            <select
              className="custom-select"
              name="directionSelector"
              id="direction-selector"
            >
              {directionOptions}
            </select>
          </div>
          <div>{valuePlacementOptions}</div>
          <hr />
          <div>
            <label htmlFor="">Additional Markers</label>
            <div className="marker-style-container">
              <label>Marker Column</label>
              <div>
                <ComboBox
                  defaultValue={selectedColumn?.name}
                  options={columnInputOptions}
                  inputPlaceholder="Select a column"
                  spellCheck={false}
                  onChange={handleMarkerColumnChange}
                  searchPlaceholder="Filter columns"
                />
              </div>
              <label>Marker Colour</label>
              <StyleEditor
                config={positiveStyle}
                onChange={handlePositiveStyleChange}
                showLabel={false}
              />
            </div>
            <Button
              kind="ghost"
              // onClick={onCreate}
              icon={dhNewCircleLargeFilled}
            >
              Add another marker
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default DataBarFormatEditor;
