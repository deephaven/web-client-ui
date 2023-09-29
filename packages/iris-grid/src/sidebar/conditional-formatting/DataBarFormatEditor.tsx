import React, { useCallback, useEffect, useState } from 'react';
import Log from '@deephaven/log';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { dhNewCircleLargeFilled } from '@deephaven/icons';
import { Button, ComboBox } from '@deephaven/components';
import {
  ChangeCallback,
  ModelColumn,
  DataBarAxisOptions,
  DataBarDirectionOptions,
  DataBarValuePlacementOptions,
  DataBarFormatConfig,
  FormatStyleType,
  FormatStyleConfig,
} from './ConditionalFormattingUtils';
import StyleEditor from './StyleEditor';

import './DataBarFormatEditor.scss';
import { UpdateDataBarCallback } from './ConditionalFormatEditor';

const log = Log.module('DataBarFormatEditor');

export interface DataBarFormatEditorProps {
  columns: ModelColumn[];
  config?: DataBarFormatConfig;
  dh: DhType;
  onChange?: ChangeCallback;
  onDataBarRangeChange?: UpdateDataBarCallback;
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

function makeDefaultConfig(columns: ModelColumn[]): DataBarFormatConfig {
  const { type, name } = columns[0];
  const column = { type, name };
  const config: DataBarFormatConfig = {
    column,
    positiveColor: '',
    negativeColor: '',
  };
  return config;
}

function DataBarFormatEditor(props: DataBarFormatEditorProps): JSX.Element {
  const {
    columns,
    config = makeDefaultConfig(columns),
    dh,
    onChange = DEFAULT_CALLBACK,
    onDataBarRangeChange = DEFAULT_CALLBACK,
  } = props;

  const [selectedColumn, setColumn] = useState(
    columns.find(c => c.type === 'int' || c.type === 'long')
  );
  const [markerColumn, setMarkerColumn] = useState(
    columns.find(c => c.type === 'int' || c.type === 'long')
  );
  const [configValid, setConfigValid] = useState(true);
  const [positiveStyle, setPositiveStyle] = useState<FormatStyleConfig>({
    type: FormatStyleType.POSITIVE,
    customConfig: {
      color: config.positiveColor ?? '',
      background: '',
    },
  });
  const [negativeStyle, setNegativeStyle] = useState<FormatStyleConfig>({
    type: FormatStyleType.NEGATIVE,
    customConfig: {
      color: config.negativeColor ?? '',
      background: '',
    },
  });

  const [minValue, setMinValue] = useState<number>();
  const [maxValue, setMaxValue] = useState<number>();
  const [axis, setAxis] = useState<DataBarAxisOptions>(
    DataBarAxisOptions.PROPORTIONAL
  );
  const [direction, setDirection] = useState<DataBarDirectionOptions>(
    DataBarDirectionOptions.LTR
  );
  const [valuePlacement, setValuePlacement] =
    useState<DataBarValuePlacementOptions>(DataBarValuePlacementOptions.BESIDE);

  const handleColumnChange = useCallback(
    value => {
      const newColumn = columns.find(({ name }) => name === value);
      if (newColumn !== undefined) {
        setColumn(newColumn);
        if (newColumn.type !== 'long' && newColumn.type !== 'int') {
          setConfigValid(false);
        }
      } else {
        log.error(`Column ${value} is not a valid type.`);
      }
    },
    [columns, selectedColumn]
  );

  const handleMarkerColumnChange = useCallback(
    value => {
      const newColumn = columns.find(({ name }) => name === value);
      if (newColumn !== undefined) {
        setMarkerColumn(newColumn);
        if (newColumn.type !== 'long' && newColumn.type !== 'int') {
          setConfigValid(false);
        }
      } else {
        log.error(`Column ${value} is not a valid type.`);
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
          min: minValue,
          max: maxValue,
          positiveColor: positiveStyle.customConfig?.color,
          negativeColor: negativeStyle.customConfig?.color,
          axis: Object.keys(DataBarAxisOptions).find(
            k => (DataBarAxisOptions as any)[k] === axis
          ),
          direction: Object.keys(DataBarDirectionOptions).find(
            k => (DataBarDirectionOptions as any)[k] === direction
          ),
          valuePlacement: Object.keys(DataBarValuePlacementOptions).find(
            k => (DataBarValuePlacementOptions as any)[k] === valuePlacement
          ),
        } as DataBarFormatConfig,
        configValid // replace with valid config check
      );
    },
    [
      onChange,
      selectedColumn,
      minValue,
      maxValue,
      positiveStyle,
      negativeStyle,
      axis,
      direction,
      valuePlacement,
      configValid,
    ]
  );

  useEffect(
    function updateDataBarRange() {
      if (selectedColumn !== undefined) {
        onDataBarRangeChange(selectedColumn.name);
      }
    },
    [onDataBarRangeChange, selectedColumn]
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
              onChange={e => {
                setAxis(e.target.value as DataBarAxisOptions);
              }}
            >
              {axisOptions}
            </select>
            <label htmlFor="direction-selector">Bar Direction</label>
            <select
              className="custom-select"
              name="directionSelector"
              id="direction-selector"
              onChange={e => {
                setDirection(e.target.value as DataBarDirectionOptions);
              }}
            >
              {directionOptions}
            </select>
          </div>
          <div>{valuePlacementOptions}</div>
          <hr />
          <div>
            {/* <label htmlFor="">Additional Markers</label>
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
            </Button> */}
          </div>
        </>
      )}
    </div>
  );
}

export default DataBarFormatEditor;
