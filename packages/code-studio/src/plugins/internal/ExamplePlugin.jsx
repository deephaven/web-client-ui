/* eslint-disable */
import React, { Component } from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@deephaven/components';

class ExamplePlugin extends Component {
  constructor(props) {
    super(props);

    this.getMenu = this.getMenu.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);

    this.confirmButton = React.createRef();

    this.state = {
      isModalOpen: false,
    };
  }

  /**
   * Optional method to get a menu from the plugin.
   *
   * @param {object} data data from deephaven
   */
  getMenu(data) {
    const { onFilter, table } = this.props;
    const { value, column, model } = data;
    const { name, type } = column;
    const actions = [];

    actions.push({
      title: 'Display value',
      group: 0,
      order: 0,
      action: () => alert(value),
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
        onFilter([
          {
            name,
            type,
            value,
          },
        ]),
    });

    subMenu.push({
      title: 'Clear Filter',
      group: 0,
      order: 10,
      action: () => onFilter([]),
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
            <Button
              kind="secondary"
              data-dismiss="modal"
              onClick={this.handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              kind="primary"
              onClick={this.handleCloseModal}
              ref={this.confirmButton}
            >
              Confirm
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default ExamplePlugin;
