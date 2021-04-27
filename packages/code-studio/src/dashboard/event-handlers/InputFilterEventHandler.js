import Log from '@deephaven/log';
import { TextUtils } from '@deephaven/utils';
import { InputFilterEvent, PanelEvent } from '../events';
import LayoutUtils from '../../layout/LayoutUtils';

const log = Log.module('InputFilterEventHandler');

const flattenArray = (accumulator, currentValue) =>
  accumulator.concat(currentValue);

/**
 * Handles building the input filter lists and applying them to tables
 */
class InputFilterEventHandler {
  constructor(layout, onInputFiltersChanged) {
    this.handleColumnsChanged = this.handleColumnsChanged.bind(this);
    this.handleFiltersChanged = this.handleFiltersChanged.bind(this);
    this.handleTableChanged = this.handleTableChanged.bind(this);
    this.handlePanelUnmount = this.handlePanelUnmount.bind(this);

    this.layout = layout;
    this.onInputFiltersChanged = onInputFiltersChanged;

    // Map from each panel to the columns for that panel
    this.panelColumns = new Map();

    // Map from each panel to the filters set in that panel
    this.panelFilters = new Map();

    // Map from each panel to the table in that panel
    this.panelTables = new Map();

    this.startListening();
  }

  /**
   * Handler for the COLUMNS_CHANGED event.
   * @param {Component} panel The component that's emitting the filter change
   * @param {Column|Array<Column>} columns The columns in this panel
   */
  handleColumnsChanged(panel, columns) {
    log.debug2('handleColumnsChanged', panel, columns);
    this.panelColumns.set(panel, [].concat(columns));
    this.sendUpdate();
  }

  /**
   * Handler for the FILTERS_CHANGED event.
   * @param {Component} panel The component that's emitting the filter change
   * @param {InputFilter|Array<InputFilter>} filters The input filters set by the panel
   */
  handleFiltersChanged(panel, filters) {
    log.debug2('handleFiltersChanged', panel, filters);
    this.panelFilters.set(panel, [].concat(filters));
    this.sendUpdate();
  }

  handleTableChanged(panel, table) {
    log.debug2('handleTableChanged', panel, table);
    this.panelTables.set(LayoutUtils.getIdFromPanel(panel), table);
    this.sendUpdate();
  }

  handlePanelUnmount(panel) {
    log.debug2('handlePanelUnmount', panel);
    this.panelColumns.delete(panel);
    this.panelFilters.delete(panel);
    this.panelTables.delete(LayoutUtils.getIdFromPanel(panel));
    this.sendUpdate();
  }

  sendUpdate() {
    const columns = [...this.panelColumns.values()]
      .reduce(flattenArray, [])
      .sort((a, b) => {
        const aName = TextUtils.toLower(a.name);
        const bName = TextUtils.toLower(b.name);
        if (aName !== bName) {
          return aName > bName ? 1 : -1;
        }

        const aType = TextUtils.toLower(a.type);
        const bType = TextUtils.toLower(b.type);
        if (aType !== bType) {
          return aType > bType ? 1 : -1;
        }

        return 0;
      })
      .reduce((array, column) => {
        if (
          array.length === 0 ||
          TextUtils.toLower(array[array.length - 1].name) !==
            TextUtils.toLower(column.name) ||
          TextUtils.toLower(array[array.length - 1].type) !==
            TextUtils.toLower(column.type)
        ) {
          array.push(column);
        }

        return array;
      }, []);

    const filters = [...this.panelFilters.values()]
      .reduce(flattenArray, [])
      .sort((a, b) => a.timestamp - b.timestamp);
    const tableMap = new Map(this.panelTables);

    log.debug('sendUpdate', { columns, filters, tableMap });
    this.onInputFiltersChanged({ columns, filters, tableMap });
  }

  startListening() {
    const { eventHub } = this.layout;
    eventHub.on(InputFilterEvent.COLUMNS_CHANGED, this.handleColumnsChanged);
    eventHub.on(InputFilterEvent.FILTERS_CHANGED, this.handleFiltersChanged);
    eventHub.on(InputFilterEvent.TABLE_CHANGED, this.handleTableChanged);

    eventHub.on(PanelEvent.UNMOUNT, this.handlePanelUnmount);
  }

  stopListening() {
    const { eventHub } = this.layout;
    eventHub.off(InputFilterEvent.COLUMNS_CHANGED, this.handleColumnsChanged);
    eventHub.off(InputFilterEvent.FILTERS_CHANGED, this.handleFiltersChanged);
    eventHub.off(InputFilterEvent.TABLE_CHANGED, this.handleTableChanged);

    eventHub.off(PanelEvent.UNMOUNT, this.handlePanelUnmount);
  }
}

export default InputFilterEventHandler;
