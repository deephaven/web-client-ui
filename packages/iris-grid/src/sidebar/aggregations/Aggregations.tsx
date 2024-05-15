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
import { ModelIndex } from '@deephaven/grid';
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
  settings: AggregationSettings;
  onChange: (settings: AggregationSettings) => void;
  onEdit: (aggregation: Aggregation) => void;
};

function Aggregations({
  isRollup,
  settings,
  onChange,
  onEdit,
}: AggregationsProps): JSX.Element {
  const { aggregations, showOnTop } = settings;
  const options = useMemo(
    () =>
      SELECTABLE_OPTIONS.filter(
        option =>
          !aggregations.some(aggregation => aggregation.operation === option)
      ),
    [aggregations]
  );
  const [selectedOperation, setSelectedOperation] = useState(options[0]);
  const [selectedRanges, setSelectedRanges] = useState<Range[]>([]);
  const changeSettings = useCallback(
    changedSettings => {
      onChange({ ...settings, ...changedSettings });
    },
    [onChange, settings]
  );
  const changeAggregations = useCallback(
    newAggregations => {
      changeSettings({ aggregations: newAggregations });
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
    changeAggregations([
      ...aggregations,
      { operation: selectedOperation, selected: [], invert: true },
    ]);
  }, [aggregations, selectedOperation, changeAggregations]);

  const handleDeleteClicked = useCallback(
    (itemIndex: ModelIndex) => {
      changeAggregations(
        aggregations.filter((aggregation, index) => index !== itemIndex)
      );
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
                <Radio value="true">Top</Radio>
                <Radio value="false">Bottom</Radio>
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
