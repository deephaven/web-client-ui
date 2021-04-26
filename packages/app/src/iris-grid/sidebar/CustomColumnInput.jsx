import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Draggable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from '@deephaven/components';
import { vsTrash, vsGripper } from '@deephaven/icons';
import InputEditor from './InputEditor';

class CustomColumnInput extends PureComponent {
  static INPUT_TYPE = {
    NAME: 'name',
    FORMULA: 'formula',
  };

  constructor(props) {
    super(props);
    this.handleFormulaEditorContentChanged = this.handleFormulaEditorContentChanged.bind(
      this
    );

    this.editorContainer = null;
    this.formulaEditor = null;
  }

  handleFormulaEditorContentChanged(formulaValue) {
    const { onChange, eventKey } = this.props;
    formulaValue.replace(/(\r\n|\n|\r)/gm, ''); // remove line break
    onChange(eventKey, CustomColumnInput.INPUT_TYPE.FORMULA, formulaValue);
  }

  render() {
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
                      CustomColumnInput.INPUT_TYPE.NAME,
                      event.target.value
                    );
                  }}
                />
                <button
                  type="button"
                  className="btn btn-link btn-link-icon ml-1 px-2"
                  onClick={() => {
                    onDeleteColumn(eventKey);
                  }}
                >
                  <Tooltip>Delete custom column</Tooltip>
                  <FontAwesomeIcon icon={vsTrash} />
                </button>

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

CustomColumnInput.propTypes = {
  eventKey: PropTypes.string.isRequired,
  inputIndex: PropTypes.number,
  name: PropTypes.string,
  formula: PropTypes.string,
  onChange: PropTypes.func,
  onDeleteColumn: PropTypes.func,
  onTabInEditor: PropTypes.func,
  invalid: PropTypes.bool,
};

CustomColumnInput.defaultProps = {
  name: '',
  inputIndex: 0,
  formula: '',
  onChange: () => {},
  onDeleteColumn: () => {},
  onTabInEditor: () => {},
  invalid: false,
};

export default CustomColumnInput;
