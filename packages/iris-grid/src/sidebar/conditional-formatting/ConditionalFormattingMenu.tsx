import React, { useCallback } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhNewCircleLargeFilled, vsGripper, vsTrash } from '@deephaven/icons';
import { Button, DragUtils, Tooltip } from '@deephaven/components';
import Log from '@deephaven/log';

import './ConditionalFormattingMenu.scss';
import {
  BaseFormatConfig,
  FormattingRule,
  FormatterType,
  getBackgroundForStyleConfig,
  getColorForStyleConfig,
  getShortLabelForConditionType,
  NumberCondition,
  StringCondition,
  DateCondition,
} from './ConditionalFormattingUtils';
import TableUtils from '../../TableUtils';

const log = Log.module('ConditionalFormattingMenu');

export type ChangeCallback = (rules: FormattingRule[]) => void;

export type SelectCallback = (index: number) => void;

export type CreateCallback = () => void;

export type ConditionalFormattingMenuProps = {
  rules: FormattingRule[];
  selectedColumn?: string;
  onChange?: ChangeCallback;
  onCreate?: CreateCallback;
  onSelect?: SelectCallback;
};

const DEFAULT_CALLBACK = () => undefined;

function getRuleValue(config: BaseFormatConfig): string {
  const {
    column: { type },
  } = config;
  if (TableUtils.isNumberType(type)) {
    return config.condition === NumberCondition.IS_NULL ||
      config.condition === NumberCondition.IS_NOT_NULL
      ? ''
      : `${config.value}`;
  }
  if (TableUtils.isCharType(type)) {
    return config.condition === DateCondition.IS_NULL ||
      config.condition === DateCondition.IS_NOT_NULL
      ? ''
      : `${config.value}`;
  }
  if (TableUtils.isTextType(type)) {
    return config.condition === StringCondition.IS_NULL ||
      config.condition === StringCondition.IS_NOT_NULL
      ? ''
      : `"${config.value}"`;
  }
  if (TableUtils.isDateType(type)) {
    return config.condition === DateCondition.IS_NULL ||
      config.condition === DateCondition.IS_NOT_NULL
      ? ''
      : `${config.value}`;
  }
  if (TableUtils.isBooleanType(type)) {
    return '';
  }
  throw new Error(`Invalid column type ${type} in getRuleValue`);
}

function getRuleTitle(config: BaseFormatConfig): string {
  if (
    TableUtils.isNumberType(config.column.type) &&
    config.condition === NumberCondition.IS_BETWEEN
  ) {
    return `${config.start} < ${config.column.name} < ${config.end}`;
  }
  return `${config.column.name} ${getShortLabelForConditionType(
    (config as BaseFormatConfig).column.type,
    (config as BaseFormatConfig).condition
  )} 
    ${getRuleValue(config as BaseFormatConfig)}`;
}

const ConditionalFormattingMenu = (
  props: ConditionalFormattingMenuProps
): JSX.Element => {
  const {
    rules = [],
    onChange = DEFAULT_CALLBACK,
    onCreate = DEFAULT_CALLBACK,
    onSelect = DEFAULT_CALLBACK,
  } = props;

  const handleRuleClick = useCallback(
    (e, rule, index) => {
      e.stopPropagation();
      log.debug('Rule clicked', rule, index);
      onSelect(index);
    },
    [onSelect]
  );

  const handleDeleteClick = useCallback(
    (e, rule, index) => {
      e.stopPropagation();
      log.debug('Delete button clicked', rule, index);
      const updatedRules = [...rules];
      updatedRules.splice(index, 1);
      onChange(updatedRules);
    },
    [onChange, rules]
  );

  const handleDragHandlerClick = useCallback(e => {
    e.stopPropagation();
  }, []);

  const handleDragEnd = useCallback(
    result => {
      DragUtils.stopDragging();

      // if dropped outside the list
      if (!result.destination) {
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
                            <button
                              type="button"
                              className="btn btn-link btn-link-icon ml-1 px-2"
                              onClick={e => handleDeleteClick(e, rule, index)}
                            >
                              <Tooltip>Delete rule</Tooltip>
                              <FontAwesomeIcon icon={vsTrash} />
                            </button>

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
};

export default ConditionalFormattingMenu;
