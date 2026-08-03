import React, { useCallback } from 'react';
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from '@hello-pangea/dnd';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhNewCircleLargeFilled, vsGripper, vsTrash } from '@deephaven/icons';
import { Button, DragUtils, Tooltip } from '@deephaven/components';
import { TableUtils } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import './ConditionalFormattingMenu.scss';
import {
  type BaseFormatConfig,
  type FormattingRule,
  FormatterType,
  BooleanCondition,
  formatRHV,
  getBackgroundForStyleConfig,
  getColorForStyleConfig,
  getShortLabelForConditionType,
  NumberCondition,
  StringCondition,
} from './ConditionalFormattingUtils';
import { type ColumnName } from '../../CommonTypes';

const log = Log.module('ConditionalFormattingMenu');

export type ChangeCallback = (rules: readonly FormattingRule[]) => void;

export type SelectCallback = (index: number) => void;

export type CreateCallback = () => void;

export type ConditionalFormattingMenuProps = {
  rules: readonly FormattingRule[];
  selectedColumn?: ColumnName;
  onChange?: ChangeCallback;
  onCreate?: CreateCallback;
  onSelect?: SelectCallback;
};

const DEFAULT_CALLBACK = (): void => undefined;

function getRuleValue(config: BaseFormatConfig): string {
  const { type } = config.leftHandValue;

  // Null/not-null conditions have no value to display
  if (
    config.condition === StringCondition.IS_NULL ||
    config.condition === StringCondition.IS_NOT_NULL
  ) {
    return '';
  }

  // Boolean IS_TRUE/IS_FALSE have no RHV; IS_EQUAL/IS_NOT_EQUAL do
  if (
    TableUtils.isBooleanType(type) &&
    (config.condition === BooleanCondition.IS_TRUE ||
      config.condition === BooleanCondition.IS_FALSE)
  ) {
    return '';
  }

  if (
    !TableUtils.isNumberType(type) &&
    !TableUtils.isCharType(type) &&
    !TableUtils.isStringType(type) &&
    !TableUtils.isDateType(type) &&
    !TableUtils.isBooleanType(type)
  ) {
    throw new Error(`Invalid column type ${type} in getRuleValue`);
  }

  const quote = TableUtils.isStringType(type) ? '"' : '';
  return formatRHV(config.rightHandValue, quote) ?? '';
}

function getRuleTitle(config: BaseFormatConfig): string {
  const { name: lhvName, type: lhvType } = config.leftHandValue;
  const { formattedColumns } = config;
  const prefix =
    formattedColumns.length > 0
      ? `[${formattedColumns.map(c => c.name).join(', ')}] = `
      : '';
  if (
    TableUtils.isNumberType(lhvType) &&
    config.condition === NumberCondition.IS_BETWEEN
  ) {
    return `${prefix}${config.start} < ${lhvName} < ${config.end}`;
  }
  return `${prefix}${lhvName} ${getShortLabelForConditionType(
    lhvType,
    config.condition
  )} 
    ${getRuleValue(config)}`;
}

function ConditionalFormattingMenu(
  props: ConditionalFormattingMenuProps
): JSX.Element {
  const {
    rules = [],
    onChange = DEFAULT_CALLBACK,
    onCreate = DEFAULT_CALLBACK,
    onSelect = DEFAULT_CALLBACK,
  } = props;

  const handleRuleClick = useCallback(
    (e: React.MouseEvent, rule: FormattingRule, index: number) => {
      e.stopPropagation();
      log.debug('Rule clicked', rule, index);
      onSelect(index);
    },
    [onSelect]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, rule: FormattingRule, index: number) => {
      e.stopPropagation();
      log.debug('Delete button clicked', rule, index);
      const updatedRules = [...rules];
      updatedRules.splice(index, 1);
      onChange(updatedRules);
    },
    [onChange, rules]
  );

  const handleDragHandlerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      DragUtils.stopDragging();

      // if dropped outside the list
      if (result.destination == null) {
        return;
      }
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      const updatedRules = [...rules];
      const sourceInput = rules[sourceIndex];

      updatedRules.splice(sourceIndex, 1);
      updatedRules.splice(destinationIndex, 0, sourceInput);

      onChange(updatedRules);
    },
    [onChange, rules]
  );

  // Display list of rules
  return (
    <div className="conditional-formatting-rules">
      <DragDropContext
        onDragStart={DragUtils.startDragging}
        onDragEnd={handleDragEnd}
      >
        <Droppable droppableId="droppable-custom-columns">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...provided.droppableProps}
              className={classNames('droppable-container', {
                dragging: snapshot.draggingFromThisWith,
              })}
            >
              {rules.length === 0 && (
                <div className="text-muted pl-2">No formats defined</div>
              )}
              {rules.map((rule, index) => (
                <Draggable
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${index}-${rule.type}`}
                  draggableId={`${index}-${rule.type}`}
                  index={index}
                  disableInteractiveElementBlocking
                >
                  {
                    // eslint-disable-next-line @typescript-eslint/no-shadow
                    (provided, snapshot) => (
                      <div
                        role="menuitem"
                        tabIndex={0}
                        onClick={e => handleRuleClick(e, rule, index)}
                        className={classNames('draggable-container', {
                          dragging: snapshot.isDragging,
                        })}
                        ref={provided.innerRef}
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...provided.draggableProps}
                      >
                        <div className="conditional-formatting-list-item">
                          <div className="formatting-item">
                            <div className="rule-icon">
                              <span
                                className="rule-icon-bg"
                                style={{
                                  backgroundColor: getBackgroundForStyleConfig(
                                    (rule.config as BaseFormatConfig).style
                                  ),
                                  color: getColorForStyleConfig(
                                    (rule.config as BaseFormatConfig).style
                                  ),
                                }}
                              >
                                {rule.type === FormatterType.ROWS
                                  ? 'row'
                                  : 'col'}
                              </span>
                            </div>
                            <div className="rule-title">
                              {getRuleTitle(rule.config as BaseFormatConfig)}
                            </div>
                            <Button
                              kind="ghost"
                              className="ml-1 px-2"
                              onClick={e => handleDeleteClick(e, rule, index)}
                              icon={vsTrash}
                              tooltip="Delete rule"
                            />
                            <button
                              type="button"
                              className="btn btn-link btn-link-icon px-2 btn-drag-handle"
                              onClick={handleDragHandlerClick}
                              // eslint-disable-next-line react/jsx-props-no-spreading
                              {...provided.dragHandleProps}
                            >
                              <Tooltip>Drag to re-order</Tooltip>
                              <FontAwesomeIcon icon={vsGripper} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  }
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <hr />
      <Button kind="ghost" onClick={onCreate} icon={dhNewCircleLargeFilled}>
        Add New Rule
      </Button>
    </div>
  );
}

export default ConditionalFormattingMenu;
