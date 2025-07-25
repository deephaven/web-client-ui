import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  dhNewCircleLargeFilled,
  vsTrash,
  vsEdit,
  dhWarningFilled,
} from '@deephaven/icons';
import Log from '@deephaven/log';
import {
  DraggableItemList,
  DragUtils,
  Option,
  Select,
  Radio,
  RadioGroup,
  Button,
} from '@deephaven/components';
import type { DraggableRenderItemProps, Range } from '@deephaven/components';
import { type ModelIndex } from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import AggregationOperation from './AggregationOperation';
import AggregationUtils, { SELECTABLE_OPTIONS } from './AggregationUtils';
import './Aggregations.scss';

const log = Log.module('Aggregations');

export type Aggregation = {
  operation: AggregationOperation;
  selected: readonly string[];
  invert: boolean;
};

export type AggregationSettings = {
  aggregations: readonly Aggregation[];
  showOnTop: boolean;
};

export type AggregationsProps = {
  isRollup: boolean;
  availablePlacements: ('top' | 'bottom')[];
  settings: AggregationSettings;
  onChange: (
    settings: AggregationSettings,
    added: AggregationOperation[],
    removed: AggregationOperation[]
  ) => void;
  onEdit: (aggregation: Aggregation) => void;
  dh: typeof DhType;
};

function Aggregations({
  isRollup,
  settings,
  availablePlacements = ['top', 'bottom'],
  onChange,
  onEdit,
  dh,
}: AggregationsProps): JSX.Element {
  const { aggregations, showOnTop } = settings;
  const options = useMemo(
    () =>
      SELECTABLE_OPTIONS.filter(
        option =>
          !aggregations.some(aggregation => aggregation.operation === option) &&
          !(
            option === AggregationOperation.MEDIAN &&
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore - MEDIAN is not defined in older version of Core
            dh.AggregationOperation.MEDIAN === undefined
          )
      ),
    [aggregations, dh]
  );
  const [selectedOperation, setSelectedOperation] = useState(options[0]);
  const [selectedRanges, setSelectedRanges] = useState<Range[]>([]);
  const changeSettings = useCallback(
    (changedSettings, added = [], removed = []) => {
      onChange({ ...settings, ...changedSettings }, added, removed);
    },
    [onChange, settings]
  );
  const changeAggregations = useCallback(
    (newAggregations, added = [], removed = []) => {
      changeSettings({ aggregations: newAggregations }, added, removed);
    },
    [changeSettings]
  );

  const changeShowOnTop = useCallback(
    newShowOnTop => {
      changeSettings({ showOnTop: newShowOnTop });
    },
    [changeSettings]
  );

  const handleDragStart = useCallback(() => {
    log.debug('handleDragStart');

    DragUtils.startDragging();
  }, []);

  const handleDragEnd = useCallback(
    ({ destination, source }) => {
      log.debug('handleDragEnd', destination, source);

      DragUtils.stopDragging();

      if (destination === null) {
        return;
      }

      let destinationIndex = destination.index;
      if (source.index < destination.index) {
        destinationIndex += 1;
      }

      const newAggregations = [...aggregations];
      const draggedItems = DragUtils.reorder(
        newAggregations,
        selectedRanges,
        newAggregations,
        destinationIndex
      );
      const insertIndex = DragUtils.adjustDestinationIndex(
        destinationIndex,
        selectedRanges
      );
      const newSelectedRanges: Range[] = [
        [insertIndex, insertIndex + draggedItems.length - 1],
      ];
      changeAggregations(newAggregations);
      setSelectedRanges(newSelectedRanges);
    },
    [changeAggregations, aggregations, selectedRanges, setSelectedRanges]
  );

  const handleOperationChange = useCallback(
    operation => {
      setSelectedOperation(operation);
    },
    [setSelectedOperation]
  );

  const handleAdd = useCallback(() => {
    changeAggregations(
      [
        ...aggregations,
        { operation: selectedOperation, selected: [], invert: true },
      ],
      [selectedOperation]
    );
  }, [aggregations, selectedOperation, changeAggregations]);

  const handleDeleteClicked = useCallback(
    (itemIndex: ModelIndex) => {
      const [keep, remove] = aggregations.reduce(
        ([keepSoFar, removeSoFar], aggregation, index) => {
          if (index === itemIndex) {
            removeSoFar.push(aggregation.operation);
          } else {
            keepSoFar.push(aggregation);
          }
          return [keepSoFar, removeSoFar];
        },
        [[], []] as [Aggregation[], AggregationOperation[]]
      );
      changeAggregations(keep, [], remove);
    },
    [aggregations, changeAggregations]
  );

  const handleAggregationSelectionChange = useCallback(
    newSelectedRanges => {
      setSelectedRanges(newSelectedRanges);
    },
    [setSelectedRanges]
  );

  const handleAggregationSelect = useCallback(
    itemIndex => {
      const aggregation = aggregations[itemIndex];
      if (!AggregationUtils.isRollupOperation(aggregation.operation)) {
        onEdit(aggregation);
      }
    },
    [aggregations, onEdit]
  );

  const handleShowOnTopChange = useCallback(
    (value: string) => {
      changeShowOnTop(value === 'true');
    },
    [changeShowOnTop]
  );

  useEffect(
    function setDefaultOperation() {
      if (options.length > 0 && !options.includes(selectedOperation)) {
        setSelectedOperation(options[0]);
      }
    },
    [options, selectedOperation]
  );

  const renderAggregation = useCallback(
    ({
      item,
      itemIndex,
      isClone = false,
      selectedCount,
    }: DraggableRenderItemProps<Aggregation>) => {
      const text = item.operation;
      const badgeText = isClone ? `${selectedCount}` : undefined;
      const className = isClone ? 'item-list-item-clone' : undefined;
      const isRollupOperation = AggregationUtils.isRollupOperation(
        item.operation
      );
      const isRollupProhibited = AggregationUtils.isRollupProhibited(
        item.operation
      );
      const isEditable = !isClone && !isRollupOperation;
      return (
        <>
          <div
            className={classNames(
              'item-list-item-content',
              'draggable-item-list-item-content',
              className
            )}
          >
            <span className="title">
              {text}
              {!isRollup && isRollupOperation && (
                <span className="small text-warning">
                  <FontAwesomeIcon icon={dhWarningFilled} /> Requires rollup
                </span>
              )}
              {isRollup && isRollupProhibited && (
                <span className="small text-warning">
                  <FontAwesomeIcon icon={dhWarningFilled} /> Not available on
                  rollups
                </span>
              )}
            </span>
            {DraggableItemList.renderBadge({ text: badgeText })}
            {DraggableItemList.renderHandle()}
          </div>
          {!isClone && (
            <>
              <Button
                kind="ghost"
                className="btn-edit"
                icon={vsEdit}
                tooltip="Edit Columns"
                onClick={() => onEdit(item)}
                disabled={!isEditable}
              />
              <Button
                kind="ghost"
                className="btn-delete"
                icon={vsTrash}
                tooltip="Delete Aggregation"
                onClick={() => handleDeleteClicked(itemIndex)}
              />
            </>
          )}
        </>
      );
    },
    [handleDeleteClicked, onEdit, isRollup]
  );

  const isOptionsShown = options.length > 0;
  const isAggregationsShown = aggregations.length > 0;

  return (
    <div className="aggregations">
      {isOptionsShown && (
        <div className="form-inline">
          <Select onChange={handleOperationChange} value={selectedOperation}>
            {options.map(option => (
              <Option value={option} key={option}>
                {option}
              </Option>
            ))}
          </Select>
          <button
            type="button"
            className="btn btn-link btn-add"
            onClick={handleAdd}
          >
            <FontAwesomeIcon icon={dhNewCircleLargeFilled} />
            Add Aggregation
          </button>
        </div>
      )}
      {isOptionsShown && isAggregationsShown && <hr />}
      {isAggregationsShown && (
        <>
          {!isRollup && (
            <div>
              <label id="placement-options-label">Placement:&nbsp;</label>
              <RadioGroup
                aria-labelledby="placement-options-label"
                marginStart="size-125"
                orientation="horizontal"
                onChange={handleShowOnTopChange}
                value={`${showOnTop}`}
              >
                <Radio
                  value="true"
                  isDisabled={!availablePlacements.includes('top')}
                >
                  Top
                </Radio>
                <Radio
                  value="false"
                  isDisabled={!availablePlacements.includes('bottom')}
                >
                  Bottom
                </Radio>
              </RadioGroup>
            </div>
          )}
          <DragDropContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <DraggableItemList<Aggregation>
              className="selected-aggregations"
              itemCount={aggregations.length}
              items={aggregations}
              renderItem={renderAggregation}
              offset={0}
              onSelectionChange={handleAggregationSelectionChange}
              onSelect={handleAggregationSelect}
              selectedRanges={selectedRanges}
              isMultiSelect
            />
          </DragDropContext>
        </>
      )}
    </div>
  );
}

export default Aggregations;
