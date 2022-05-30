import React, { Component, ReactElement } from 'react';
import classNames from 'classnames';
import shortid from 'shortid';
import memoize from 'memoize-one';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DragUtils, LoadingSpinner } from '@deephaven/components';
import { dhNewCircleLargeFilled, vsWarning, vsPass } from '@deephaven/icons';
import CustomColumnInput from './CustomColumnInput';
import './CustomColumnBuilder.scss';
import IrisGridModel from '../IrisGridModel';

export type CustomColumnKey = 'eventKey' | 'name' | 'formula';

type Input = {
  eventKey: string;
  name: string;
  formula: string;
};
interface CustomColumnBuilderProps {
  model: IrisGridModel;
  customColumns: string[];
  onSave: (columns: string[]) => void;
  onCancel: () => void;
}

interface CustomColumnBuilderState {
  inputs: Input[];
  isCustomColumnApplying: boolean;
  errorMessage: ReactElement | null;
  hasRequestFailed: boolean;
  isSuccessShowing: boolean;
}
class CustomColumnBuilder extends Component<
  CustomColumnBuilderProps,
  CustomColumnBuilderState
> {
  static SUCCESS_SHOW_DURATION = 750;

  static defaultProps: {
    customColumns: never[];
    onSave: () => void;
    onCancel: () => void;
  };

  static makeCustomColumnInputEventKey(): string {
    return shortid.generate();
  }

  static createCustomColumnInput(): Input {
    return {
      eventKey: shortid.generate(),
      name: '',
      formula: '',
    };
  }

  constructor(props: CustomColumnBuilderProps) {
    super(props);

    this.handleAddColumnClick = this.handleAddColumnClick.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleDeleteColumn = this.handleDeleteColumn.bind(this);
    this.handleCustomColumnUpdated = this.handleCustomColumnUpdated.bind(this);
    this.handleRequestFailed = this.handleRequestFailed.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.resetRequestFailed = this.resetRequestFailed.bind(this);

    this.handleEditorTabNavigation = this.handleEditorTabNavigation.bind(this);

    this.state = {
      inputs: [],
      isCustomColumnApplying: false,
      errorMessage: null,
      hasRequestFailed: false,
      isSuccessShowing: false,
    };
    this.container = null;
    this.successButtonTimer = null;
  }

  componentDidMount(): void {
    const { customColumns } = this.props;
    this.parseCustomColumns(customColumns);
    this.startListening();
  }

  componentWillUnmount(): void {
    this.stopListening();
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
    if (this.successButtonTimer) {
      clearTimeout(this.successButtonTimer);
    }
  }

  container: HTMLDivElement | null;

  successButtonTimer: NodeJS.Timeout | null;

  messageTimer: undefined;

  getInput = memoize((inputs: Input[], key: string) =>
    inputs.find(input => input.eventKey === key)
  );

  getInputIndex = memoize((inputs: Input[], key: string) =>
    inputs.findIndex(input => input.eventKey === key)
  );

  resetErrorMessage(): void {
    this.setState({ errorMessage: null });
  }

  startListening(): void {
    const { model } = this.props;
    model.addEventListener(
      IrisGridModel.EVENT.COLUMNS_CHANGED,
      this.handleCustomColumnUpdated
    );
    model.addEventListener(
      IrisGridModel.EVENT.UPDATED,
      this.handleCustomColumnUpdated
    );
    model.addEventListener(
      IrisGridModel.EVENT.REQUEST_FAILED,
      this.handleRequestFailed
    );
  }

  stopListening(): void {
    const { model } = this.props;
    model.removeEventListener(
      IrisGridModel.EVENT.COLUMNS_CHANGED,
      this.handleCustomColumnUpdated
    );
    model.removeEventListener(
      IrisGridModel.EVENT.UPDATED,
      this.handleCustomColumnUpdated
    );
    model.removeEventListener(
      IrisGridModel.EVENT.REQUEST_FAILED,
      this.handleRequestFailed
    );
  }

  parseCustomColumns(customColumns: string[]): void {
    if (customColumns.length > 0) {
      const customColumnInputs = customColumns.map(customColumn => {
        const input = customColumn.split(/=(.+)/, 2);
        return {
          eventKey: CustomColumnBuilder.makeCustomColumnInputEventKey(),
          name: input[0],
          formula: input[1],
        };
      });
      this.setState({ inputs: customColumnInputs });
    } else {
      this.setState({
        inputs: [CustomColumnBuilder.createCustomColumnInput()],
      });
    }
  }

  handleAddColumnClick(): void {
    const { inputs } = this.state;
    const newInputs = [...inputs];
    newInputs.push(CustomColumnBuilder.createCustomColumnInput());
    this.setState({
      inputs: newInputs,
    });
  }

  handleDeleteColumn(eventKey: string): void {
    const { inputs } = this.state;
    const customColumnIndex = this.getInputIndex(inputs, eventKey);
    const newInputs = [...inputs];
    newInputs.splice(customColumnIndex, 1);
    if (newInputs.length === 0) {
      newInputs.push(CustomColumnBuilder.createCustomColumnInput());
    }
    this.setState({
      inputs: newInputs,
    });
  }

  handleInputChange(
    eventKey: string,
    type: CustomColumnKey,
    value: string
  ): void {
    const { inputs } = this.state;
    const customColumnIndex = this.getInputIndex(inputs, eventKey);
    const customColumnInput = this.getInput(inputs, eventKey);

    const newCustomInput = { ...customColumnInput } as Input;
    newCustomInput[type] = value;

    const newInputs = [...inputs];
    newInputs.splice(customColumnIndex, 1, newCustomInput);
    this.setState({
      inputs: newInputs,
    });
  }

  handleCustomColumnUpdated(): void {
    const { isCustomColumnApplying } = this.state;
    if (!isCustomColumnApplying) {
      return;
    }
    this.setState(
      { isCustomColumnApplying: false, isSuccessShowing: true },
      () => {
        this.successButtonTimer = setTimeout(
          () => this.setState({ isSuccessShowing: false }),
          CustomColumnBuilder.SUCCESS_SHOW_DURATION
        );
      }
    );
  }

  handleRequestFailed(event: Event): void {
    const customEvent = event as CustomEvent;
    const { isCustomColumnApplying } = this.state;
    if (!isCustomColumnApplying) {
      return;
    }

    this.setState({
      isCustomColumnApplying: false,
      errorMessage: (
        <>
          <p>
            <FontAwesomeIcon icon={vsWarning} /> Failed to apply custom columns.
          </p>
          <div className="error-box">
            {customEvent.detail.errorMessage}
            <br />
            Table configuration:{' '}
            {JSON.stringify(customEvent.detail.configuration)}
          </div>
        </>
      ),
      hasRequestFailed: true,
    });
  }

  handleDragEnd(result: DropResult): void {
    DragUtils.stopDragging();

    // if dropped outside the list
    if (!result.destination) {
      return;
    }
    const { inputs } = this.state;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    const newInputs = [...inputs];
    const sourceInput = inputs[sourceIndex];

    newInputs.splice(sourceIndex, 1);
    newInputs.splice(destinationIndex, 0, sourceInput);

    this.setState({ inputs: newInputs });
  }

  handleEditorTabNavigation(focusEditorIndex: number, shiftKey: boolean): void {
    const { inputs } = this.state;
    // focus on drag handle
    if (shiftKey) {
      (this.container?.querySelectorAll(`.btn-drag-handle`)[
        focusEditorIndex
      ] as HTMLButtonElement).focus();
      return;
    }
    if (focusEditorIndex === inputs.length - 1) {
      (this.container?.querySelectorAll(`.btn-add-column`)[
        focusEditorIndex
      ] as HTMLButtonElement).focus();
    } else {
      // focus on next column name input
      const nextFocusIndex = focusEditorIndex + 1;
      (this.container?.querySelectorAll(`.custom-column-input`)[
        nextFocusIndex
      ] as HTMLInputElement).focus();
    }
  }

  handleSaveClick(): void {
    const { onSave } = this.props;
    const { inputs, isCustomColumnApplying } = this.state;
    if (isCustomColumnApplying) {
      return;
    }
    const customColumns = [] as string[];
    inputs.forEach(input => {
      const { name, formula } = input;
      if (name && formula) {
        customColumns.push(`${name}=${formula}`);
      }
    });
    this.resetErrorMessage();
    this.setState({ isCustomColumnApplying: true });
    onSave(customColumns);
  }

  resetRequestFailed(): void {
    this.setState(({ hasRequestFailed }) => {
      if (hasRequestFailed) {
        return { hasRequestFailed: false };
      }
      return null;
    });
  }

  renderInputs(): ReactElement[] {
    const { inputs, hasRequestFailed } = this.state;

    return inputs.map((input, index) => {
      const { eventKey, name, formula } = input;
      return (
        <CustomColumnInput
          key={eventKey}
          inputIndex={index}
          eventKey={eventKey}
          name={name}
          formula={formula}
          onChange={this.handleInputChange}
          onDeleteColumn={this.handleDeleteColumn}
          onTabInEditor={this.handleEditorTabNavigation}
          invalid={hasRequestFailed}
        />
      );
    });
  }

  renderSaveButton(): ReactElement {
    const { inputs, isCustomColumnApplying, isSuccessShowing } = this.state;
    const saveText = inputs.length > 1 ? 'Save Columns' : 'Save Column';

    return (
      <button
        type="button"
        className={classNames(
          'btn btn-apply',
          {
            'btn-spinner': isCustomColumnApplying,
          },
          isSuccessShowing ? 'btn-success' : 'btn-primary'
        )}
        disabled={isSuccessShowing || isCustomColumnApplying}
        onClick={this.handleSaveClick}
      >
        {isCustomColumnApplying && (
          <span>
            <LoadingSpinner />
            <span className="btn-normal-content">Applying</span>
            <span className="btn-hover-content">Applying</span>
          </span>
        )}
        {!isSuccessShowing && !isCustomColumnApplying && saveText}
        {isSuccessShowing && (
          <>
            <FontAwesomeIcon icon={vsPass} /> Success
          </>
        )}
      </button>
    );
  }

  render(): ReactElement {
    const { onCancel } = this.props;
    const { errorMessage } = this.state;
    return (
      <div
        role="presentation"
        className="custom-column-builder-container"
        ref={container => {
          this.container = container;
        }}
        onClick={this.resetRequestFailed}
        onFocus={this.resetRequestFailed}
      >
        <div className="section-title">Custom Column Name and Formula</div>
        <hr />
        <DragDropContext
          onDragStart={DragUtils.startDragging}
          onDragEnd={this.handleDragEnd}
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
                {this.renderInputs()}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="pt-1 px-3">
          <button
            type="button"
            className="btn btn-link btn-add-column"
            onClick={this.handleAddColumnClick}
          >
            <FontAwesomeIcon icon={dhNewCircleLargeFilled} />
            Add Another Column
          </button>
        </div>

        <div className="custom-column-builder-footer">
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <div className="d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-outline-primary mr-2"
              onClick={onCancel}
            >
              Cancel
            </button>
            {this.renderSaveButton()}
          </div>
        </div>
      </div>
    );
  }
}

export default CustomColumnBuilder;
