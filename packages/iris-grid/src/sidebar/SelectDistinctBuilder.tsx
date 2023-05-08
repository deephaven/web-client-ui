import React, { Component, ReactElement } from 'react';
import deepEqual from 'deep-equal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhNewCircleLargeFilled, vsTrash } from '@deephaven/icons';
import { Button } from '@deephaven/components';
import Log from '@deephaven/log';
import type { Column } from '@deephaven/jsapi-types';
import { ModelIndex } from '@deephaven/grid';
import IrisGridModel from '../IrisGridModel';

import './SelectDistinctBuilder.scss';
import { ColumnName } from '../CommonTypes';

const log = Log.module('SelectDistinctBuilder');

interface SelectDistinctBuilderProps {
  model: IrisGridModel;
  selectDistinctColumns: readonly ColumnName[];
  onChange: (newStr: readonly string[]) => void;
}
interface SelectDistinctBuilderState {
  inputs: readonly string[];
  columns: readonly Column[];
}
class SelectDistinctBuilder extends Component<
  SelectDistinctBuilderProps,
  SelectDistinctBuilderState
> {
  static defaultProps = {
    selectDistinctColumns: [],
    onChange: (): void => undefined,
  };

  constructor(props: SelectDistinctBuilderProps) {
    super(props);

    this.handleAddColumnClick = this.handleAddColumnClick.bind(this);
    this.handleDeleteColumn = this.handleDeleteColumn.bind(this);
    this.handleDropdownChanged = this.handleDropdownChanged.bind(this);

    const { model, selectDistinctColumns } = this.props;

    this.state = {
      inputs:
        selectDistinctColumns.length > 0 ? [...selectDistinctColumns] : [''],
      columns: model.originalColumns,
    };
  }

  componentDidUpdate(
    prevProps: SelectDistinctBuilderProps,
    prevState: SelectDistinctBuilderState
  ): void {
    const { inputs } = this.state;
    const { onChange } = this.props;
    if (prevState.inputs !== inputs) {
      const filteredInputs = inputs.filter(val => val !== '');
      if (
        !deepEqual(
          prevState.inputs.filter(val => val !== ''),
          filteredInputs
        )
      ) {
        onChange(filteredInputs);
      }
    }
  }

  handleAddColumnClick(): void {
    this.setState(({ inputs: prevInputs }) => ({
      inputs: [...prevInputs, ''],
    }));
  }

  handleDeleteColumn(index: ModelIndex): void {
    this.setState(({ inputs }) => ({
      inputs:
        inputs.length === 1 && index === 0
          ? ['']
          : inputs.filter((input, inputIndex) => index !== inputIndex),
    }));
  }

  handleDropdownChanged(
    index: number,
    event: React.ChangeEvent<HTMLSelectElement>
  ): void {
    log.debug('handleDropdownChanged', index, event);
    const { value } = event.target;
    this.setState(({ inputs: prevInputs }) => {
      const inputs = [...prevInputs];
      inputs[index] = value;
      return { inputs };
    });
  }

  renderInputs(): ReactElement[] {
    const { columns, inputs } = this.state;

    return inputs.map((value, index) => {
      const options = columns
        .filter(({ name }) => name === value || !inputs.includes(name))
        .map(({ name }) => (
          <option value={name} key={name}>
            {name}
          </option>
        ));
      return (
        // eslint-disable-next-line react/no-array-index-key
        <div className="form-inline px-3 pb-3" key={index}>
          <select
            className="form-control custom-select col"
            value={value}
            onChange={event => this.handleDropdownChanged(index, event)}
          >
            <option value="">Select a column</option>
            {options}
          </select>

          {(inputs.length > 1 || value !== '') && (
            <Button
              kind="ghost"
              className="ml-1 px-2"
              onClick={() => {
                this.handleDeleteColumn(index);
              }}
              icon={<FontAwesomeIcon icon={vsTrash} transform="grow-3" />}
              tooltip="Delete column"
            />
          )}
        </div>
      );
    });
  }

  render(): React.ReactElement {
    const { columns, inputs } = this.state;
    const disableAddButton = inputs.length >= columns.length;
    return (
      <div
        role="presentation"
        className="select-distinct-builder-container h-100"
      >
        <div className="select-distinct-title">Display Unique Values From</div>

        {this.renderInputs()}

        <hr />

        <div className="pt-1 px-3">
          <Button
            kind="ghost"
            className="btn-add-column"
            onClick={this.handleAddColumnClick}
            disabled={disableAddButton}
            icon={dhNewCircleLargeFilled}
          >
            Add Additional Column
          </Button>
        </div>

        <div className="select-distinct-builder-footer">
          <div className="select-distinct-builder-hint">
            Display only unique values from the selected table columns. Note
            that this will reset any filters and display only the selected
            columns.
          </div>
        </div>
      </div>
    );
  }
}

export default SelectDistinctBuilder;
