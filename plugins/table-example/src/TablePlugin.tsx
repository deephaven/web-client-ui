/* eslint-disable no-alert */
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
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

/**
 * An example of a TablePlugin. Displays a header at the top of the grid, and has custom context menu items.
 *
 * @example
 * from deephaven.TableTools import emptyTable
 * t = emptyTable(5).update("X=i")
 * t.setAttribute("PluginName", "@deephaven/js-plugin-module-template")
 */
const TablePlugin = (
  props: TablePluginProps,
  ref: React.Ref<unknown>
): JSX.Element => {
  const { filter, table } = props;
  const [isModalOpen, setModalOpen] = useState(false);
  const confirmButton = useRef<HTMLButtonElement>();

  const handleOpenModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const getMenu = useCallback(
    (data: IrisGridContextMenuData) => {
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
        action: handleOpenModal,
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
    },
    [filter, handleOpenModal, table]
  );
  useImperativeHandle(ref, () => ({
    getMenu,
  }));

  return (
    <div>
      <label>Example Plugin</label>
      <Modal
        isOpen={isModalOpen}
        className="theme-bg-light"
        onOpened={() => {
          confirmButton.current.focus();
        }}
      >
        <ModalHeader>Plugin Modal Title</ModalHeader>
        <ModalBody>Plugin Modal Body</ModalBody>
        <ModalFooter>
          <button
            type="button"
            className="btn btn-outline-primary"
            data-dismiss="modal"
            onClick={handleCloseModal}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCloseModal}
            ref={confirmButton}
          >
            Confirm
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default forwardRef(TablePlugin);
