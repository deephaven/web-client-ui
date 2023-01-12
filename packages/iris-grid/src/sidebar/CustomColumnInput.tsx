import React, { useCallback } from 'react';
import classNames from 'classnames';
import { Draggable } from 'react-beautiful-dnd';
import { Button } from '@deephaven/components';
import { vsTrash, vsGripper } from '@deephaven/icons';
import { DbNameValidator } from '@deephaven/utils';
import InputEditor from './InputEditor';
import { CustomColumnKey } from './CustomColumnBuilder';

export interface CustomColumnInputProps {
  eventKey: string;
  inputIndex: number;
  name: string;
  formula: string;
  onChange: (
    eventKey: string,
    inputType: CustomColumnKey,
    value: string
  ) => void;
  onDeleteColumn: (eventKey: string) => void;
  onTabInEditor: (editorIndex: number, shiftKey: boolean) => void;
  invalid: boolean;
  isDuplicate: boolean;
}

const INPUT_TYPE = Object.freeze({
  NAME: 'name',
  FORMULA: 'formula',
});

const EMPTY_FN = () => {
  // no-op
};

function CustomColumnInput({
  eventKey,
  name,
  inputIndex,
  formula,
  onChange,
  onDeleteColumn,
  onTabInEditor,
  invalid,
  isDuplicate,
}: CustomColumnInputProps): JSX.Element {
  const isValidName = name === '' || DbNameValidator.isValidColumnName(name);
  const handleFormulaEditorContentChanged = useCallback(
    (formulaValue?: string) => {
      if (formulaValue !== undefined && formulaValue !== '') {
        formulaValue.replace(/(\r\n|\n|\r)/gm, ''); // remove line break
        onChange(eventKey, INPUT_TYPE.FORMULA, formulaValue);
      }
    },
    [onChange, eventKey]
  );

  return (
    <Draggable
      draggableId={eventKey}
      index={inputIndex}
      disableInteractiveElementBlocking
    >
      {(provided, snapshot) => (
        <div
          className={classNames('draggable-container', {
            dragging: snapshot.isDragging,
          })}
          ref={provided.innerRef}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...provided.draggableProps}
        >
          <div className="custom-column-input-container">
            <div className="pb-3">
              <div className="d-flex flex-row custom-column-name">
                <input
                  className={classNames('form-control custom-column-input', {
                    'is-invalid': invalid || !isValidName || isDuplicate,
                  })}
                  placeholder="Column Name"
                  value={name}
                  onChange={event => {
                    onChange(eventKey, INPUT_TYPE.NAME, event.target.value);
                  }}
                />
                <Button
                  kind="ghost"
                  className="ml-1 px-2"
                  onClick={() => {
                    onDeleteColumn(eventKey);
                  }}
                  icon={vsTrash}
                  tooltip="Delete custom column"
                />

                <Button
                  kind="ghost"
                  className="btn-drag-handle"
                  onClick={EMPTY_FN}
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...provided.dragHandleProps}
                  icon={vsGripper}
                  tooltip="Drag column to re-order"
                />
              </div>
              {(!isValidName || isDuplicate) && (
                <p className="validate-label-error text-danger mb-0 mt-2 pl-1">
                  {!isValidName ? 'Invalid name' : 'Duplicate name'}
                </p>
              )}
            </div>
            <InputEditor
              editorSettings={{ language: 'deephavenDb' }}
              editorIndex={inputIndex}
              value={formula}
              onContentChanged={handleFormulaEditorContentChanged}
              onTab={onTabInEditor}
              invalid={invalid}
            />
          </div>
          <hr />
        </div>
      )}
    </Draggable>
  );
}

export default CustomColumnInput;
