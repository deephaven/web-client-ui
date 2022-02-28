/* eslint-disable no-alert */
import React, { Component } from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import type { Column, Table } from '@deephaven/jsapi-shim';

type QuickFilterDefinition = { name: string; type: string; value: string };

type IrisGridContextMenuData = {
  value: string;
  column: Column;
  model: unknown;
};

type TablePluginProps = {
  /**
   * Call to filter the table with new filters
   */
  filter: (filters: QuickFilterDefinition[]) => void;

  /**
   * The table object
   */
  table: Table;
};

type TablePluginState = {
  isModalOpen: boolean;
};

/**
 * An example of a TablePlugin. Displays
 *
 * @example
 * from deephaven.TableTools import emptyTable
 * t = emptyTable(5).update("X=i")
 * t.setAttribute("PluginName", "@deephaven/js-plugin-module-template")
 */
class TablePlugin extends Component<TablePluginProps, TablePluginState> {
  constructor(props) {
    super(props);

    this.getMenu = this.getMenu.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);

    this.confirmButton = React.createRef<HTMLButtonElement>();

    this.state = {
      isModalOpen: false,
    };
  }

  private confirmButton: React.RefObject<HTMLButtonElement>;

  /**
   * Optional method to get a context menu from the plugin when clicking inside the table.
   *
   * @param data data from deephaven
   */
  getMenu(data: IrisGridContextMenuData) {
    const { filter, table } = this.props;
    const { value, column, model } = data;
    const { name, type } = column;
    const actions = [];

    actions.push({
      title: 'Display value',
      group: 0,
      order: 0,
      action: () => alert(`${value}`),
    });

    actions.push({
      title: 'Show Dialog',
      group: 0,
      order: 10,
      action: this.handleOpenModal,
    });

    actions.push({
      title: 'Display Table',
      group: 0,
      order: 20,
      action: () => alert(table),
    });

    actions.push({
      title: 'Display Model',
      group: 0,
      order: 30,
      action: () => alert(model),
    });

    const subMenu = [];

    actions.push({
      title: 'Filter Sub Menu',
      group: 0,
      order: 40,
      actions: subMenu,
    });

    subMenu.push({
      title: 'Filter by value',
      group: 0,
      order: 0,
      action: () =>
        filter([
          {
            name,
            type,
            value: `${value}`,
          },
        ]),
    });

    subMenu.push({
      title: 'Clear Filter',
      group: 0,
      order: 10,
      action: () => filter([]),
    });

    return actions;
  }

  handleOpenModal() {
    this.setState({
      isModalOpen: true,
    });
  }

  handleCloseModal() {
    this.setState({
      isModalOpen: false,
    });
  }

  render() {
    const { isModalOpen } = this.state;

    return (
      <div>
        <label>Example Plugin</label>
        <Modal
          isOpen={isModalOpen}
          className="theme-bg-light"
          onOpened={() => {
            this.confirmButton.current.focus();
          }}
        >
          <ModalHeader>Plugin Modal Title</ModalHeader>
          <ModalBody>Plugin Modal Body</ModalBody>
          <ModalFooter>
            <button
              type="button"
              className="btn btn-outline-primary"
              data-dismiss="modal"
              onClick={this.handleCloseModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleCloseModal}
              ref={this.confirmButton}
            >
              Confirm
            </button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default TablePlugin;
