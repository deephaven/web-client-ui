import React, { PureComponent, ReactElement } from 'react';
import classNames from 'classnames';
import { Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Tooltip } from '@deephaven/components';
import { vsTrash, vsGripper } from '@deephaven/icons';
import InputEditor from './InputEditor';
import { CustomColumnKey } from './CustomColumnBuilder';

interface CustomColumnInputProps {
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
}
class CustomColumnInput extends PureComponent<
  CustomColumnInputProps,
  Record<string, never>
> {
  static INPUT_TYPE = {
    NAME: 'name',
    FORMULA: 'formula',
  };

  static defaultProps = {
    name: '',
    inputIndex: 0,
    formula: '',
    onChange: (): void => undefined,
    onDeleteColumn: (): void => undefined,
    onTabInEditor: (): void => undefined,
    invalid: false,
  };

  constructor(props: CustomColumnInputProps) {
    super(props);
    this.handleFormulaEditorContentChanged = this.handleFormulaEditorContentChanged.bind(
      this
    );
  }

  handleFormulaEditorContentChanged(formulaValue?: string): void {
    const { onChange, eventKey } = this.props;
    if (formulaValue !== undefined && formulaValue !== '') {
      formulaValue.replace(/(\r\n|\n|\r)/gm, ''); // remove line break
      onChange(
        eventKey,
        CustomColumnInput.INPUT_TYPE.FORMULA as CustomColumnKey,
        formulaValue
      );
    }
  }

  render(): ReactElement {
    const {
      eventKey,
      name,
      formula,
      onChange,
      onDeleteColumn,
      inputIndex,
      onTabInEditor,
      invalid,
    } = this.props;
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
              <div className="d-flex flex-row pb-3 custom-column-name">
                <input
                  className={classNames('form-control custom-column-input', {
                    'is-invalid': invalid,
                  })}
                  placeholder="Column Name"
                  value={name}
                  onChange={event => {
                    onChange(
                      eventKey,
                      CustomColumnInput.INPUT_TYPE.NAME as CustomColumnKey,
                      event.target.value
                    );
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

                <button
                  type="button"
                  className="btn btn-link btn-link-icon px-2 btn-drag-handle"
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...provided.dragHandleProps}
                >
                  <Tooltip>Drag column to re-order</Tooltip>
                  <FontAwesomeIcon icon={vsGripper} />
                </button>
              </div>
              <InputEditor
                editorSettings={{ language: 'deephavenDb' }}
                editorIndex={inputIndex}
                value={formula}
                onContentChanged={this.handleFormulaEditorContentChanged}
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
}

export default CustomColumnInput;
