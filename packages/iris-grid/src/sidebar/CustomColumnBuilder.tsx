import React, { Component, ReactElement } from 'react';
import classNames from 'classnames';
import shortid from 'shortid';
import memoize from 'memoize-one';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, DragUtils, LoadingSpinner } from '@deephaven/components';
import { dhNewCircleLargeFilled, vsWarning, vsPass } from '@deephaven/icons';
import { DbNameValidator } from '@deephaven/utils';
import CustomColumnInput from './CustomColumnInput';
import './CustomColumnBuilder.scss';
import IrisGridModel from '../IrisGridModel';

export type CustomColumnKey = 'eventKey' | 'name' | 'formula';

type Input = {
  eventKey: string;
  name: string;
  formula: string;
};
export interface CustomColumnBuilderProps {
  model: IrisGridModel;
  customColumns: readonly string[];
  onSave: (columns: readonly string[]) => void;
  onCancel: () => void;
}

interface CustomColumnBuilderState {
  inputs: readonly Input[];
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
    if (this.successButtonTimer) {
      clearTimeout(this.successButtonTimer);
    }
  }

  container: HTMLDivElement | null;

  successButtonTimer: ReturnType<typeof setTimeout> | null;

  getInput = memoize((inputs: readonly Input[], key: string) =>
    inputs.find(input => input.eventKey === key)
  );

  getInputIndex = memoize((inputs: readonly Input[], key: string) =>
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

  parseCustomColumns(customColumns: readonly string[]): void {
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
      (this.container?.querySelectorAll('.btn-drag-handle')[
        focusEditorIndex
      ] as HTMLButtonElement).focus();
      return;
    }
    if (focusEditorIndex === inputs.length - 1) {
      (this.container?.querySelector(
        '.btn-add-column'
      ) as HTMLButtonElement)?.focus();
    } else {
      // focus on next column name input
      const nextFocusIndex = focusEditorIndex + 1;
      (this.container?.querySelectorAll(`.custom-column-input`)[
        nextFocusIndex
      ] as HTMLInputElement).focus();
    }
  }

  handleSaveClick(): void {
    const { onSave, customColumns: originalCustomColumns } = this.props;
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
    this.setState({
      // If both are 0, then moving from no custom to no custom. The parent won't re-render to cancel the loading state
      isCustomColumnApplying:
        customColumns.length > 0 || originalCustomColumns.length > 0,
    });
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

    const nameCount = new Map();
    inputs.forEach(({ name }) =>
      nameCount.set(name, (nameCount.get(name) ?? 0) + 1)
    );

    return inputs.map((input, index) => {
      const { eventKey, name, formula } = input;
      const isDuplicate = (nameCount.get(name) ?? 0) > 1;
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
          isDuplicate={isDuplicate}
        />
      );
    });
  }

  renderSaveButton(): ReactElement {
    const { inputs, isCustomColumnApplying, isSuccessShowing } = this.state;
    const saveText = inputs.length > 1 ? 'Save Columns' : 'Save Column';
    const areNamesValid = inputs.every(
      ({ name }) => name === '' || DbNameValidator.isValidColumnName(name)
    );
    const filteredNames = inputs
      .filter(({ name }) => name !== '')
      .map(({ name }) => name);
    const areNamesUnique = new Set(filteredNames).size === filteredNames.length;

    return (
      <Button
        kind={isSuccessShowing ? 'success' : 'primary'}
        className={classNames('btn-apply', {
          'btn-spinner': isCustomColumnApplying,
        })}
        disabled={
          isSuccessShowing ||
          isCustomColumnApplying ||
          !areNamesValid ||
          !areNamesUnique
        }
        onClick={this.handleSaveClick}
      >
        {isCustomColumnApplying && (
          <span>
            <LoadingSpinner />
            <span className="btn-normal-content">Applying</span>
          </span>
        )}
        {!isSuccessShowing && !isCustomColumnApplying && saveText}
        {isSuccessShowing && (
          <>
            <FontAwesomeIcon icon={vsPass} /> Success
          </>
        )}
      </Button>
    );
  }

  render(): JSX.Element {
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
          <Button
            kind="ghost"
            className="btn-add-column"
            onClick={this.handleAddColumnClick}
            icon={dhNewCircleLargeFilled}
          >
            Add Another Column
          </Button>
        </div>

        <div className="custom-column-builder-footer">
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <div className="d-flex justify-content-end">
            <Button kind="secondary" className="mr-2" onClick={onCancel}>
              Cancel
            </Button>
            {this.renderSaveButton()}
          </div>
        </div>
      </div>
    );
  }
}

export default CustomColumnBuilder;
